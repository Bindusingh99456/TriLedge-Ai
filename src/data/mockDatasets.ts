/**
 * Mock Synthetic Datasets for LedgerSync 3-Way Reconciliation
 * Includes: Razorpay Settlement CSV, Bank Statement CSV, and ERP Sales Ledger CSV
 */

import { BankRecord, ErpRecord, RazorpayRecord } from "../types";

export const SAMPLE_RAZORPAY_CSV = `Payment_ID,Order_ID,Customer_Name,Customer_Email,Transaction_Amount,Gateway_Fee,Settlement_Amount,Settlement_Date,UTR_Reference,Status
pay_RZP_00101,ORD-2026-1001,Aarav Sharma,aarav@example.com,12500,250,12250,2026-08-20,UTR98765432101,captured
pay_RZP_00102,ORD-2026-1002,Priya Patel,priya@example.com,8400,168,8232,2026-08-20,UTR98765432102,captured
pay_RZP_00103,ORD-2026-1003,Rohan Verma,rohan@example.com,15000,300,14700,2026-08-21,UTR98765432103,captured
pay_RZP_00104,ORD-2026-1004,Ananya Gupta,ananya@example.com,4500,90,4410,2026-08-21,UTR98765432104,captured
pay_RZP_00105,ORD-2026-1005,Vikram Malhotra,vikram@example.com,32000,640,31360,2026-08-22,UTR98765432105,captured
pay_RZP_00106,ORD-2026-1006,Sneha Reddy,sneha@example.com,9600,192,9408,2026-08-22,UTR98765432106,captured
pay_RZP_00107,ORD-2026-1007,Kabir Mehta,kabir@example.com,21000,420,20580,2026-08-23,UTR98765432107,captured
pay_RZP_00108,ORD-2026-1008,Neha Joshi,neha@example.com,6700,134,6566,2026-08-23,UTR98765432108,captured
pay_RZP_00109,ORD-2026-1009,Dev Nair,dev@example.com,18500,370,18130,2026-08-24,UTR98765432109,captured
pay_RZP_00110,ORD-2026-1010,Kavya Iyer,kavya@example.com,11200,224,10976,2026-08-24,UTR98765432110,captured
pay_RZP_00111,ORD-2026-1011,Aditya Singh,aditya@example.com,5400,108,5292,2026-08-24,UTR98765432111,captured
pay_RZP_00112,ORD-2026-1012,Meera Saxena,meera@example.com,27500,550,26950,2026-08-25,UTR98765432112,captured
pay_RZP_00113,ORD-2026-1013,Siddharth Rao,sidd@example.com,14000,280,13720,2026-08-25,UTR98765432113,captured
pay_RZP_00114,ORD-2026-1014,Ishita Deshmukh,ishita@example.com,8900,178,8722,2026-08-25,UTR98765432114,captured
pay_RZP_00115,ORD-2026-1015,Rahul Bansal,rahul@example.com,41000,820,40180,2026-08-26,UTR98765432115,captured
pay_RZP_00116,ORD-2026-1016,Tanvi Kulkarni,tanvi@example.com,7300,146,7154,2026-08-26,UTR98765432116,captured
pay_RZP_00117,ORD-2026-1017,Varun Bhatia,varun@example.com,19800,396,19404,2026-08-26,UTR98765432117,captured
pay_RZP_00118,ORD-2026-1018,Diya Kapoor,diya@example.com,16200,324,15876,2026-08-26,UTR98765432118,captured
pay_RZP_00119,ORD-2026-1019,Karan Chopra,karan@example.com,23500,470,23030,2026-08-26,UTR98765432119,captured
pay_RZP_00120,ORD-2026-1020,Riya Trivedi,riya@example.com,10500,210,10290,2026-08-26,UTR98765432120,captured
pay_RZP_00121,ORD-2026-1021,Arjun Sen,arjun@example.com,9200,184,9016,2026-08-26,UTR98765432121,captured
pay_RZP_00122,ORD-2026-1022,Pooja Agarwal,pooja@example.com,17800,356,17444,2026-08-26,UTR98765432122,captured
pay_RZP_00123,ORD-2026-1023,Yash Vardhan,yash@example.com,31000,620,30380,2026-08-26,UTR98765432123,captured
pay_RZP_00124,ORD-2026-1024,Nisha Choudhury,nisha@example.com,12000,240,11760,2026-08-26,UTR98765432124,captured
pay_RZP_00125,ORD-2026-1025,Manish Pandey,manish@example.com,50000,1000,49000,2026-08-26,UTR98765432125,captured`;

