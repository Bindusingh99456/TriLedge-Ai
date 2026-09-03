# ⚡ TriLedger AI — 3-Way Financial Reconciliation Engine

![CI Build](https://img.shields.io/badge/CI%2FCD-Passing-emerald?style=for-the-badge&logo=githubactions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-8E44AD?style=for-the-badge&logo=google)

**TriLedger AI** is an enterprise-grade automated 3-way financial reconciliation platform engineered to match high-volume online payment gateway settlements (**Razorpay**), bank deposit credits, and internal ERP sales ledgers (**Tally / SAP**).

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["📱 Web UI Frontend React 19 + Tailwind"] -->|HTTPS Requests| Proxy["🛡️ Nginx Reverse Proxy / SSL Termination"]
    Proxy -->|Pass to Port 3000| API["🚀 Express.js API Node 20 Runtime"]
    
    subgraph Core Engine Services
        API -->|1. Structured JSON Logging| Logger["📜 Logger & Request Tracing"]
        API -->|2. Liveness & Readiness| Probes["/healthz & /ready Probes"]
        API -->|3. OpenAPI / Swagger| Docs["/docs Interactive UI"]
        API -->|4. Real-time Telemetry| SSE["📡 Server-Sent Events SSE Stream"]
    end

    subgraph Data & Matching Layer
        API -->|5. Row-Locked Batch Settlement| DB[("🐘 PostgreSQL 16 DB")]
        API -->|6. Cache-Aside Stats| Redis[("⚡ Redis 7 Cache")]
        API -->|7. Semantic Exception Audit| Gemini["🧠 Gemini 2.5 Flash AI Engine"]
    end
```

---

## ✨ Capability Matrix

| Category | Standard Capability | TriLedger AI Enterprise Capability |
| :--- | :--- | :--- |
| **Matching Logic** | Basic UTR String Matching | **3-Way Deterministic + Gemini 2.5 Flash AI Fuzzy Correlation** |
| **Concurrency** | Blind DB Overwrites | **Pessimistic Row-Level Locking (`SELECT FOR UPDATE`) & Optimistic Tokens** |
| **Performance** | Uncached Aggregations | **Redis Cache-Aside Pattern with Automatic Write Invalidation** |
| **Observability** | Console Print Logs | **Structured JSON Logging with `X-Trace-ID` Request Correlation** |
| **API DX** | Un-documented Endpoints | **OpenAPI 3.0 Interactive Swagger UI at `/docs`** |
| **Streaming** | Polling Interval Loops | **Server-Sent Events (SSE) Live Feed at `/api/stream/reconciliation-logs`** |

---

## 🚀 Quickstart & Local Environment Setup

### 1. Environment Variable Configuration (`.env.example`)

Copy `.env.example` to `.env` and configure your credentials:

| Variable | Description | Example / Default Value |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini AI Key for semantic fuzzy audit | `AIzaSy...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://ledgersync:securepass@localhost:5432/ledgersync_db` |
| `REDIS_URL` | Redis connection URI | `redis://localhost:6379` |
| `NODE_ENV` | Runtime environment mode | `development` / `production` |
| `PORT` | Container ingress port | `3000` |

---

### 2. Local Execution Commands

```bash
# Install dependencies
npm ci

# Start Development Server (Vite + Express)
npm run dev

# Generate 100 Synthetic Financial Records
npm run seed

# Execute High-Throughput Load Benchmark
npm run benchmark

# Execute TypeScript Linter & Typecheck
npm run lint

# Build Standalone Single-File Bundle
npm run build
```

---

### 3. Docker Compose Local Production Parity

Run the full stack (App + PostgreSQL 16 + Redis 7 + Nginx) with container healthchecks:

```bash
docker-compose up --build
```

---

## 🏛️ Architectural Trade-Offs & Decisions

### 1. Concurrency Control: Pessimistic Locking vs. Optimistic Tokens
* **Decision**: Implemented **pessimistic row locking (`activeBatchLocks` / `SELECT ... FOR UPDATE`)** for batch settlement operations.
* **Trade-Off**: While optimistic concurrency (using version numbers) offers higher throughput under low contention, financial reconciliation batch operations suffer from high contention when automated workers process overlapping settlement settlements. Pessimistic locking prevents double-reconciliation and variance corruption under heavy concurrent loads.

### 2. Caching Strategy: Redis Cache-Aside with Write Invalidation
* **Decision**: Implemented **Cache-Aside (`getOrSet`)** with explicit key invalidation (`summary:*`) triggered upon batch settlement writes.
* **Trade-Off**: Ensures sub-millisecond response times for executive summary dashboards while guaranteeing financial consistency by purging stale cached totals immediately upon new transaction reconciliation.
