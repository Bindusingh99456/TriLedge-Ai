import React from "react";
import { MatchType, ReconciledTransaction } from "../types";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock
} from "lucide-react";

interface InspectorModalProps {
  transaction: ReconciledTransaction | null;
  onClose: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const isException = transaction.matchType === MatchType.EXCEPTION_UNRESOLVED;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-900">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isException ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isException ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Payment Comparison Details
                </h3>
                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                  {transaction.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Compare Online Payment, Bank Deposit & Invoice Records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Status & Reasoning Banner */}
          <div className={`p-4 rounded-xl border ${
            isException 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {transaction.matchType === MatchType.AI_FUZZY_MATCHED && <Sparkles className="w-4 h-4 text-indigo-600" />}
                Match Type: {transaction.matchType.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-800">
                Confidence: {transaction.confidenceScore}%
              </span>
            </div>
            <p className="text-sm font-medium mt-1">
              {transaction.reasoning}
            </p>
            {transaction.recommendedAction && (
              <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-amber-200 text-slate-800 font-medium shadow-sm">
                <span className="font-bold text-amber-800">Recommended Action: </span>
                {transaction.recommendedAction}
              </div>
            )}
          </div>

          {/* 3-Way Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Column 1: Razorpay Settlement Report */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 mb-3 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4" />
                  <span>1. Razorpay Settlement</span>
                </div>
                {transaction.razorpay ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment ID:</span>
                      <span className="font-mono text-slate-900 font-bold">{transaction.razorpay.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono text-slate-900 font-medium">{transaction.razorpay.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="text-slate-900 font-medium">{transaction.razorpay.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Amount:</span>
                      <span className="font-bold text-slate-900">{formatINR(transaction.razorpay.transactionAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gateway Fee:</span>
                      <span className="text-amber-700 font-bold">-{formatINR(transaction.razorpay.gatewayFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Settlement Amount:</span>
                      <span className="font-bold text-emerald-700">{formatINR(transaction.razorpay.settlementAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settlement Date:</span>
                      <span className="text-slate-700 font-medium">{transaction.razorpay.settlementDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTR Reference:</span>
                      <span className="font-mono text-xs text-indigo-700 font-bold">{transaction.razorpay.utrReference || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    No matching Razorpay record found
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Core Bank Statement */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 mb-3 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" />
                  <span>2. Bank Statement Credit</span>
                </div>
                {transaction.bank ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Ref:</span>
                      <span className="font-mono text-slate-900 font-bold">{transaction.bank.bankRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank UTR:</span>
                      <span className="font-mono text-indigo-700 font-bold">{transaction.bank.utrNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Value Date:</span>
                      <span className="text-slate-700 font-medium">{transaction.bank.valueDate}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Bank Credit Recd:</span>
                      <span className="font-bold text-emerald-700">{formatINR(transaction.bank.creditAmount)}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 font-medium block mb-1">Narration / Remark:</span>
                      <p className="text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 font-mono break-all font-medium">
                        {transaction.bank.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-amber-700 italic font-bold">
                    ⚠️ Missing Bank Statement Credit
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Internal ERP Sales Ledger */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>3. ERP Sales Ledger</span>
                </div>
                {transaction.erp ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice ID:</span>
                      <span className="font-mono text-slate-900 font-bold">{transaction.erp.invoiceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono text-slate-900 font-medium">{transaction.erp.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="text-slate-900 font-medium">{transaction.erp.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sales Date:</span>
                      <span className="text-slate-700 font-medium">{transaction.erp.salesDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected Sales:</span>
                      <span className="font-bold text-slate-900">{formatINR(transaction.erp.expectedAmount)}</span>
                    </div>
                    {transaction.erp.refundAmount > 0 && (
                      <div className="flex justify-between text-rose-700 font-bold">
                        <span>Sales Refund:</span>
                        <span>-{formatINR(transaction.erp.refundAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Net Receivable:</span>
                      <span className="font-bold text-indigo-700">{formatINR(transaction.erp.netExpectedAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    No matching ERP sales invoice found
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Mathematical Balance & Variance Audit Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Payment Math & Difference Check
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">Gross Sales</span>
                <span className="text-sm font-bold text-slate-900">{formatINR(transaction.grossAmount)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">- Gateway Fee</span>
                <span className="text-sm font-bold text-amber-700">-{formatINR(transaction.feeDeducted)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">- Refund / Adjust</span>
                <span className="text-sm font-bold text-rose-700">-{formatINR(transaction.refundDeducted)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block">= Net Bank Deposit</span>
                <span className="text-sm font-bold text-emerald-700">{formatINR(transaction.netBankReceived)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-500 font-semibold block">Difference</span>
                <span className={`text-sm font-bold ${transaction.variance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatINR(transaction.variance)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 rounded-b-2xl">
          <span>Checked at: {new Date(transaction.reconciledAt).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition shadow-sm"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
