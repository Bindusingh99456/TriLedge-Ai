import React from "react";
import { ReconciliationSummary } from "../types";
import {
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Scale,
  Sparkles,
  Receipt,
  Building2,
  ShieldAlert
} from "lucide-react";

interface SummaryCardsProps {
  summary: ReconciliationSummary;
  onSelectTab: (tab: 'ALL' | 'EXCEPTIONS' | 'JOURNAL') => void;
  activeTab: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onSelectTab, activeTab }) => {
  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      
      {/* Card 1: Total Volume & Match Rate */}
      <div 
        onClick={() => onSelectTab('ALL')}
        className={`bg-white border rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-md ${
          activeTab === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Volume</span>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatINR(summary.totalGrossVolume)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {summary.totalRecordsProcessed} records
          </span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {summary.matchRatePercentage}% Matched
          </span>
        </div>
      </div>

      {/* Card 2: Gateway Fees Audited */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Fees Paid</span>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatINR(summary.totalGatewayFeesAudited)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{summary.feeAdjustedCount} fee-verified matches</span>
          <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Verified</span>
        </div>
      </div>

      {/* Card 3: Net Bank Credit */}
      <div 
        onClick={() => onSelectTab('JOURNAL')}
        className={`bg-white border rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-md ${
          activeTab === 'JOURNAL' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Received in Bank</span>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-600 tracking-tight">
          {formatINR(summary.totalNetBankCredit)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{summary.journalEntriesGenerated} Accounting Entries</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Balanced</span>
        </div>
      </div>

      {/* Card 4: Honest Exceptions & Risk */}
      <div 
        onClick={() => onSelectTab('EXCEPTIONS')}
        className={`bg-white border rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-md ${
          activeTab === 'EXCEPTIONS' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unmatched Payments</span>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-600 tracking-tight">
          {summary.exceptionCount} Need Review
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">Amount Difference:</span>
          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {formatINR(summary.totalVarianceAmount)}
          </span>
        </div>
      </div>

    </div>
  );
};
