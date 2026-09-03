import React from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (presetName: string) => void;
  onCustomCsvUpload: (rzpCsv: string, bankCsv: string, erpCsv: string) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
  onCustomCsvUpload
}) => {
  const [activeTab, setActiveTab] = React.useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  
  const [rzpCsvContent, setRzpCsvContent] = React.useState("");
  const [bankCsvContent, setBankCsvContent] = React.useState("");
  const [erpCsvContent, setErpCsvContent] = React.useState("");

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const handleRunCustom = () => {
    if (!rzpCsvContent || !bankCsvContent || !erpCsvContent) {
      alert("Please upload or paste CSV text for all 3 sources (Razorpay, Bank Statement, and ERP Sales Ledger).");
      return;
    }
    onCustomCsvUpload(rzpCsvContent, bankCsvContent, erpCsvContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Financial Data</h3>
              <p className="text-xs text-slate-500">Load 3-way synthetic presets or upload custom CSV reports</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'PRESETS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sample Data Sets</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'CUSTOM'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV Files</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 space-y-6">
          {activeTab === 'PRESETS' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Select a sample dataset to test how the payment matcher works with real-world scenarios:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Preset 1 */}
                <div
                  onClick={() => {
                    onLoadPreset("STANDARD");
                    onClose();
                  }}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl p-5 cursor-pointer transition shadow-sm group hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600">Dataset A</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      96% Match
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    Standard E-Commerce Batch
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Contains 25 transaction records with standard 2% Razorpay gateway fee deductions and 3-way UTR links.
                  </p>
                </div>

                {/* Preset 2 */}
                <div
                  onClick={() => {
                    onLoadPreset("EDGE_CASES");
                    onClose();
                  }}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl p-5 cursor-pointer transition shadow-sm group hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600">Dataset B</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      Delays & Refunds
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    Delayed & Refund Batch
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Includes 1-3 day delayed bank settlements and partial sales refunds requiring net debit accounting adjustments.
                  </p>
                </div>

                {/* Preset 3 */}
                <div
                  onClick={() => {
                    onLoadPreset("FUZZY_EXCEPTIONS");
                    onClose();
                  }}
                  className="bg-slate-50 border border-slate-200 hover:border-amber-500 rounded-xl p-5 cursor-pointer transition shadow-sm group hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700">Dataset C</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      AI Fuzzy & Exceptions
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
                    Fuzzy Mismatch & Exception Batch
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Designed to test Gemini AI fuzzy matching on truncated invoice IDs and honest exception breakdown on missing bank credits.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Upload 3 separate CSV files or paste raw CSV text for 3-way reconciliation:
              </p>

              {/* Upload 1: Razorpay CSV */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-indigo-700">
                    1. Razorpay Settlement Report CSV
                  </label>
                  <button
                    onClick={() => setRzpCsvContent(`Payment_ID,Order_ID,Customer_Name,Customer_Email,Transaction_Amount,Gateway_Fee,Settlement_Amount,Settlement_Date,UTR_Reference,Status
pay_RZP_00101,ORD-2026-1001,Aarav Sharma,aarav@example.com,12500,250,12250,2026-08-20,UTR98765432101,captured
pay_RZP_00102,ORD-2026-1002,Priya Patel,priya@example.com,8400,168,8232,2026-08-20,UTR98765432102,captured
pay_RZP_00103,ORD-2026-1003,Rohan Verma,rohan@example.com,15000,300,14700,2026-08-21,UTR98765432103,captured`)}
                    className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded border border-indigo-200 transition"
                  >
                    Insert Demo Text
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, setRzpCsvContent)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 mb-2 cursor-pointer"
                />
                <textarea
                  rows={3}
                  placeholder="Payment_ID,Order_ID,Customer_Name,Transaction_Amount,Gateway_Fee,Settlement_Amount..."
                  value={rzpCsvContent}
                  onChange={(e) => setRzpCsvContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Upload 2: Bank Statement CSV */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-emerald-700">
                    2. Core Bank Statement CSV
                  </label>
                  <button
                    onClick={() => setBankCsvContent(`Bank_Ref,UTR_Number,Value_Date,Credit_Amount,Debit_Amount,Description,Bank_Code
BNK-2026-9001,UTR98765432101,2026-08-20,12250,0,CMS/Razorpay/UTR98765432101/Aarav,HDFC00012
BNK-2026-9002,UTR98765432102,2026-08-20,8232,0,CMS/Razorpay/UTR98765432102/Priya,HDFC00012
BNK-2026-9003,UTR98765432103,2026-08-21,14700,0,CMS/Razorpay/UTR98765432103/Rohan,HDFC00012`)}
                    className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-200 transition"
                  >
                    Insert Demo Text
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, setBankCsvContent)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 mb-2 cursor-pointer"
                />
                <textarea
                  rows={3}
                  placeholder="Bank_Ref,UTR_Number,Value_Date,Credit_Amount,Description..."
                  value={bankCsvContent}
                  onChange={(e) => setBankCsvContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Upload 3: ERP Sales Ledger CSV */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-indigo-600">
                    3. ERP Sales Ledger CSV
                  </label>
                  <button
                    onClick={() => setErpCsvContent(`Invoice_ID,Order_ID,Sales_Date,Customer_Name,Expected_Amount,Refund_Amount,Net_Expected,Payment_Status
INV-2026-1001,ORD-2026-1001,2026-08-20,Aarav Sharma,12500,0,12500,Paid
INV-2026-1002,ORD-2026-1002,2026-08-20,Priya Patel,8400,0,8400,Paid
INV-2026-1003,ORD-2026-1003,2026-08-21,Rohan Verma,15000,0,15000,Paid`)}
                    className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded border border-indigo-200 transition"
                  >
                    Insert Demo Text
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, setErpCsvContent)}
                  className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 mb-2 cursor-pointer"
                />
                <textarea
                  rows={3}
                  placeholder="Invoice_ID,Order_ID,Sales_Date,Customer_Name,Expected_Amount..."
                  value={erpCsvContent}
                  onChange={(e) => setErpCsvContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleRunCustom}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Run 3-Way Reconciliation on Custom Data
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
