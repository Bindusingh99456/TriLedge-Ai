import fs from "fs";
import path from "path";

export interface RazorpaySeed {
  paymentId: string;
  orderId: string;
  customerName: string;
  grossAmount: number;
  gatewayFee: number;
  netSettlement: number;
  settlementDate: string;
  utrReference: string;
}

export interface BankStatementSeed {
  bankRef: string;
  utrNumber: string;
  valueDate: string;
  creditAmount: number;
  narration: string;
}

export interface ErpLedgerSeed {
  invoiceId: string;
  orderId: string;
  customerName: string;
  salesDate: string;
  expectedAmount: number;
  refundAmount: number;
}

const CUSTOMERS = [
  "Aarav Sharma", "Priya Patel", "Karan Chopra", "Ananya Verma", "Rohan Gupta",
  "Devendra Singh", "Meera Nair", "Vikram Malhotra", "Siddharth Das", "Neha Reddy",
  "Amit Kumar", "Pooja Banerjee", "Rajesh Iyer", "Sneha Kulkarni", "Aditya Joshi"
];

export function generateSyntheticFinancialData(count = 75) {
  const razorpayRecords: RazorpaySeed[] = [];
  const bankRecords: BankStatementSeed[] = [];
  const erpRecords: ErpLedgerSeed[] = [];

  const startDate = new Date(2026, 7, 1); // Aug 1, 2026

  for (let i = 1; i <= count; i++) {
    const padId = String(i).padStart(5, "0");
    const orderId = `ORD-2026-${1000 + i}`;
    const invoiceId = `INV-2026-${1000 + i}`;
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    
    // Random transaction amount between ₹1,500 and ₹150,000
    const grossAmount = Math.round((1500 + (i * 1337) % 148500) * 100) / 100;
    
    // Gateway fee ~2% (Standard Razorpay rate)
    const gatewayFee = Math.round(grossAmount * 0.02 * 100) / 100;
    const netSettlement = Math.round((grossAmount - gatewayFee) * 100) / 100;

    const txDate = new Date(startDate.getTime() + i * 86400000 * 0.4);
    const dateStr = txDate.toISOString().split("T")[0];
    const utr = `UTR900${202600 + i}`;

    // 1. Razorpay Record
    razorpayRecords.push({
      paymentId: `pay_RZP_${padId}`,
      orderId,
      customerName: customer,
      grossAmount,
      gatewayFee,
      netSettlement,
      settlementDate: dateStr,
      utrReference: utr
    });

    // 2. Bank Record (with 80% exact UTR, 20% fuzzy bank narration variance)
    if (i % 5 === 0) {
      // Fuzzy exception bank record
      bankRecords.push({
        bankRef: `BNK-2026-${7000 + i}`,
        utrNumber: `MISMATCH_UTR_${i}`,
        valueDate: dateStr,
        creditAmount: netSettlement,
        narration: `CMS/NEFT/RZP SETTLE/${customer.toUpperCase()}/${invoiceId}`
      });
    } else {
      bankRecords.push({
        bankRef: `BNK-2026-${7000 + i}`,
        utrNumber: utr,
        valueDate: dateStr,
        creditAmount: netSettlement,
        narration: `CMS/NEFT/RZP SETTLEMENT/${utr}/${customer.toUpperCase()}`
      });
    }

    // 3. ERP Sales Ledger Record
    erpRecords.push({
      invoiceId,
      orderId,
      customerName: customer,
      salesDate: dateStr,
      expectedAmount: grossAmount,
      refundAmount: i % 12 === 0 ? 500 : 0
    });
  }

  return { razorpayRecords, bankRecords, erpRecords };
}

// Execution Script
if (process.argv[1] && process.argv[1].includes("seed")) {
  console.log("🌱 TriLedger AI Synthetic Financial Data Generator...");
  const data = generateSyntheticFinancialData(100);
  console.log(`✅ Generated ${data.razorpayRecords.length} Razorpay Settlement Records`);
  console.log(`✅ Generated ${data.bankRecords.length} Bank Statement Records`);
  console.log(`✅ Generated ${data.erpRecords.length} ERP Sales Ledger Invoices`);
  
  const outPath = path.join(process.cwd(), "synthetic_dataset.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved dataset to ${outPath}`);
}
