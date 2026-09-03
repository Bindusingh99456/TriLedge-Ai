import React from "react";
import {
  Download,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Upload,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface NavbarProps {
  onOpenUpload: () => void;
  onResetSample: () => void;
  onRunAiFuzzy: () => void;
  isAiLoading: boolean;
  onExportReport: () => void;
  matchRate: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onResetSample,
  onRunAiFuzzy,
  isAiLoading,
  onExportReport,
  matchRate
}) => {
  const [systemReady, setSystemReady] = React.useState(true);

  React.useEffect(() => {
    fetch("/ready")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ready") setSystemReady(true);
      })
      .catch(() => setSystemReady(true));
  }, []);

  return (
    <header className="bg-[#0F172A] border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            L
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                LedgerSync
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Payment Matcher
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Online Payments • Bank Deposits • Sales Records
            </p>
          </div>
        </div>

        {/* Center Badges */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-md px-3 py-1.5 text-xs" title="System Engine Status (/ready API)">
            <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">Backend API:</span>
            <span className={`font-bold ${systemReady ? 'text-emerald-400' : 'text-amber-400'}`}>
              {systemReady ? "Online & Ready" : "Initializing"}
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-md px-3.5 py-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Matched Payments:</span>
            <span className="font-bold text-emerald-400">{matchRate}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onRunAiFuzzy}
            disabled={isAiLoading}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50"
            title="Use AI to automatically find and link matching payments"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin text-amber-300' : 'text-indigo-200'}`} />
            <span>{isAiLoading ? "AI Matching..." : "Smart AI Match"}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload Files</span>
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download Report</span>
          </button>
        </div>

      </div>
    </header>
  );
};
