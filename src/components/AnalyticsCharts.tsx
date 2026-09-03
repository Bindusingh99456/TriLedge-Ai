import React from "react";
import { ReconciledTransaction, MatchType, ExceptionType } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

interface AnalyticsChartsProps {
  reconciled: ReconciledTransaction[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ reconciled }) => {
  // Count match types for Donut Chart
  const matchCounts: Record<string, number> = {
    "3-Way Net Fee": 0,
    "Delayed Settlement": 0,
    "Partial Refund": 0,
    "AI Fuzzy Matched": 0,
    "Unresolved Exception": 0
  };

  const exceptionCounts: Record<string, number> = {
    "Missing Bank Entry": 0,
    "Fee Discrepancy": 0,
    "Unmatched ERP": 0
  };

  reconciled.forEach(r => {
    if (r.matchType === MatchType.FEE_ADJUSTED || r.matchType === MatchType.EXACT_MATCH) {
      matchCounts["3-Way Net Fee"]++;
    } else if (r.matchType === MatchType.DELAYED_SETTLEMENT) {
      matchCounts["Delayed Settlement"]++;
    } else if (r.matchType === MatchType.PARTIAL_REFUND) {
      matchCounts["Partial Refund"]++;
    } else if (r.matchType === MatchType.AI_FUZZY_MATCHED) {
      matchCounts["AI Fuzzy Matched"]++;
    } else if (r.matchType === MatchType.EXCEPTION_UNRESOLVED) {
      matchCounts["Unresolved Exception"]++;
      if (r.exceptionType === ExceptionType.MISSING_BANK_ENTRY) {
        exceptionCounts["Missing Bank Entry"]++;
      } else if (r.exceptionType === ExceptionType.FEE_DISCREPANCY) {
        exceptionCounts["Fee Discrepancy"]++;
      } else {
        exceptionCounts["Unmatched ERP"]++;
      }
    }
  });

  const pieData = Object.entries(matchCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

  const barData = Object.entries(exceptionCounts).map(([name, count]) => ({
    name,
    Count: count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Chart 1: Reconciliation Match Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
          <span>Payment Matching Status</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{reconciled.length} Items</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Breakdown of matched payments, fee verification, and AI fixes.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", color: "#0F172A", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Exception Root Cause Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
          <span>Reasons Payments Don't Match</span>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Needs Review</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Common reasons why payments could not be matched automatically.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", color: "#0F172A", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
