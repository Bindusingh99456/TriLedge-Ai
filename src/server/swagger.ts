export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TriLedger AI Enterprise Reconciliation Engine API",
    version: "1.0.0",
    description: "High-performance, 3-way automated financial reconciliation REST API with AI fuzzy matching, streaming SSE logs, and optimistic concurrency transactions."
  },
  servers: [
    {
      url: "/",
      description: "Current Application Environment"
    }
  ],
  paths: {
    "/healthz": {
      get: {
        summary: "Liveness Probe",
        description: "Returns HTTP 200 if the container engine process is running.",
        responses: {
          "200": {
            description: "Service is live",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "live" },
                    service: { type: "string", example: "LedgerSync Reconciliation Engine" },
                    timestamp: { type: "string", example: "2026-09-03T05:00:00.000Z" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/ready": {
      get: {
        summary: "Readiness Probe",
        description: "Checks database connectivity, cache cluster status, and AI engine readiness.",
        responses: {
          "200": {
            description: "Service dependencies are ready",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ready" },
                    components: {
                      type: "object",
                      properties: {
                        database: { type: "string", example: "healthy" },
                        redisCache: { type: "string", example: "healthy" },
                        matchingEngine: { type: "string", example: "healthy" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/reconcile-ai": {
      post: {
        summary: "Execute AI Fuzzy 3-Way Reconciliation",
        description: "Leverages Gemini 2.5 Flash to perform semantic, fuzzy financial matching across unmatched gateway settlements, bank credits, and ERP invoices.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  unmatchedRazorpay: { type: "array", items: { type: "object" } },
                  unmatchedBank: { type: "array", items: { type: "object" } },
                  unmatchedErp: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "AI Fuzzy matching result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    source: { type: "string", example: "gemini-2.5-flash" },
                    matches: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          razorpayId: { type: "string", example: "pay_RZP_00119" },
                          bankRef: { type: "string", example: "BNK-2026-9019" },
                          invoiceId: { type: "string", example: "INV-2026-1019" },
                          confidence: { type: "number", example: 95 },
                          reasoning: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/stream/reconciliation-logs": {
      get: {
        summary: "Stream Real-time Reconciliation Events (SSE)",
        description: "Establishes a Server-Sent Events channel to stream live batch processing events, exception flags, and telemetry metrics.",
        responses: {
          "200": {
            description: "Server-Sent Event Stream",
            content: {
              "text/event-stream": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    },
    "/api/reconcile-batch": {
      post: {
        summary: "Pessimistic Row-Locked Batch Settlement",
        description: "Executes an atomic transaction with concurrency tokens and row-level lock emulation to prevent double-reconciliation under high volume.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  batchId: { type: "string", example: "batch-2026-09-01" },
                  transactionIds: { type: "array", items: { type: "string" } },
                  concurrencyToken: { type: "string", example: "token-908123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Batch lock & transaction result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    processedCount: { type: "number", example: 12 },
                    lockAcquired: { type: "boolean", example: true },
                    concurrencyToken: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/stats": {
      get: {
        summary: "Retrieve Cached Reconciliation Metrics",
        description: "Fetches system-wide summary metrics utilizing the Redis Cache-Aside pattern.",
        responses: {
          "200": {
            description: "Cached system metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    source: { type: "string", example: "cache" },
                    data: { type: "object" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export function renderSwaggerUiHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TriLedger AI API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background-color: #0F172A; }
    .swagger-ui { background-color: #0F172A; color: #E2E8F0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #38BDF8 !important; }
    .swagger-ui .scheme-container { background: #1E293B; box-shadow: none; border-bottom: 1px solid #334155; }
    .swagger-ui select { background: #1E293B; color: #fff; border: 1px solid #475569; }
    .swagger-ui .opblock { border-radius: 8px; border: 1px solid #334155; background: #1E293B; }
    .swagger-ui .opblock .opblock-summary-method { font-weight: bold; border-radius: 4px; }
    .swagger-ui .opblock-summary-description { color: #94A3B8; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    };
  </script>
</body>
</html>`;
}
