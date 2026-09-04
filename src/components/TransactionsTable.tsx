import React from "react";
import { MatchType, ReconciledTransaction } from "../types";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Eye,
  HelpCircle,
  X,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

interface TransactionsTableProps {
  reconciled: ReconciledTransaction[];
  onInspect: (tx: ReconciledTransaction) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  reconciled,
  onInspect,
  activeFilter,
  onFilterChange
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [issueCategoryFilter, setIssueCategoryFilter] = React.useState("ALL");
  const [explainingTx, setExplainingTx] = React.useState<ReconciledTransaction | null>(null);

  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredList = reconciled.filter(item => {
    // Filter by match type tab
    if (activeFilter !== "ALL") {
      if (activeFilter === "EXCEPTIONS" && item.matchType !== MatchType.EXCEPTION_UNRESOLVED) return false;
      if (activeFilter === "FEE_ADJUSTED" && item.matchType !== MatchType.FEE_ADJUSTED && item.matchType !== MatchType.EXACT_MATCH) return false;
      if (activeFilter === "DELAYED" && item.matchType !== MatchType.DELAYED_SETTLEMENT) return false;
      if (activeFilter === "REFUND" && item.matchType !== MatchType.PARTIAL_REFUND) return false;
      if (activeFilter === "AI_FUZZY" && item.matchType !== MatchType.AI_FUZZY_MATCHED) return false;
    }

    // Filter by specific Issue Category Dropdown
    if (issueCategoryFilter !== "ALL") {
      if (issueCategoryFilter === "MISSING_BANK" && item.bank) return false;
      if (issueCategoryFilter === "FEE_DISCREPANCY" && item.matchType !== MatchType.FEE_ADJUSTED) return false;
      if (issueCategoryFilter === "PARTIAL_REFUND" && item.matchType !== MatchType.PARTIAL_REFUND) return false;
      if (issueCategoryFilter === "DELAYED_DEPOSIT" && item.matchType !== MatchType.DELAYED_SETTLEMENT) return false;
      if (issueCategoryFilter === "AI_MATCH" && item.matchType !== MatchType.AI_FUZZY_MATCHED) return false;
      if (issueCategoryFilter === "UNRESOLVED" && item.matchType !== MatchType.EXCEPTION_UNRESOLVED) return false;
    }

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      (item.razorpay?.paymentId && item.razorpay.paymentId.toLowerCase().includes(q)) ||
      (item.razorpay?.orderId && item.razorpay.orderId.toLowerCase().includes(q)) ||
      (item.razorpay?.customerName && item.razorpay.customerName.toLowerCase().includes(q)) ||
      (item.bank?.utrNumber && item.bank.utrNumber.toLowerCase().includes(q)) ||
      (item.bank?.bankRef && item.bank.bankRef.toLowerCase().includes(q)) ||
      (item.erp?.invoiceId && item.erp.invoiceId.toLowerCase().includes(q)) ||
      item.reasoning.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (type: MatchType) => {
    switch (type) {
      case MatchType.EXACT_MATCH:
      case MatchType.FEE_ADJUSTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Matched (With Fees)
          </span>
        );
      case MatchType.DELAYED_SETTLEMENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Delayed Deposit
          </span>
        );
      case MatchType.PARTIAL_REFUND:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Partial Refund
          </span>
        );
      case MatchType.AI_FUZZY_MATCHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI Matched
          </span>
        );
      case MatchType.EXCEPTION_UNRESOLVED:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Needs Attention
          </span>
        );
    }
  };

  const getRuleTitle = (type: MatchType) => {
    switch (type) {
      case MatchType.EXACT_MATCH:
        return "Exact Value & Reference Rule";
      case MatchType.FEE_ADJUSTED:
        return "3-Way Net Fee Deduction Rule";
      case MatchType.DELAYED_SETTLEMENT:
        return "Delayed Bank Deposit Rule (1-3 Days)";
      case MatchType.PARTIAL_REFUND:
        return "Partial Customer Refund Adjustment Rule";
      case MatchType.AI_FUZZY_MATCHED:
        return "Gemini AI Smart Pattern Matching";
      case MatchType.EXCEPTION_UNRESOLVED:
      default:
        return "Unmatched Exception Review Required";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Payments & Transactions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare customer online payments, bank deposits, and store sales invoices.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Payment Issue Category Dropdown */}
          <div className="relative">
            <select
              value={issueCategoryFilter}
              onChange={(e) => setIssueCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">🔍 All Payment Issues & Types</option>
              <option value="MISSING_BANK">⚠️ Missing Bank Deposit Credit</option>
              <option value="FEE_DISCREPANCY">💸 Gateway Fee Deduction Discrepancy</option>
              <option value="PARTIAL_REFUND">🔄 Partial Refund Deduction Variance</option>
              <option value="DELAYED_DEPOSIT">⏱️ Delayed Deposit (T+2 / T+3)</option>
              <option value="AI_MATCH">🤖 AI Fuzzy Pattern Match</option>
              <option value="UNRESOLVED">🚨 Unmatched Exception Required</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Payment ID, UTR, Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Filter Pill Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                activeFilter === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({reconciled.length})
            </button>
            <button
              onClick={() => onFilterChange("FEE_ADJUSTED")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                activeFilter === "FEE_ADJUSTED" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Matched
            </button>
            <button
              onClick={() => onFilterChange("AI_FUZZY")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                activeFilter === "AI_FUZZY" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              AI Fuzzy
            </button>
            <button
              onClick={() => onFilterChange("EXCEPTIONS")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                activeFilter === "EXCEPTIONS" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unmatched
            </button>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Match Status</th>
              <th className="py-3.5 px-4">Razorpay Payment ID</th>
              <th className="py-3.5 px-4">Bank UTR / Ref</th>
              <th className="py-3.5 px-4">ERP Order / Customer</th>
              <th className="py-3.5 px-4 text-right">Gross (₹)</th>
              <th className="py-3.5 px-4 text-right">Fee (₹)</th>
              <th className="py-3.5 px-4 text-right">Bank Amount (₹)</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500 italic">
                  No matching transactions found for filter "{activeFilter}"
                </td>
              </tr>
            ) : (
              filteredList.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onInspect(tx)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4">{getStatusBadge(tx.matchType)}</td>
                  
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                    {tx.razorpay?.paymentId || (
                      <span className="text-slate-400 italic font-sans text-xs">No RZP Record</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">
                    {tx.bank?.utrNumber || tx.bank?.bankRef || (
                      <span className="text-amber-600 italic font-sans text-[11px] font-semibold">Missing Credit</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {tx.erp?.orderId || tx.razorpay?.orderId || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tx.erp?.customerName || tx.razorpay?.customerName || 'Unknown'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatINR(tx.grossAmount)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-amber-600 font-semibold">
                    -{formatINR(tx.feeDeducted)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatINR(tx.netBankReceived)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExplainingTx(tx);
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-200 flex items-center space-x-1 font-bold text-[11px]"
                        title="Explain matching rule and logic"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Explain</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(tx);
                        }}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                        title="Inspect 3-Way Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Explain Logic Tooltip / Modal Dialog */}
      {explainingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-slate-900 relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Why Was This Payment Cleared?</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Transaction ID: {explainingTx.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setExplainingTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rule Badge & Confidence */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Matching Rule Applied</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {explainingTx.confidenceScore}% Confidence
                </span>
              </div>
              <div className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                {explainingTx.matchType === MatchType.AI_FUZZY_MATCHED && <Sparkles className="w-4 h-4 text-indigo-600" />}
                {getRuleTitle(explainingTx.matchType)}
              </div>
            </div>

            {/* Plain English Reasoning */}
            <div className="mb-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plain English Explanation</h4>
              <p className="text-xs text-slate-700 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl leading-relaxed font-medium">
                {explainingTx.reasoning}
              </p>
            </div>

            {/* Step-by-Step Logic Breakdown */}
            <div className="mb-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logic Calculation Steps</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">1. Store Order Amount:</span>
                  <span className="font-bold text-slate-900">{formatINR(explainingTx.grossAmount)}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">2. Gateway Fee Deducted:</span>
                  <span className="font-bold text-amber-700">-{formatINR(explainingTx.feeDeducted)}</span>
                </div>

                {explainingTx.refundDeducted > 0 && (
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600 font-medium">3. Customer Refund Deducted:</span>
                    <span className="font-bold text-purple-700">-{formatINR(explainingTx.refundDeducted)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Net Bank Deposit Received:</span>
                  <span className="font-bold text-emerald-700">{formatINR(explainingTx.netBankReceived)}</span>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-bold text-emerald-900">
                  <span>Calculated Difference:</span>
                  <span>{formatINR(explainingTx.variance)} {explainingTx.variance === 0 ? "(100% Match!)" : ""}</span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  const currentTx = explainingTx;
                  setExplainingTx(null);
                  onInspect(currentTx);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
              >
                <span>View Full 3-Way Inspector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setExplainingTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg font-bold transition shadow-sm"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

