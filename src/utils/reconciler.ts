/**
 * Deterministic & Fuzzy 3-Way Financial Reconciliation Engine for TriLedger AI
 * Enforces strict arbitrary-precision Decimal.js calculations to prevent float precision drift.
 */

import { Decimal } from "decimal.js";
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

export function toDecimal(val: number | string | Decimal | undefined | null): Decimal {
  if (val === undefined || val === null) return new Decimal(0);
  return new Decimal(val);
}

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
    gross: Decimal,
    fee: Decimal,
    net: Decimal
  ): JournalEntry {
    return {
      id: `JE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: date || new Date().toISOString().split("T")[0],
      transactionId: txId,
      referenceId: refId,
      description: `Settlement & Fee Adjustment for Order ${refId} (${customerName})`,
      debitAccount: "HDFC Bank Account A/C #9012",
      debitAmount: net.toNumber(),
      feeAccount: "Payment Gateway Charges (Razorpay)",
      feeAmount: fee.toNumber(),
      creditAccount: "Accounts Receivable / Sales",
      creditAmount: gross.toNumber(),
      status: "POSTED"
    };
  }

  // PASS 1 & 2 & 3: Deterministic matching across Razorpay Records
  for (const rzp of razorpayList) {
    if (matchedRazorpayIds.has(rzp.paymentId)) continue;

    const gross = toDecimal(rzp.transactionAmount);
    const fee = toDecimal(rzp.gatewayFee);
    const rzpNet = gross.minus(fee);

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

    // SCENARIO 1: Full 3-Way Net Fee Adjustment Match (Arbitrary Precision Decimal Match)
    // ERP Amount (e.g. 12500.0000) - Rzp Fee (250.0000) = Bank Credit (12250.0000)
    if (linkedErp && linkedBank) {
      const bankCredit = toDecimal(linkedBank.creditAmount);
      const erpExpected = toDecimal(linkedErp.expectedAmount);

      const isNetMatch = rzpNet.minus(bankCredit).abs().lessThan(0.01);
      const isErpMatch = erpExpected.minus(gross).abs().lessThan(0.01);
      
      if (isNetMatch && isErpMatch) {
        matchedRazorpayIds.add(rzp.paymentId);
        matchedBankRefs.add(linkedBank.bankRef);
        matchedInvoiceIds.add(linkedErp.invoiceId);

        reconciled.push({
          id: `REC-${rzp.paymentId}`,
          matchType: MatchType.FEE_ADJUSTED,
          confidenceScore: 100,
          reasoning: `3-Way Net Match: Sales ₹${gross.toFixed(2)} - Gateway Fee ₹${fee.toFixed(2)} = Net Bank Credit ₹${bankCredit.toFixed(2)}. UTR matched (${rzp.utrReference}).`,
          razorpay: rzp,
          bank: linkedBank,
          erp: linkedErp,
          grossAmount: gross.toNumber(),
          feeDeducted: fee.toNumber(),
          refundDeducted: toDecimal(linkedErp.refundAmount).toNumber(),
          netBankReceived: bankCredit.toNumber(),
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
            gross,
            fee,
            bankCredit
          )
        );
        continue;
      }

      // SCENARIO 2: Partial Refund Match
      const erpRefund = toDecimal(linkedErp.refundAmount);
      if (erpRefund.greaterThan(0)) {
        const netAfterRefundAndFee = rzpNet.minus(erpRefund);
        if (netAfterRefundAndFee.minus(bankCredit).abs().lessThan(0.01)) {
          matchedRazorpayIds.add(rzp.paymentId);
          matchedBankRefs.add(linkedBank.bankRef);
          matchedInvoiceIds.add(linkedErp.invoiceId);

          reconciled.push({
            id: `REC-${rzp.paymentId}`,
            matchType: MatchType.PARTIAL_REFUND,
            confidenceScore: 98,
            reasoning: `Partial Refund Reconciliation: Sales ₹${gross.toFixed(2)} - Refund ₹${erpRefund.toFixed(2)} - Fee ₹${fee.toFixed(2)} = Net Bank ₹${bankCredit.toFixed(2)}.`,
            razorpay: rzp,
            bank: linkedBank,
            erp: linkedErp,
            grossAmount: gross.toNumber(),
            feeDeducted: fee.toNumber(),
            refundDeducted: erpRefund.toNumber(),
            netBankReceived: bankCredit.toNumber(),
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
            debitAmount: bankCredit.toNumber(),
            feeAccount: "Payment Gateway Fee / Sales Refund",
            feeAmount: fee.plus(erpRefund).toNumber(),
            creditAccount: "Accounts Receivable",
            creditAmount: gross.toNumber(),
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

        if (diffDays >= 1 && diffDays <= 3 && rzpNet.minus(bankCredit).abs().lessThan(0.01)) {
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
            grossAmount: gross.toNumber(),
            feeDeducted: fee.toNumber(),
            refundDeducted: 0,
            netBankReceived: bankCredit.toNumber(),
            variance: 0,
            reconciledAt: new Date().toISOString()
          });

          journalEntries.push(
            createJournalEntry(
              rzp.paymentId,
              rzp.orderId,
              linkedBank.valueDate,
              rzp.customerName,
              gross,
              fee,
              bankCredit
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

        const gross = rzp ? toDecimal(rzp.transactionAmount) : (erp ? toDecimal(erp.expectedAmount) : toDecimal(bank.creditAmount));
        const bankCredit = toDecimal(bank.creditAmount);
        const fee = rzp ? toDecimal(rzp.gatewayFee) : Decimal.max(0, gross.minus(bankCredit));
        const erpRefund = erp ? toDecimal(erp.refundAmount) : new Decimal(0);
        const variance = gross.minus(fee).minus(bankCredit);

        reconciled.push({
          id: `REC-AI-${Math.floor(1000 + Math.random() * 9000)}`,
          matchType: MatchType.AI_FUZZY_MATCHED,
          confidenceScore: fuzzy.confidence,
          reasoning: `AI Fuzzy Match (${fuzzy.confidence}% confidence): ${fuzzy.reasoning}`,
          razorpay: rzp,
          bank,
          erp,
          grossAmount: gross.toNumber(),
          feeDeducted: fee.toNumber(),
          refundDeducted: erpRefund.toNumber(),
          netBankReceived: bankCredit.toNumber(),
          variance: variance.toNumber(),
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
            bankCredit
          )
        );
      }
    }
  }

  // PASS 5: Honest Exception Breakdown for remaining unmatched items
  for (const rzp of razorpayList) {
    if (matchedRazorpayIds.has(rzp.paymentId)) continue;

    const gross = toDecimal(rzp.transactionAmount);
    const fee = toDecimal(rzp.gatewayFee);
    const settlementAmt = toDecimal(rzp.settlementAmount);

    const linkedBank = bankList.find(b => !matchedBankRefs.has(b.bankRef) && toDecimal(b.creditAmount).minus(settlementAmt).abs().lessThan(0.01));
    const linkedErp = erpByOrderId.get(rzp.orderId);

    let exceptionType = ExceptionType.MISSING_BANK_ENTRY;
    let reasoning = `Missing Bank Credit: Razorpay payment ${rzp.paymentId} for ₹${gross.toFixed(2)} has no matching UTR credit in bank statements.`;
    let recommendedAction = "Contact bank acquiring partner to trace settlement UTR and verify payout status.";

    const bankCredit = linkedBank ? toDecimal(linkedBank.creditAmount) : new Decimal(0);

    if (linkedBank && settlementAmt.minus(bankCredit).abs().greaterThan(10)) {
      exceptionType = ExceptionType.FEE_DISCREPANCY;
      reasoning = `Unexplained Fee Discrepancy: Expected bank credit ₹${settlementAmt.toFixed(2)}, but bank received ₹${bankCredit.toFixed(2)} (Delta: ₹${settlementAmt.minus(bankCredit).abs().toFixed(2)}).`;
      recommendedAction = "Auditor manual review required: Check for additional merchant chargebacks or GST fee adjustments.";
    } else if (!linkedErp) {
      exceptionType = ExceptionType.UNMATCHED_ERP_RECORD;
      reasoning = `Unmatched ERP Record: Gateway captured payment ${rzp.paymentId}, but internal sales ERP has no record of Order ${rzp.orderId}.`;
      recommendedAction = "Verify if order was placed via guest checkout or custom API integration missing from main ledger.";
    }

    const variance = gross.minus(fee).minus(bankCredit);

    reconciled.push({
      id: `EXC-RZP-${rzp.paymentId}`,
      matchType: MatchType.EXCEPTION_UNRESOLVED,
      confidenceScore: 35,
      reasoning,
      razorpay: rzp,
      bank: linkedBank,
      erp: linkedErp,
      grossAmount: gross.toNumber(),
      feeDeducted: fee.toNumber(),
      refundDeducted: 0,
      netBankReceived: bankCredit.toNumber(),
      variance: variance.toNumber(),
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

    const bankCredit = toDecimal(b.creditAmount);

    reconciled.push({
      id: `EXC-BNK-${b.bankRef}`,
      matchType: MatchType.EXCEPTION_UNRESOLVED,
      confidenceScore: 25,
      reasoning: `Unidentified Bank Credit: Bank statement lists credit of ₹${bankCredit.toFixed(2)} (${b.description}), but no corresponding Razorpay settlement or ERP order exists.`,
      razorpay: undefined,
      bank: b,
      erp: undefined,
      grossAmount: bankCredit.toNumber(),
      feeDeducted: 0,
      refundDeducted: 0,
      netBankReceived: bankCredit.toNumber(),
      variance: bankCredit.toNumber(),
      exceptionType: ExceptionType.MISSING_BANK_ENTRY,
      exceptionResolution: "Unclaimed Bank Credit",
      recommendedAction: "Check wire transfers or direct NEFT/RTGS credits bypass of Razorpay gateway.",
      manualStatus: "PENDING",
      reconciledAt: new Date().toISOString()
    });
  }

  // Calculate Summary Metrics with Arbitrary Precision Decimal Accumulators
  const totalRecordsProcessed = razorpayList.length + bankList.length + erpList.length;
  let totalGrossVolumeDecimal = new Decimal(0);
  let totalNetBankCreditDecimal = new Decimal(0);
  let totalGatewayFeesAuditedDecimal = new Decimal(0);
  let totalVarianceAmountDecimal = new Decimal(0);

  let exactMatchCount = 0;
  let utrMatchCount = 0;
  let feeAdjustedCount = 0;
  let delayedSettlementCount = 0;
  let partialRefundCount = 0;
  let aiFuzzyMatchedCount = 0;
  let exceptionCount = 0;

  for (const r of reconciled) {
    if (r.matchType !== MatchType.EXCEPTION_UNRESOLVED) {
      totalGrossVolumeDecimal = totalGrossVolumeDecimal.plus(toDecimal(r.grossAmount));
      totalNetBankCreditDecimal = totalNetBankCreditDecimal.plus(toDecimal(r.netBankReceived));
      totalGatewayFeesAuditedDecimal = totalGatewayFeesAuditedDecimal.plus(toDecimal(r.feeDeducted));
    } else {
      exceptionCount++;
      totalVarianceAmountDecimal = totalVarianceAmountDecimal.plus(toDecimal(r.variance).abs());
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
    totalGrossVolume: totalGrossVolumeDecimal.toNumber(),
    totalNetBankCredit: totalNetBankCreditDecimal.toNumber(),
    totalGatewayFeesAudited: totalGatewayFeesAuditedDecimal.toNumber(),
    exactMatchCount,
    utrMatchCount,
    feeAdjustedCount,
    delayedSettlementCount,
    partialRefundCount,
    aiFuzzyMatchedCount,
    exceptionCount,
    matchRatePercentage,
    totalVarianceAmount: totalVarianceAmountDecimal.toNumber(),
    journalEntriesGenerated: journalEntries.length
  };

  return { reconciled, summary, journalEntries };
}
