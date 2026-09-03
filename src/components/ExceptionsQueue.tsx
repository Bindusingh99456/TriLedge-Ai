import React from "react";
import { ExceptionType, ReconciledTransaction } from "../types";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  FileQuestion,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface ExceptionsQueueProps {
  exceptions: ReconciledTransaction[];
  onInspect: (tx: ReconciledTransaction) => void;
  onRunAi: () => void;
  isAiLoading: boolean;
  onResolveException: (id: string, newStatus: 'RESOLVED' | 'FLAGGED') => void;
}

export const ExceptionsQueue: React.FC<ExceptionsQueueProps> = ({
  exceptions,
  onInspect,
  onRunAi,
  isAiLoading,
  onResolveException
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredExceptions = exceptions.filter(ex => {
    const q = searchTerm.toLowerCase();
    return (
      ex.id.toLowerCase().includes(q) ||
      ex.reasoning.toLowerCase().includes(q) ||
      ex.razorpay?.paymentId.toLowerCase().includes(q) ||
      ex.bank?.bankRef.toLowerCase().includes(q) ||
      ex.erp?.invoiceId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Unmatched Payments Review
            </h2>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {exceptions.length} Unmatched
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View payments that could not be matched automatically, see why they failed, and get suggestions to fix them.
          </p>
        </div>

        {/* AI Retry & Search */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search unmatched payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={onRunAi}
            disabled={isAiLoading || exceptions.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? "AI Matching..." : "Find Matches with AI"}</span>
          </button>
        </div>
      </div>

      {/* Exception Cards / List */}
      {filteredExceptions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">All Payments Matched!</h3>
          <p className="text-xs text-slate-500 mt-1">Every customer payment matches your bank deposits and invoices.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExceptions.map((ex) => {
            const isMissingBank = ex.exceptionType === ExceptionType.MISSING_BANK_ENTRY;

            return (
              <div
                key={ex.id}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
                  
                  {/* Left: Exception Type & ID */}
                  <div className="flex items-center space-x-3">
                    <span className={`p-2 rounded-lg text-xs font-bold ${
                      isMissingBank ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {ex.exceptionType ? ex.exceptionType.replace(/_/g, ' ') : 'UNMATCHED PAYMENT'}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
                          {ex.id}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Amount Difference: <strong className="text-amber-700 font-bold">{formatINR(ex.variance)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onResolveException(ex.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                    >
                      Approve & Mark Matched
                    </button>

                    <button
                      onClick={() => onInspect(ex)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                    >
                      <span>View Comparison</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                </div>

                {/* Exception Reasoning & Audit Rationale */}
                <p className="text-xs text-slate-800 mb-3 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {ex.reasoning}
                </p>

                {/* Root Cause & Recommended Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1">Linked IDs:</span>
                    <span className="text-slate-800 font-mono text-xs">
                      Payment ID: {ex.razorpay?.paymentId || 'Missing'} • Bank Ref: {ex.bank?.bankRef || 'Missing'} • Invoice: {ex.erp?.invoiceId || 'Missing'}
                    </span>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
                    <span className="text-amber-800 font-bold block mb-1">Suggested Fix:</span>
                    <span className="font-medium">{ex.recommendedAction || "Manual inspection required."}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
