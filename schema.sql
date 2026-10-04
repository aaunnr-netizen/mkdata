-- ==============================================================================
-- MK DATA — Complete Database Schema Definition (Single Source of Truth)
-- Target RDBMS: PostgreSQL 15+ / Neon Serverless PostgreSQL
-- Generated & Verified: Enterprise Client-Ready Release
-- ==============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. ENUM TYPE DEFINITIONS
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "NetworkType" AS ENUM ('MTN', 'GLO', 'AIRTEL', 'NINEMOBILE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM (
        'DATA_PURCHASE',
        'AIRTIME_PURCHASE',
        'ELECTRICITY_PURCHASE',
        'CABLE_TV_PURCHASE',
        'EXAM_PIN_PURCHASE',
        'WALLET_FUNDING',
        'REWARD_CREDIT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApiSource" AS ENUM ('API_A', 'API_B', 'API_C', 'API_D');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RewardType" AS ENUM (
        'SIGNUP_BONUS',
        'FIRST_DEPOSIT_2K',
        'DEPOSIT_10K_UPGRADE',
        'SALES_50GB_WEEKLY',
        'SALES_100GB_WEEKLY'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RewardStatus" AS ENUM ('IN_PROGRESS', 'EARNED', 'CLAIMED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgentRequestStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "NoticeSeverity" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'PROMO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: users
-- Core customer and administrator identity records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "fullName" TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    "pinHash" TEXT,
    email TEXT,
    role "UserRole" NOT NULL DEFAULT 'USER',
    tier TEXT NOT NULL DEFAULT 'user',
    balance INTEGER NOT NULL DEFAULT 0, -- Stored in KOBO (1 NGN = 100 KOBO)
    "rewardBalance" INTEGER NOT NULL DEFAULT 0, -- Stored in KOBO (data purchase only)
    "agentRequestStatus" "AgentRequestStatus" NOT NULL DEFAULT 'NONE',
    "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
    "kycDetails" TEXT,
    "kycSubmittedAt" TIMESTAMP(3) WITH TIME ZONE,
    "apiAccessStatus" TEXT NOT NULL DEFAULT 'NONE',
    "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "joinedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_api_access_status ON users("apiAccessStatus");

-- ------------------------------------------------------------------------------
-- Table: biometric_credentials
-- Mobile app biometric tokens for secure biometric authentication
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biometric_credentials (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) WITH TIME ZONE,
    "expiresAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "revokedAt" TIMESTAMP(3) WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_userId ON biometric_credentials("userId");
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_phone ON biometric_credentials(phone);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_expiresAt ON biometric_credentials("expiresAt");
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_revokedAt ON biometric_credentials("revokedAt");

-- ------------------------------------------------------------------------------
-- Table: virtual_accounts
-- Legacy / Dynamic Virtual funding accounts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS virtual_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "flwRef" TEXT NOT NULL,
    "orderRef" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- Table: user_bank_accounts
-- Dedicated BillStack Reserved Virtual Accounts assigned per user
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_bank_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL UNIQUE,
    "accountName" TEXT,
    "bankName" TEXT NOT NULL,
    "merchantReference" TEXT NOT NULL UNIQUE,
    "providerReference" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_bank_accounts_user_bank UNIQUE ("userId", "bankCode")
);

CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_primary ON user_bank_accounts("userId", "isPrimary");
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_merchant_ref ON user_bank_accounts("merchantReference");

-- ------------------------------------------------------------------------------
-- Table: payment_webhook_events
-- Idempotency ledger for incoming payment gateway webhooks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    provider TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "transactionReference" TEXT,
    "interbankReference" TEXT,
    "merchantReference" TEXT,
    amount INTEGER,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'RECEIVED',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3) WITH TIME ZONE,
    CONSTRAINT uq_webhook_provider_txref UNIQUE (provider, "transactionReference"),
    CONSTRAINT uq_webhook_provider_interbankref UNIQUE (provider, "interbankReference")
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_merchant_ref ON payment_webhook_events("merchantReference");
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON payment_webhook_events(status);

-- ------------------------------------------------------------------------------
-- Table: plans
-- Telecom Mobile Data Plans Catalog (MTN, Airtel, GLO, 9Mobile)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    network "NetworkType" NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    validity TEXT NOT NULL,
    price INTEGER NOT NULL, -- in NAIRA (deprecated - use user_price)
    user_price INTEGER NOT NULL DEFAULT 0, -- Standard customer retail price (NGN)
    agent_price INTEGER NOT NULL DEFAULT 0, -- Reseller/agent wholesale price (NGN)
    "apiSource" "ApiSource" NOT NULL,
    "externalPlanId" INTEGER NOT NULL,
    "externalNetworkId" INTEGER NOT NULL,
    "apiAPlanId" INTEGER,
    "apiANetworkId" INTEGER,
    "apiBPlanId" INTEGER,
    "apiBNetworkId" INTEGER,
    "apiCPlanId" INTEGER,
    "apiCNetworkId" INTEGER,
    "apiDPlanId" INTEGER,
    "apiDNetworkId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "dataType" TEXT NOT NULL DEFAULT 'SME',
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_plans_source_plan_network UNIQUE ("apiSource", "externalPlanId", "externalNetworkId")
);

