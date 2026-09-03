/**
 * LedgerSync 3-Way Financial Reconciliation Types
 */

export enum MatchType {
  EXACT_MATCH = "EXACT_MATCH",
  UTR_MATCH = "UTR_MATCH",
  FEE_ADJUSTED = "FEE_ADJUSTED",
  DELAYED_SETTLEMENT = "DELAYED_SETTLEMENT",
  PARTIAL_REFUND = "PARTIAL_REFUND",
  AI_FUZZY_MATCHED = "AI_FUZZY_MATCHED",
  EXCEPTION_UNRESOLVED = "EXCEPTION_UNRESOLVED"
}

export enum ExceptionType {
  MISSING_BANK_ENTRY = "MISSING_BANK_ENTRY",
  FEE_DISCREPANCY = "FEE_DISCREPANCY",
  DELAYED_EXCEEDED = "DELAYED_EXCEEDED",
  UNMATCHED_ERP_RECORD = "UNMATCHED_ERP_RECORD",
  AMOUNT_MISMATCH = "AMOUNT_MISMATCH",
  REFUND_OVERAGE = "REFUND_OVERAGE"
}

export interface RazorpayRecord {
  paymentId: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  transactionAmount: number;
  gatewayFee: number;
  settlementAmount: number;
  settlementDate: string; // ISO YYYY-MM-DD
  utrReference: string;
  status: string;
}

export interface BankRecord {
  bankRef: string;
  utrNumber: string;
  valueDate: string; // ISO YYYY-MM-DD
  creditAmount: number;
  debitAmount: number;
  description: string;
  bankCode?: string;
}

export interface ErpRecord {
  invoiceId: string;
  orderId: string;
  salesDate: string; // ISO YYYY-MM-DD
  customerName: string;
  expectedAmount: number;
  refundAmount: number;
  netExpectedAmount: number;
  paymentStatus: string;
}

export interface ReconciledTransaction {
  id: string;
  matchType: MatchType;
  confidenceScore: number; // 0 to 100
  reasoning: string;
  
  // 3-Way Linked Data
  razorpay?: RazorpayRecord;
  bank?: BankRecord;
  erp?: ErpRecord;

  // Financial Breakdown
  grossAmount: number;
  feeDeducted: number;
  refundDeducted: number;
  netBankReceived: number;
  variance: number; // gross - fee - refund - netBank

  // Exception Details (if EXCEPTION_UNRESOLVED)
  exceptionType?: ExceptionType;
  exceptionResolution?: string;
  recommendedAction?: string;
  manualStatus?: 'PENDING' | 'RESOLVED' | 'FLAGGED';

  // Audit trail timestamps
  reconciledAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  transactionId: string;
  referenceId: string;
  description: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  feeAccount?: string;
  feeAmount?: number;
  status: "POSTED" | "DRAFT";
}

export interface ReconciliationSummary {
  totalRecordsProcessed: number;
  totalGrossVolume: number;
  totalNetBankCredit: number;
  totalGatewayFeesAudited: number;
  
  exactMatchCount: number;
  utrMatchCount: number;
  feeAdjustedCount: number;
  delayedSettlementCount: number;
  partialRefundCount: number;
  aiFuzzyMatchedCount: number;
  exceptionCount: number;

  matchRatePercentage: number;
  totalVarianceAmount: number;
  journalEntriesGenerated: number;
}
