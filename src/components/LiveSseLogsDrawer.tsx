import React, { useEffect, useState } from "react";
import { Terminal, Activity, X, CheckCircle2, Zap } from "lucide-react";

interface SseLogEvent {
  type: string;
  message: string;
  timestamp: string;
}

export const LiveSseLogsDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<SseLogEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const eventSource = new EventSource("/api/stream/reconciliation-logs");

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data: SseLogEvent = JSON.parse(event.data);
        setLogs((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 logs
      } catch (err) {
        console.error("Error parsing SSE log event", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col text-white">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-sm">Live SSE Telemetry Stream</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`flex items-center text-xs font-medium ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
            {isConnected ? "Streaming" : "Connecting"}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SSE Log Feed */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-slate-950/80">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <Activity className="w-6 h-6 animate-spin mb-2 text-sky-500" />
            Connecting to Server-Sent Event stream...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 flex flex-col space-y-1 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-semibold text-sky-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {log.type}
                </span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-200 text-xs">{log.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400">
        Endpoint: <code className="text-sky-300">GET /api/stream/reconciliation-logs</code>
      </div>
    </div>
  );
};
