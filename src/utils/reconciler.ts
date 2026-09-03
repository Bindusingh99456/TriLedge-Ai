/**
 * Deterministic & Fuzzy 3-Way Financial Reconciliation Engine for LedgerSync
 */

import {
  BankRecord,
  ErpRecord,
  ExceptionType,
  JournalEntry,
  MatchType,
  RazorpayRecord,
  ReconciledTransaction,
  ReconciliationSummary
} from "../types";

export function perform3WayReconciliation(
  razorpayList: RazorpayRecord[],
  bankList: BankRecord[],
  erpList: ErpRecord[],
  aiFuzzyMatches: Array<{
    razorpayId?: string;
    bankRef?: string;
    invoiceId?: string;
    confidence: number;
    reasoning: string;
  }> = []
): {
  reconciled: ReconciledTransaction[];
  summary: ReconciliationSummary;
  journalEntries: JournalEntry[];
} {
  const reconciled: ReconciledTransaction[] = [];
  const journalEntries: JournalEntry[] = [];

  // Track matched items to avoid double matching
  const matchedRazorpayIds = new Set<string>();
  const matchedBankRefs = new Set<string>();
  const matchedInvoiceIds = new Set<string>();

  // Maps for fast indexing
  const erpByOrderId = new Map<string, ErpRecord>();
  const erpByInvoiceId = new Map<string, ErpRecord>();
  erpList.forEach(e => {
    if (e.orderId) erpByOrderId.set(e.orderId, e);
    if (e.invoiceId) erpByInvoiceId.set(e.invoiceId, e);
  });

  const bankByUtr = new Map<string, BankRecord>();
  bankList.forEach(b => {
    if (b.utrNumber) bankByUtr.set(b.utrNumber, b);
  });

  // Helper to generate Journal Entry
  function createJournalEntry(
    txId: string,
    refId: string,
    date: string,
    customerName: string,
    gross: number,
    fee: number,
    net: number
  ): JournalEntry {
    return {
      id: `JE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: date || new Date().toISOString().split("T")[0],
      transactionId: txId,
      referenceId: refId,
      description: `Settlement & Fee Adjustment for Order ${refId} (${customerName})`,
      debitAccount: "HDFC Bank Account A/C #9012",
      debitAmount: net,
      feeAccount: "Payment Gateway Charges (Razorpay)",
      feeAmount: fee,
      creditAccount: "Accounts Receivable / Sales",
      creditAmount: gross,
      status: "POSTED"
    };
  }

  // PASS 1 & 2 & 3: Deterministic matching across Razorpay Records
  for (const rzp of razorpayList) {
    if (matchedRazorpayIds.has(rzp.paymentId)) continue;

    // Find linked ERP record
    const linkedErp = erpByOrderId.get(rzp.orderId);
    
    // Find linked Bank record by UTR
    let linkedBank = rzp.utrReference ? bankByUtr.get(rzp.utrReference) : undefined;

    // If UTR didn't hit, check bank description for UTR reference or payment ID
    if (!linkedBank) {
      linkedBank = bankList.find(
        b => !matchedBankRefs.has(b.bankRef) && (
          (rzp.utrReference && b.description.includes(rzp.utrReference)) ||
          b.description.includes(rzp.paymentId) ||
          b.description.includes(rzp.orderId)
        )
      );
    }

    // SCENARIO 1: Full 3-Way Net Fee Adjustment Match (The Gold Standard)
    // ERP Amount (e.g. 12500) - Rzp Fee (250) = Bank Credit (12250)
    if (linkedErp && linkedBank) {
      const isNetMatch = Math.abs((rzp.transactionAmount - rzp.gatewayFee) - linkedBank.creditAmount) < 1;
      const isErpMatch = Math.abs(linkedErp.expectedAmount - rzp.transactionAmount) < 1;
      
      if (isNetMatch && isErpMatch) {
        matchedRazorpayIds.add(rzp.paymentId);
        matchedBankRefs.add(linkedBank.bankRef);
        matchedInvoiceIds.add(linkedErp.invoiceId);

        reconciled.push({
          id: `REC-${rzp.paymentId}`,
          matchType: MatchType.FEE_ADJUSTED,
          confidenceScore: 100,
          reasoning: `3-Way Net Match: Sales ₹${rzp.transactionAmount.toLocaleString()} - Gateway Fee ₹${rzp.gatewayFee.toLocaleString()} = Net Bank Credit ₹${linkedBank.creditAmount.toLocaleString()}. UTR matched (${rzp.utrReference}).`,
          razorpay: rzp,
          bank: linkedBank,
          erp: linkedErp,
          grossAmount: rzp.transactionAmount,
          feeDeducted: rzp.gatewayFee,
          refundDeducted: linkedErp.refundAmount,
          netBankReceived: linkedBank.creditAmount,
          variance: 0,
          reconciledAt: new Date().toISOString()
        });

        // Add Journal Voucher
        journalEntries.push(
          createJournalEntry(
            rzp.paymentId,
            rzp.orderId,
            rzp.settlementDate,
            rzp.customerName,
            rzp.transactionAmount,
            rzp.gatewayFee,
            linkedBank.creditAmount
          )
        );
        continue;
      }

      // SCENARIO 2: Partial Refund Match
      if (linkedErp.refundAmount > 0) {
        const netAfterRefundAndFee = rzp.transactionAmount - rzp.gatewayFee - linkedErp.refundAmount;
        if (Math.abs(netAfterRefundAndFee - linkedBank.creditAmount) < 2) {
          matchedRazorpayIds.add(rzp.paymentId);
          matchedBankRefs.add(linkedBank.bankRef);
          matchedInvoiceIds.add(linkedErp.invoiceId);

          reconciled.push({
            id: `REC-${rzp.paymentId}`,
            matchType: MatchType.PARTIAL_REFUND,
            confidenceScore: 98,
            reasoning: `Partial Refund Reconciliation: Sales ₹${rzp.transactionAmount.toLocaleString()} - Refund ₹${linkedErp.refundAmount.toLocaleString()} - Fee ₹${rzp.gatewayFee.toLocaleString()} = Net Bank ₹${linkedBank.creditAmount.toLocaleString()}.`,
            razorpay: rzp,
            bank: linkedBank,
            erp: linkedErp,
            grossAmount: rzp.transactionAmount,
            feeDeducted: rzp.gatewayFee,
            refundDeducted: linkedErp.refundAmount,
            netBankReceived: linkedBank.creditAmount,
            variance: 0,
            reconciledAt: new Date().toISOString()
          });

          journalEntries.push({
            id: `JE-REF-${Math.floor(1000 + Math.random() * 9000)}`,
            date: rzp.settlementDate,
            transactionId: rzp.paymentId,
            referenceId: rzp.orderId,
            description: `Partial Refund & Fee Net Adjustment for Order ${rzp.orderId}`,
            debitAccount: "HDFC Bank Account A/C #9012",
            debitAmount: linkedBank.creditAmount,
            feeAccount: "Payment Gateway Fee / Sales Refund",
            feeAmount: rzp.gatewayFee + linkedErp.refundAmount,
            creditAccount: "Accounts Receivable",
            creditAmount: rzp.transactionAmount,
            status: "POSTED"
          });
          continue;
        }
      }

      // SCENARIO 3: Delayed Settlement Date Match (Value Date is 1-3 days after RZP settlement date)
      if (rzp.settlementDate && linkedBank.valueDate) {
        const rzpDate = new Date(rzp.settlementDate).getTime();
        const bankDate = new Date(linkedBank.valueDate).getTime();
        const diffDays = (bankDate - rzpDate) / (1000 * 3600 * 24);

        if (diffDays >= 1 && diffDays <= 3 && Math.abs((rzp.transactionAmount - rzp.gatewayFee) - linkedBank.creditAmount) < 1) {
          matchedRazorpayIds.add(rzp.paymentId);
          matchedBankRefs.add(linkedBank.bankRef);
          matchedInvoiceIds.add(linkedErp.invoiceId);

          reconciled.push({
            id: `REC-${rzp.paymentId}`,
            matchType: MatchType.DELAYED_SETTLEMENT,
            confidenceScore: 95,
            reasoning: `Delayed Settlement Match (+${Math.round(diffDays)} days delay): Settlement posted on ${linkedBank.valueDate} vs transaction date ${rzp.settlementDate}. Net amounts align perfectly.`,
            razorpay: rzp,
            bank: linkedBank,
            erp: linkedErp,
            grossAmount: rzp.transactionAmount,
            feeDeducted: rzp.gatewayFee,
            refundDeducted: 0,
            netBankReceived: linkedBank.creditAmount,
            variance: 0,
            reconciledAt: new Date().toISOString()
          });

          journalEntries.push(
            createJournalEntry(
              rzp.paymentId,
              rzp.orderId,
              linkedBank.valueDate,
              rzp.customerName,
              rzp.transactionAmount,
              rzp.gatewayFee,
              linkedBank.creditAmount
            )
          );
          continue;
        }
      }
    }
  }

  // PASS 4: AI Fuzzy Matches check
  if (aiFuzzyMatches && aiFuzzyMatches.length > 0) {
    for (const fuzzy of aiFuzzyMatches) {
      if (fuzzy.confidence < 60) continue;

      const rzp = fuzzy.razorpayId ? razorpayList.find(r => r.paymentId === fuzzy.razorpayId && !matchedRazorpayIds.has(r.paymentId)) : undefined;
      const bank = fuzzy.bankRef ? bankList.find(b => b.bankRef === fuzzy.bankRef && !matchedBankRefs.has(b.bankRef)) : undefined;
      const erp = fuzzy.invoiceId ? erpList.find(e => e.invoiceId === fuzzy.invoiceId && !matchedInvoiceIds.has(e.invoiceId)) : undefined;

      if ((rzp || erp) && bank) {
        if (rzp) matchedRazorpayIds.add(rzp.paymentId);
        if (bank) matchedBankRefs.add(bank.bankRef);
        if (erp) matchedInvoiceIds.add(erp.invoiceId);

        const gross = rzp ? rzp.transactionAmount : (erp ? erp.expectedAmount : bank.creditAmount);
        const fee = rzp ? rzp.gatewayFee : Math.max(0, gross - bank.creditAmount);
        const net = bank.creditAmount;

        reconciled.push({
          id: `REC-AI-${Math.floor(1000 + Math.random() * 9000)}`,
          matchType: MatchType.AI_FUZZY_MATCHED,
          confidenceScore: fuzzy.confidence,
          reasoning: `AI Fuzzy Match (${fuzzy.confidence}% confidence): ${fuzzy.reasoning}`,
          razorpay: rzp,
          bank,
          erp,
          grossAmount: gross,
          feeDeducted: fee,
          refundDeducted: erp ? erp.refundAmount : 0,
          netBankReceived: net,
          variance: gross - fee - net,
          reconciledAt: new Date().toISOString()
        });

        journalEntries.push(
          createJournalEntry(
            rzp ? rzp.paymentId : bank.bankRef,
            erp ? erp.orderId : "FUZZY-ORD",
            bank.valueDate,
            rzp ? rzp.customerName : (erp ? erp.customerName : "Fuzzy Customer"),
            gross,
            fee,
            net
          )
        );
      }
    }
  }

  // PASS 5: Honest Exception Breakdown for remaining unmatched items
  // Check unmatched Razorpay items
  for (const rzp of razorpayList) {
    if (matchedRazorpayIds.has(rzp.paymentId)) continue;

    const linkedBank = bankList.find(b => !matchedBankRefs.has(b.bankRef) && Math.abs(b.creditAmount - rzp.settlementAmount) < 1);
    const linkedErp = erpByOrderId.get(rzp.orderId);

    let exceptionType = ExceptionType.MISSING_BANK_ENTRY;
    let reasoning = `Missing Bank Credit: Razorpay payment ${rzp.paymentId} for ₹${rzp.transactionAmount.toLocaleString()} has no matching UTR credit in bank statements.`;
    let recommendedAction = "Contact bank acquiring partner to trace settlement UTR and verify payout status.";

    if (linkedBank && Math.abs(rzp.settlementAmount - linkedBank.creditAmount) > 10) {
      exceptionType = ExceptionType.FEE_DISCREPANCY;
      reasoning = `Unexplained Fee Discrepancy: Expected bank credit ₹${rzp.settlementAmount.toLocaleString()}, but bank received ₹${linkedBank.creditAmount.toLocaleString()} (Delta: ₹${Math.abs(rzp.settlementAmount - linkedBank.creditAmount)}).`;
      recommendedAction = "Auditor manual review required: Check for additional merchant chargebacks or GST fee adjustments.";
    } else if (!linkedErp) {
      exceptionType = ExceptionType.UNMATCHED_ERP_RECORD;
      reasoning = `Unmatched ERP Record: Gateway captured payment ${rzp.paymentId}, but internal sales ERP has no record of Order ${rzp.orderId}.`;
      recommendedAction = "Verify if order was placed via guest checkout or custom API integration missing from main ledger.";
    }

    reconciled.push({
      id: `EXC-RZP-${rzp.paymentId}`,
      matchType: MatchType.EXCEPTION_UNRESOLVED,
      confidenceScore: 35,
      reasoning,
      razorpay: rzp,
      bank: linkedBank,
      erp: linkedErp,
      grossAmount: rzp.transactionAmount,
      feeDeducted: rzp.gatewayFee,
      refundDeducted: 0,
      netBankReceived: linkedBank ? linkedBank.creditAmount : 0,
      variance: rzp.transactionAmount - rzp.gatewayFee - (linkedBank ? linkedBank.creditAmount : 0),
      exceptionType,
      exceptionResolution: "Pending Auditor Review",
      recommendedAction,
      manualStatus: "PENDING",
      reconciledAt: new Date().toISOString()
    });
  }

  // Check unmatched Bank records
  for (const b of bankList) {
    if (matchedBankRefs.has(b.bankRef)) continue;

    reconciled.push({
      id: `EXC-BNK-${b.bankRef}`,
      matchType: MatchType.EXCEPTION_UNRESOLVED,
      confidenceScore: 25,
      reasoning: `Unidentified Bank Credit: Bank statement lists credit of ₹${b.creditAmount.toLocaleString()} (${b.description}), but no corresponding Razorpay settlement or ERP order exists.`,
      razorpay: undefined,
      bank: b,
      erp: undefined,
      grossAmount: b.creditAmount,
      feeDeducted: 0,
      refundDeducted: 0,
      netBankReceived: b.creditAmount,
      variance: b.creditAmount,
      exceptionType: ExceptionType.MISSING_BANK_ENTRY,
      exceptionResolution: "Unclaimed Bank Credit",
      recommendedAction: "Check wire transfers or direct NEFT/RTGS credits bypass of Razorpay gateway.",
      manualStatus: "PENDING",
      reconciledAt: new Date().toISOString()
    });
  }

  // Calculate Summary Metrics
  const totalRecordsProcessed = razorpayList.length + bankList.length + erpList.length;
  let totalGrossVolume = 0;
  let totalNetBankCredit = 0;
  let totalGatewayFeesAudited = 0;
  let totalVarianceAmount = 0;

  let exactMatchCount = 0;
  let utrMatchCount = 0;
  let feeAdjustedCount = 0;
  let delayedSettlementCount = 0;
  let partialRefundCount = 0;
  let aiFuzzyMatchedCount = 0;
  let exceptionCount = 0;

  for (const r of reconciled) {
    if (r.matchType !== MatchType.EXCEPTION_UNRESOLVED) {
      totalGrossVolume += r.grossAmount;
      totalNetBankCredit += r.netBankReceived;
      totalGatewayFeesAudited += r.feeDeducted;
    } else {
      exceptionCount++;
      totalVarianceAmount += Math.abs(r.variance);
    }

    if (r.matchType === MatchType.EXACT_MATCH) exactMatchCount++;
    else if (r.matchType === MatchType.UTR_MATCH) utrMatchCount++;
    else if (r.matchType === MatchType.FEE_ADJUSTED) feeAdjustedCount++;
    else if (r.matchType === MatchType.DELAYED_SETTLEMENT) delayedSettlementCount++;
    else if (r.matchType === MatchType.PARTIAL_REFUND) partialRefundCount++;
    else if (r.matchType === MatchType.AI_FUZZY_MATCHED) aiFuzzyMatchedCount++;
  }

  const matchedTotal = reconciled.length - exceptionCount;
  const matchRatePercentage = reconciled.length > 0 ? Math.round((matchedTotal / reconciled.length) * 100) : 0;

  const summary: ReconciliationSummary = {
    totalRecordsProcessed,
    totalGrossVolume,
    totalNetBankCredit,
    totalGatewayFeesAudited,
    exactMatchCount,
    utrMatchCount,
    feeAdjustedCount,
    delayedSettlementCount,
    partialRefundCount,
    aiFuzzyMatchedCount,
    exceptionCount,
    matchRatePercentage,
    totalVarianceAmount,
    journalEntriesGenerated: journalEntries.length
  };

  return { reconciled, summary, journalEntries };
}
