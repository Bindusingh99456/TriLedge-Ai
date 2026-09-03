import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Inbox
} from "lucide-react";

interface DLQItem {
  id: string;
  transactionId?: string;
  paymentId?: string;
  orderId?: string;
  reason: string;
  errorDetail?: string;
  payload: any;
  status: "PENDING_RETRY" | "MANUAL_REVIEW" | "RESOLVED" | "FAILED";
  retryCount: number;
  maxRetries: number;
  queuedAt: string;
}

interface DlqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DlqModal: React.FC<DlqModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<DLQItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dlq");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch DLQ queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/dlq/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(`Item ${id} successfully reprocessed!`);
        fetchQueue();
      } else {
        setMessage(`Retry failed: ${data.error || "Circuit Breaker triggered"}`);
        fetchQueue();
      }
    } catch (err: any) {
      setMessage(`Error retrying item: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handlePurge = async () => {
    try {
      const res = await fetch("/api/dlq/purge", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage(`Purged ${data.purgedCount} resolved items.`);
        fetchQueue();
      }
    } catch (err: any) {
      setMessage(`Purge failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <span>Dead-Letter Queue (DLQ)</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  {items.length} Pending
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gemini AI Circuit Breaker Manual Review & Fallback Store
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 px-6 py-2.5 text-xs font-medium flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{message}</span>
            </span>
            <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-indigo-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Items List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Loading DLQ Queue...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Inbox className="w-10 h-10 text-slate-300" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Dead-Letter Queue is Empty</p>
                <p className="text-xs text-slate-400">All AI fuzzy reconciliation operations completed cleanly or through circuit breaker fallback.</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      item.status === 'MANUAL_REVIEW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-indigo-100 text-indigo-800 border-indigo-200'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.queuedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">
                    Transaction ID: <span className="font-mono text-indigo-600">{item.transactionId || item.paymentId || "UNKNOWN"}</span>
                  </p>
                  
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {item.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={retryingId === item.id}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingId === item.id ? "animate-spin" : ""}`} />
                      <span>{retryingId === item.id ? "Retrying..." : "Retry AI Audit"}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={handlePurge}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-red-600 font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Resolved Records</span>
          </button>

          <button
            onClick={fetchQueue}
            className="flex items-center space-x-1.5 text-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh DLQ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