export const SAMPLE_BANK_CSV = `Bank_Ref,UTR_Number,Value_Date,Credit_Amount,Debit_Amount,Description,Bank_Code
BNK-2026-9001,UTR98765432101,2026-08-20,12250,0,CMS/Razorpay/UTR98765432101/Aarav,HDFC00012
BNK-2026-9002,UTR98765432102,2026-08-20,8232,0,CMS/Razorpay/UTR98765432102/Priya,HDFC00012
BNK-2026-9003,UTR98765432103,2026-08-21,14700,0,CMS/Razorpay/UTR98765432103/Rohan,HDFC00012
BNK-2026-9004,UTR98765432104,2026-08-21,4410,0,CMS/Razorpay/UTR98765432104/Ananya,HDFC00012
BNK-2026-9005,UTR98765432105,2026-08-22,31360,0,CMS/Razorpay/UTR98765432105/Vikram,HDFC00012
BNK-2026-9006,UTR98765432106,2026-08-22,9408,0,CMS/Razorpay/UTR98765432106/Sneha,HDFC00012
BNK-2026-9007,UTR98765432107,2026-08-23,20580,0,CMS/Razorpay/UTR98765432107/Kabir,HDFC00012
BNK-2026-9008,UTR98765432108,2026-08-23,6566,0,CMS/Razorpay/UTR98765432108/Neha,HDFC00012
BNK-2026-9009,UTR98765432109,2026-08-24,18130,0,CMS/Razorpay/UTR98765432109/Dev,HDFC00012
BNK-2026-9010,UTR98765432110,2026-08-24,10976,0,CMS/Razorpay/UTR98765432110/Kavya,HDFC00012
BNK-2026-9011,UTR98765432111,2026-08-24,5292,0,CMS/Razorpay/UTR98765432111/Aditya,HDFC00012
BNK-2026-9012,UTR98765432112,2026-08-25,26950,0,CMS/Razorpay/UTR98765432112/Meera,HDFC00012
BNK-2026-9013,UTR98765432113,2026-08-25,13720,0,CMS/Razorpay/UTR98765432113/Sidd,HDFC00012
BNK-2026-9014,UTR98765432114,2026-08-25,8722,0,CMS/Razorpay/UTR98765432114/Ishita,HDFC00012
BNK-2026-9015,UTR98765432115,2026-08-26,40180,0,CMS/Razorpay/UTR98765432115/Rahul,HDFC00012
BNK-2026-9016,UTR98765432116,2026-08-26,7154,0,CMS/Razorpay/UTR98765432116/Tanvi,HDFC00012
BNK-2026-9017,UTR98765432117,2026-08-27,19404,0,CMS/Razorpay/UTR98765432117/Varun (Delayed),HDFC00012
BNK-2026-9018,UTR98765432118,2026-08-26,13876,0,CMS/Razorpay/UTR98765432118/Diya Partial Refund,HDFC00012
BNK-2026-9019,UTR4587990022,2026-08-26,23030,0,NEFT/INV1019/Karan Chopra Fuzzy,HDFC00012
BNK-2026-9020,UTR98765432120,2026-08-26,10290,0,CMS/Razorpay/UTR98765432120/Riya,HDFC00012
BNK-2026-9021,UTR98765432121,2026-08-26,9016,0,CMS/Razorpay/UTR98765432121/Arjun,HDFC00012
BNK-2026-9022,UTR98765432122,2026-08-26,17444,0,CMS/Razorpay/UTR98765432122/Pooja,HDFC00012
BNK-2026-9023,UTR98765432123,2026-08-26,30380,0,CMS/Razorpay/UTR98765432123/Yash,HDFC00012
BNK-2026-9024,UTR98765432124,2026-08-26,10500,0,CMS/Razorpay/UTR98765432124/Nisha Discrepancy,HDFC00012`;

