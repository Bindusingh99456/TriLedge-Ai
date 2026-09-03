import React from "react";

export const SummaryCardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-800 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-800/60 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
    <div className="h-10 bg-slate-800 rounded mb-4"></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-12 bg-slate-800/50 rounded mb-2"></div>
    ))}
  </div>
);