CREATE INDEX IF NOT EXISTS idx_plans_network ON plans(network);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans("isActive");

-- ------------------------------------------------------------------------------
-- Table: electricity_providers
-- Supported Electricity Distribution Companies (Discos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS electricity_providers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    "discoName" INTEGER NOT NULL UNIQUE,
    "minAmount" INTEGER NOT NULL DEFAULT 500,
    "maxAmount" INTEGER NOT NULL DEFAULT 50000,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_electricity_providers_active ON electricity_providers("isActive");

-- ------------------------------------------------------------------------------
-- Table: cable_providers
-- Cable TV Service Providers (GOtv, DStv, StarTimes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cable_providers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    cablename INTEGER NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cable_providers_active ON cable_providers("isActive");

-- ------------------------------------------------------------------------------
-- Table: cable_plans
-- Cable TV Packages / Bouquets Catalog
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cable_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "providerId" TEXT NOT NULL REFERENCES cable_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cableplan INTEGER NOT NULL,
    price INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cable_plans_provider_cableplan UNIQUE ("providerId", cableplan)
);

CREATE INDEX IF NOT EXISTS idx_cable_plans_provider_active ON cable_plans("providerId", "isActive");

-- ------------------------------------------------------------------------------
-- Table: exam_products
-- Educational Exam Scratch Card PINs (WAEC, NECO, NABTEB, JAMB)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "examName" TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    price INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_products_active ON exam_products("isActive");

-- ------------------------------------------------------------------------------
-- Table: transactions
-- Comprehensive financial and VTU order transaction ledger
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
    "guestPhone" TEXT,
    type "TransactionType" NOT NULL,
    status "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    amount INTEGER NOT NULL, -- in NAIRA
    "balanceBefore" INTEGER, -- in KOBO
    "balanceAfter" INTEGER, -- in KOBO
    phone TEXT NOT NULL,
    "planId" TEXT REFERENCES plans(id),
    description TEXT,
    reference TEXT NOT NULL UNIQUE,
    "externalReference" TEXT,
    "flwRef" TEXT,
    "tempAccountNumber" TEXT,
    "tempBankName" TEXT,
    "tempTxRef" TEXT,
    "apiUsed" "ApiSource",
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_externalReference ON transactions("externalReference");

-- ------------------------------------------------------------------------------
-- Table: rewards
-- Referral and incentive reward tiers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type "RewardType" NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL, -- in NAIRA
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------------------------
-- Table: user_rewards
-- User reward progress and redemption history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_rewards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "rewardId" TEXT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    status "RewardStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "claimedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_rewards_user_reward UNIQUE ("userId", "rewardId")
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_userId ON user_rewards("userId");
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);

-- ------------------------------------------------------------------------------
-- Table: service_notices
-- System announcement banners and maintenance alerts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_notices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity "NoticeSeverity" NOT NULL DEFAULT 'INFO',
    audience TEXT NOT NULL DEFAULT 'all',
    network "NetworkType",
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "startsAt" TIMESTAMP(3) WITH TIME ZONE,
    "endsAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_notices_active_dates ON service_notices("isActive", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS idx_service_notices_audience ON service_notices(audience);

-- ------------------------------------------------------------------------------
-- Table: user_fcm_tokens
-- Firebase Cloud Messaging device registration tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_userId ON user_fcm_tokens("userId");

-- ------------------------------------------------------------------------------
-- Table: airtime_cash_config
-- Airtime-to-cash conversion fees and system configuration
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airtime_cash_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    "feePercent" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Table: api_keys
-- Developer Live API Keys for external apps
-- ==============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Primary Key',
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    "requestReason" TEXT,
    "lastUsedAt" TIMESTAMP(3) WITH TIME ZONE,
    "approvedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys("keyHash");
CREATE INDEX IF NOT EXISTS idx_api_keys_user_status ON api_keys("userId", status);

-- ==============================================================================
-- Table: api_idempotency_keys
-- 24-hour request deduplication and response caching
-- ==============================================================================
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "transactionReference" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_api_idempotency UNIQUE ("userId", endpoint, key)
);

CREATE INDEX IF NOT EXISTS idx_api_idempotency_expires ON api_idempotency_keys("expiresAt");

-- ==============================================================================
-- Table: developer_webhook_endpoints
-- Registered callback URLs for event-driven developer notifications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS developer_webhook_endpoints (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    events TEXT[] NOT NULL DEFAULT ARRAY['data.success', 'data.failed', 'airtime.success', 'airtime.failed'],
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Table: developer_webhook_deliveries
-- Audit log and retry state for webhook events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS developer_webhook_deliveries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "endpointId" TEXT NOT NULL REFERENCES developer_webhook_endpoints(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_endpoint_status ON developer_webhook_deliveries("endpointId", status);
CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_user_created ON developer_webhook_deliveries("userId", "createdAt");