export const SAMPLE_ERP_CSV = `Invoice_ID,Order_ID,Sales_Date,Customer_Name,Expected_Amount,Refund_Amount,Net_Expected,Payment_Status
INV-2026-1001,ORD-2026-1001,2026-08-20,Aarav Sharma,12500,0,12500,Paid
INV-2026-1002,ORD-2026-1002,2026-08-20,Priya Patel,8400,0,8400,Paid
INV-2026-1003,ORD-2026-1003,2026-08-21,Rohan Verma,15000,0,15000,Paid
INV-2026-1004,ORD-2026-1004,2026-08-21,Ananya Gupta,4500,0,4500,Paid
INV-2026-1005,ORD-2026-1005,2026-08-22,Vikram Malhotra,32000,0,32000,Paid
INV-2026-1006,ORD-2026-1006,2026-08-22,Sneha Reddy,9600,0,9600,Paid
INV-2026-1007,ORD-2026-1007,2026-08-23,Kabir Mehta,21000,0,21000,Paid
INV-2026-1008,ORD-2026-1008,2026-08-23,Neha Joshi,6700,0,6700,Paid
INV-2026-1009,ORD-2026-1009,2026-08-24,Dev Nair,18500,0,18500,Paid
INV-2026-1010,ORD-2026-1010,2026-08-24,Kavya Iyer,11200,0,11200,Paid
INV-2026-1011,ORD-2026-1011,2026-08-24,Aditya Singh,5400,0,5400,Paid
INV-2026-1012,ORD-2026-1012,2026-08-25,Meera Saxena,27500,0,27500,Paid
INV-2026-1013,ORD-2026-1013,2026-08-25,Siddharth Rao,14000,0,14000,Paid
INV-2026-1014,ORD-2026-1014,2026-08-25,Ishita Deshmukh,8900,0,8900,Paid
INV-2026-1015,ORD-2026-1015,2026-08-26,Rahul Bansal,41000,0,41000,Paid
INV-2026-1016,ORD-2026-1016,2026-08-26,Tanvi Kulkarni,7300,0,7300,Paid
INV-2026-1017,ORD-2026-1017,2026-08-26,Varun Bhatia,19800,0,19800,Paid
INV-2026-1018,ORD-2026-1018,2026-08-26,Diya Kapoor,16200,2000,14200,Partial_Refund
INV-2026-1019,ORD-2026-1019,2026-08-26,Karan Chopra,23500,0,23500,Paid
INV-2026-1020,ORD-2026-1020,2026-08-26,Riya Trivedi,10500,0,10500,Paid
INV-2026-1021,ORD-2026-1021,2026-08-26,Arjun Sen,9200,0,9200,Paid
INV-2026-1022,ORD-2026-1022,2026-08-26,Pooja Agarwal,17800,0,17800,Paid
INV-2026-1023,ORD-2026-1023,2026-08-26,Yash Vardhan,31000,0,31000,Paid
INV-2026-1024,ORD-2026-1024,2026-08-26,Nisha Choudhury,12000,0,12000,Paid
INV-2026-1025,ORD-2026-1025,2026-08-26,Manish Pandey,50000,0,50000,Paid`;

// Parser utilities
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (!currentLine) continue;

    const values = currentLine.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const rowObj: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : "";
    });

    rows.push(rowObj);
  }

  return rows;
}

export function loadParsedMockDataset() {
  const rawRazorpay = parseCSV(SAMPLE_RAZORPAY_CSV);
  const rawBank = parseCSV(SAMPLE_BANK_CSV);
  const rawErp = parseCSV(SAMPLE_ERP_CSV);

  const razorpayRecords: RazorpayRecord[] = rawRazorpay.map(row => ({
    paymentId: row.Payment_ID || row.payment_id || "",
    orderId: row.Order_ID || row.order_id || "",
    customerName: row.Customer_Name || row.customer_name || "Unknown Customer",
    customerEmail: row.Customer_Email || row.customer_email || "",
    transactionAmount: parseFloat(row.Transaction_Amount || "0"),
    gatewayFee: parseFloat(row.Gateway_Fee || "0"),
    settlementAmount: parseFloat(row.Settlement_Amount || "0"),
    settlementDate: row.Settlement_Date || row.settlement_date || "",
    utrReference: row.UTR_Reference || row.utr_reference || "",
    status: row.Status || row.status || "captured"
  }));

  const bankRecords: BankRecord[] = rawBank.map(row => ({
    bankRef: row.Bank_Ref || row.bank_ref || "",
    utrNumber: row.UTR_Number || row.utr_number || "",
    valueDate: row.Value_Date || row.value_date || "",
    creditAmount: parseFloat(row.Credit_Amount || "0"),
    debitAmount: parseFloat(row.Debit_Amount || "0"),
    description: row.Description || row.description || "",
    bankCode: row.Bank_Code || row.bank_code || ""
  }));

  const erpRecords: ErpRecord[] = rawErp.map(row => ({
    invoiceId: row.Invoice_ID || row.invoice_id || "",
    orderId: row.Order_ID || row.order_id || "",
    salesDate: row.Sales_Date || row.sales_date || "",
    customerName: row.Customer_Name || row.customer_name || "Unknown",
    expectedAmount: parseFloat(row.Expected_Amount || "0"),
    refundAmount: parseFloat(row.Refund_Amount || "0"),
    netExpectedAmount: parseFloat(row.Net_Expected || row.net_expected || "0"),
    paymentStatus: row.Payment_Status || row.payment_status || "Paid"
  }));

  return { razorpayRecords, bankRecords, erpRecords };
}
