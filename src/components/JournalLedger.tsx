import React from "react";
import { JournalEntry } from "../types";
import {
  BookOpen,
  Download,
  Copy,
  Check,
  Building,
  Scale
} from "lucide-react";

interface JournalLedgerProps {
  entries: JournalEntry[];
}

export const JournalLedger: React.FC<JournalLedgerProps> = ({ entries }) => {
  const [copied, setCopied] = React.useState(false);

  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleCopy = () => {
    const text = entries
      .map(
        e =>
          `${e.id}\t${e.date}\t${e.referenceId}\t${e.description}\tDr: ${e.debitAccount} (${formatINR(e.debitAmount)})\tCr: ${e.creditAccount} (${formatINR(e.creditAmount)})`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvHeader = "Journal_ID,Date,Transaction_Ref,Description,Debit_Account,Debit_Amount,Credit_Account,Credit_Amount\n";
    const csvRows = entries
      .map(
        e =>
          `"${e.id}","${e.date}","${e.referenceId}","${e.description.replace(/"/g, '""')}","${e.debitAccount}",${e.debitAmount},"${e.creditAccount}",${e.creditAmount}`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LedgerSync_Adjusting_Journal_Entries_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalDebits = entries.reduce((acc, e) => acc + e.debitAmount + (e.feeAmount || 0), 0);
  const totalCredits = entries.reduce((acc, e) => acc + e.creditAmount, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Accounting Entry Records
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {entries.length} Entries Generated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automatic accounting entries for bank deposits, payment processing fees, and customer refunds.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Copied!" : "Copy Records"}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center justify-between px-3 py-1 text-slate-700">
          <span className="font-semibold">Total Bank Deposits + Fees:</span>
          <span className="font-bold text-emerald-700 text-sm">{formatINR(totalDebits)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 text-slate-700">
          <span className="font-semibold">Total Customer Sales Recorded:</span>
          <span className="font-bold text-indigo-700 text-sm">{formatINR(totalCredits)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Voucher ID</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Ref Order</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Account & Entry Breakdown</th>
              <th className="py-3.5 px-4 text-right">Debit (₹)</th>
              <th className="py-3.5 px-4 text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition">
                <td className="py-3.5 px-4 font-mono text-slate-900 font-bold">{e.id}</td>
                <td className="py-3.5 px-4 text-slate-500">{e.date}</td>
                <td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">{e.referenceId}</td>
                <td className="py-3.5 px-4 text-slate-700 max-w-xs">{e.description}</td>
                <td className="py-3.5 px-4 space-y-1">
                  <div className="text-emerald-700 font-bold flex justify-between">
                    <span>Dr. {e.debitAccount}</span>
                  </div>
                  {e.feeAccount && (
                    <div className="text-amber-700 font-bold flex justify-between">
                      <span>Dr. {e.feeAccount}</span>
                    </div>
                  )}
                  <div className="text-indigo-700 font-bold flex justify-between pl-3">
                    <span>To Cr. {e.creditAccount}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                  <div>{formatINR(e.debitAmount)}</div>
                  {e.feeAmount && <div className="text-amber-700">{formatINR(e.feeAmount)}</div>}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                  {formatINR(e.creditAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
