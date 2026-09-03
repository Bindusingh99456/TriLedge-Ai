import React, { useState, useEffect } from "react";
import {
  ReconciledTransaction,
  ReconciliationSummary,
  JournalEntry,
  MatchType
} from "./types";
import { loadParsedMockDataset, parseCSV } from "./data/mockDatasets";
import { perform3WayReconciliation } from "./utils/reconciler";
import { Navbar } from "./components/Navbar";
import { SummaryCards } from "./components/SummaryCards";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { TransactionsTable } from "./components/TransactionsTable";
import { ExceptionsQueue } from "./components/ExceptionsQueue";
import { JournalLedger } from "./components/JournalLedger";
import { InspectorModal } from "./components/InspectorModal";
import { CsvUploadModal } from "./components/CsvUploadModal";
import { Toast } from "./components/Toast";
import { LiveSseLogsDrawer } from "./components/LiveSseLogsDrawer";
import { DlqModal } from "./components/DlqModal";

import {
  ListFilter,
  ShieldAlert,
  BookOpen,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Info
} from "lucide-react";

export default function App() {
  // Navigation View Tab: 'ALL' | 'EXCEPTIONS' | 'JOURNAL'
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXCEPTIONS' | 'JOURNAL'>('ALL');
  const [activeTableFilter, setActiveTableFilter] = useState<string>('ALL');

  // State
  const [reconciled, setReconciled] = useState<ReconciledTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalRecordsProcessed: 0,
    totalGrossVolume: 0,
    totalNetBankCredit: 0,
    totalGatewayFeesAudited: 0,
    exactMatchCount: 0,
    utrMatchCount: 0,
    feeAdjustedCount: 0,
    delayedSettlementCount: 0,
    partialRefundCount: 0,
    aiFuzzyMatchedCount: 0,
    exceptionCount: 0,
    matchRatePercentage: 0,
    totalVarianceAmount: 0,
    journalEntriesGenerated: 0
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Modals
  const [selectedTx, setSelectedTx] = useState<ReconciledTransaction | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSseOpen, setIsSseOpen] = useState(false);
  const [isDlqOpen, setIsDlqOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Raw Data State
  const [currentRzp, setCurrentRzp] = useState(loadParsedMockDataset().razorpayRecords);
  const [currentBank, setCurrentBank] = useState(loadParsedMockDataset().bankRecords);
  const [currentErp, setCurrentErp] = useState(loadParsedMockDataset().erpRecords);

  // Initial Reconciliation
  const runEngine = (
    rzp = currentRzp,
    bank = currentBank,
    erp = currentErp,
    aiMatches: any[] = []
  ) => {
    const res = perform3WayReconciliation(rzp, bank, erp, aiMatches);
    setReconciled(res.reconciled);
    setSummary(res.summary);
    setJournalEntries(res.journalEntries);
  };

  useEffect(() => {
    runEngine();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run Gemini AI Fuzzy Audit
  const handleRunAiFuzzy = async () => {
    setIsAiLoading(true);

    const unresolvedRzp = reconciled
      .filter(r => r.matchType === MatchType.EXCEPTION_UNRESOLVED && r.razorpay)
      .map(r => r.razorpay);

    const unresolvedBank = reconciled
      .filter(r => r.matchType === MatchType.EXCEPTION_UNRESOLVED && r.bank)
      .map(r => r.bank);

    const unresolvedErp = reconciled
      .filter(r => r.matchType === MatchType.EXCEPTION_UNRESOLVED && r.erp)
      .map(r => r.erp);

    try {
      const resp = await fetch("/api/reconcile-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unmatchedRazorpay: unresolvedRzp,
          unmatchedBank: unresolvedBank,
          unmatchedErp: unresolvedErp
        })
      });

      const data = await resp.json();
      if (data.success && data.matches) {
        runEngine(currentRzp, currentBank, currentErp, data.matches);
        showToast(`AI Audit complete! Reconciled ${data.matches.length} fuzzy mismatch(es).`);
      } else {
        showToast("AI fuzzy audit completed.");
      }
    } catch (err) {
      console.error("AI error:", err);
      showToast("AI audit fallback applied.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Preset Loaders
  const handleLoadPreset = (presetName: string) => {
    const mock = loadParsedMockDataset();
    setCurrentRzp(mock.razorpayRecords);
    setCurrentBank(mock.bankRecords);
    setCurrentErp(mock.erpRecords);
    runEngine(mock.razorpayRecords, mock.bankRecords, mock.erpRecords, []);
    showToast(`Loaded preset dataset: ${presetName}`);
  };

  // Custom Upload Loader
  const handleCustomUpload = (rzpCsv: string, bankCsv: string, erpCsv: string) => {
    const rawRzp = parseCSV(rzpCsv);
    const rawBank = parseCSV(bankCsv);
    const rawErp = parseCSV(erpCsv);

    const rzpList = rawRzp.map(r => ({
      paymentId: r.Payment_ID || r.payment_id || `pay_rzp_${Math.random()}`,
      orderId: r.Order_ID || r.order_id || "",
      customerName: r.Customer_Name || r.customer_name || "Customer",
      customerEmail: r.Customer_Email || "",
      transactionAmount: parseFloat(r.Transaction_Amount || r.amount || "0"),
      gatewayFee: parseFloat(r.Gateway_Fee || r.fee || "0"),
      settlementAmount: parseFloat(r.Settlement_Amount || "0"),
      settlementDate: r.Settlement_Date || "",
      utrReference: r.UTR_Reference || "",
      status: "captured"
    }));

    const bankList = rawBank.map(b => ({
      bankRef: b.Bank_Ref || `BNK-${Math.random()}`,
      utrNumber: b.UTR_Number || "",
      valueDate: b.Value_Date || "",
      creditAmount: parseFloat(b.Credit_Amount || "0"),
      debitAmount: 0,
      description: b.Description || "",
      bankCode: b.Bank_Code || ""
    }));

    const erpList = rawErp.map(e => ({
      invoiceId: e.Invoice_ID || `INV-${Math.random()}`,
      orderId: e.Order_ID || "",
      salesDate: e.Sales_Date || "",
      customerName: e.Customer_Name || "",
      expectedAmount: parseFloat(e.Expected_Amount || "0"),
      refundAmount: parseFloat(e.Refund_Amount || "0"),
      netExpectedAmount: parseFloat(e.Net_Expected || "0"),
      paymentStatus: "Paid"
    }));

    setCurrentRzp(rzpList);
    setCurrentBank(bankList);
    setCurrentErp(erpList);
    runEngine(rzpList, bankList, erpList, []);
    showToast("Custom 3-way dataset reconciled successfully!");
  };

  // Export Master CSV
  const handleExportReport = () => {
    const headers = "Reconciled_ID,Match_Type,Confidence_Score,Gross_Amount,Gateway_Fee,Refund_Amount,Net_Bank_Received,Variance,Reasoning\n";
    const rows = reconciled.map(r =>
      `"${r.id}","${r.matchType}",${r.confidenceScore},${r.grossAmount},${r.feeDeducted},${r.refundDeducted},${r.netBankReceived},${r.variance},"${r.reasoning.replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LedgerSync_Master_Reconciliation_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Master audit report exported.");
  };

  // Resolve Exception Manual Trigger
  const handleResolveException = (id: string, newStatus: 'RESOLVED' | 'FLAGGED') => {
    setReconciled(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            manualStatus: newStatus,
            matchType: newStatus === 'RESOLVED' ? MatchType.FEE_ADJUSTED : MatchType.EXCEPTION_UNRESOLVED,
            reasoning: newStatus === 'RESOLVED' ? 'Manually approved & reconciled by Auditor.' : item.reasoning
          };
        }
        return item;
      })
    );
    showToast(`Exception ${id} marked as ${newStatus}`);
  };

  const exceptionsList = reconciled.filter(r => r.matchType === MatchType.EXCEPTION_UNRESOLVED);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetSample={() => handleLoadPreset("STANDARD")}
        onRunAiFuzzy={handleRunAiFuzzy}
        isAiLoading={isAiLoading}
        onExportReport={handleExportReport}
        matchRate={summary.matchRatePercentage}
        onOpenSseDrawer={() => setIsSseOpen(true)}
        onOpenDlqModal={() => setIsDlqOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Executive KPI Summary Cards */}
        <SummaryCards
          summary={summary}
          onSelectTab={(tab) => setActiveTab(tab)}
          activeTab={activeTab}
        />

        {/* Analytics Charts */}
        <AnalyticsCharts reconciled={reconciled} />

        {/* View Switcher Tabs */}
        <div className="flex border border-slate-200 mb-6 bg-white p-1.5 rounded-xl shadow-sm gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>All Transactions ({reconciled.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
              activeTab === 'EXCEPTIONS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Unmatched Payments ({exceptionsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
              activeTab === 'JOURNAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Accounting Records ({journalEntries.length})</span>
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'ALL' && (
          <TransactionsTable
            reconciled={reconciled}
            onInspect={(tx) => setSelectedTx(tx)}
            activeFilter={activeTableFilter}
            onFilterChange={(f) => setActiveTableFilter(f)}
          />
        )}

        {activeTab === 'EXCEPTIONS' && (
          <ExceptionsQueue
            exceptions={exceptionsList}
            onInspect={(tx) => setSelectedTx(tx)}
            onRunAi={handleRunAiFuzzy}
            isAiLoading={isAiLoading}
            onResolveException={handleResolveException}
          />
        )}

        {activeTab === 'JOURNAL' && (
          <JournalLedger entries={journalEntries} />
        )}

      </main>

      {/* 3-Way Inspector Modal */}
      <InspectorModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* CSV Import Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadPreset={handleLoadPreset}
        onCustomCsvUpload={handleCustomUpload}
      />

      {/* Live SSE Telemetry Drawer */}
      <LiveSseLogsDrawer
        isOpen={isSseOpen}
        onClose={() => setIsSseOpen(false)}
      />

      {/* Dead-Letter Queue & Circuit Breaker Modal */}
      <DlqModal
        isOpen={isDlqOpen}
        onClose={() => setIsDlqOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">LedgerSync • Automatic Payment & Bank Deposit Matcher</span>
          <span className="text-slate-400">Powered by Smart Matching Rules & Gemini AI</span>
        </div>
      </footer>

    </div>
  );
}
