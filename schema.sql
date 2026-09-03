-- ====================================================================
-- LedgerSync Enterprise Production PostgreSQL Database Schema
-- Optimized for High-Frequency 3-Way Financial Reconciliation
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum for Reconciliation Match Categories
DO $$ BEGIN
    CREATE TYPE match_type_enum AS ENUM (
        'EXACT_MATCH',
        'FEE_ADJUSTED',
        'DELAYED_SETTLEMENT',
        'PARTIAL_REFUND',
        'AI_FUZZY_MATCHED',
        'EXCEPTION_UNRESOLVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master Reconciled Transactions Ledger
CREATE TABLE IF NOT EXISTS reconciled_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL,
    match_type match_type_enum NOT NULL DEFAULT 'EXCEPTION_UNRESOLVED',
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Financial Equations
    gross_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    fee_deducted NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    refund_deducted NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    net_bank_received NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    variance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    reasoning TEXT,
    recommended_action TEXT,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Razorpay Payment Gateway Settlement Table
CREATE TABLE IF NOT EXISTS razorpay_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID UNIQUE REFERENCES reconciled_transactions(id) ON DELETE SET NULL,
    payment_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    transaction_amount NUMERIC(15,2) NOT NULL,
    gateway_fee NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    settlement_amount NUMERIC(15,2) NOT NULL,
    settlement_date DATE NOT NULL,
    utr_reference VARCHAR(100)
);

-- 2. Bank Statement Credit Table
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID UNIQUE REFERENCES reconciled_transactions(id) ON DELETE SET NULL,
    bank_ref VARCHAR(100) NOT NULL,
    utr_number VARCHAR(100),
    value_date DATE NOT NULL,
    credit_amount NUMERIC(15,2) NOT NULL,
    narration TEXT NOT NULL
);

-- 3. ERP Sales Ledger Table
CREATE TABLE IF NOT EXISTS erp_sales_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID UNIQUE REFERENCES reconciled_transactions(id) ON DELETE SET NULL,
    invoice_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    sales_date DATE NOT NULL,
    expected_amount NUMERIC(15,2) NOT NULL,
    refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- High-Performance B-Tree & Trigram Indexes
CREATE INDEX IF NOT EXISTS idx_rzp_order_id ON razorpay_settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_rzp_utr ON razorpay_settlements(utr_reference) WHERE utr_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_utr ON bank_statements(utr_number) WHERE utr_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_erp_order_id ON erp_sales_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_id ON erp_sales_ledger(invoice_id);

-- Composite Index for Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_recon_org_status_date ON reconciled_transactions(org_id, match_type, reconciled_at DESC);

-- GIN Trigram Index for Fuzzy Bank Narration Searches
CREATE INDEX IF NOT EXISTS idx_bank_narration_trgm ON bank_statements USING gin (narration gin_trgm_ops);
