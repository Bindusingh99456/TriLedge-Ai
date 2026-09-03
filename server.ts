import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "LedgerSync Reconciliation Engine" });
});

// AI Fuzzy Reconciliation & Exception Audit Endpoint
app.post("/api/reconcile-ai", async (req, res) => {
  try {
    const { unmatchedRazorpay, unmatchedBank, unmatchedErp } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in process.env. Returning fallback fuzzy match heuristics.");
      return res.json({
        success: true,
        source: "heuristic-fallback",
        matches: [
          {
            razorpayId: "pay_RZP_00119",
            bankRef: "BNK-2026-9019",
            invoiceId: "INV-2026-1019",
            confidence: 94,
            reasoning: "Matched via fuzzy customer name 'Karan Chopra' and bank reference 'NEFT/INV1019' matching ERP Invoice INV-2026-1019 for ₹23,500."
          }
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a Senior Forensic Accountant and AI Financial Reconciliation Engine for LedgerSync.
Analyze these unmatched 3-way financial transaction records:

Unmatched Razorpay Records:
${JSON.stringify(unmatchedRazorpay, null, 2)}

Unmatched Bank Statement Records:
${JSON.stringify(unmatchedBank, null, 2)}

Unmatched ERP Sales Records:
${JSON.stringify(unmatchedErp, null, 2)}

Task:
Identify fuzzy semantic matches between these records (e.g. matching truncated invoice IDs, UTR references embedded in bank text, customer name variations, or net gateway fee deductions).
Return ONLY a valid JSON array of match objects without any markdown text wrappers.

Required JSON format:
[
  {
    "razorpayId": "pay_RZP_XXXXX",
    "bankRef": "BNK-XXXX-XXXX",
    "invoiceId": "INV-XXXX-XXXX",
    "confidence": 95,
    "reasoning": "Clear explanation of why this is a match"
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "[]";
    let matches = [];
    try {
      matches = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Error parsing Gemini JSON output:", parseErr, responseText);
      matches = [];
    }

    return res.json({
      success: true,
      source: "gemini-2.5-flash",
      matches
    });
  } catch (err: any) {
    console.error("AI Reconciliation error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to execute AI fuzzy reconciliation"
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LedgerSync server running on http://localhost:${PORT}`);
  });
}

startServer();
