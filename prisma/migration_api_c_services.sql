-- Add API C / Alrahuz data source and bill-service catalogs.

ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ELECTRICITY_PURCHASE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CABLE_TV_PURCHASE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EXAM_PIN_PURCHASE';
ALTER TYPE "ApiSource" ADD VALUE IF NOT EXISTS 'API_C';

CREATE TABLE IF NOT EXISTS "electricity_providers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "discoName" INTEGER NOT NULL,
  "minAmount" INTEGER NOT NULL DEFAULT 500,
  "maxAmount" INTEGER NOT NULL DEFAULT 50000,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "electricity_providers_discoName_key"
  ON "electricity_providers"("discoName");
CREATE INDEX IF NOT EXISTS "electricity_providers_isActive_idx"
  ON "electricity_providers"("isActive");

CREATE TABLE IF NOT EXISTS "cable_providers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cablename" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "cable_providers_cablename_key"
  ON "cable_providers"("cablename");
CREATE INDEX IF NOT EXISTS "cable_providers_isActive_idx"
  ON "cable_providers"("isActive");

CREATE TABLE IF NOT EXISTS "cable_plans" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cableplan" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cable_plans_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "cable_providers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "cable_plans_providerId_cableplan_key"
  ON "cable_plans"("providerId", "cableplan");
CREATE INDEX IF NOT EXISTS "cable_plans_providerId_isActive_idx"
  ON "cable_plans"("providerId", "isActive");

CREATE TABLE IF NOT EXISTS "exam_products" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "examName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "maxQuantity" INTEGER NOT NULL DEFAULT 5,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "exam_products_examName_key"
  ON "exam_products"("examName");
CREATE INDEX IF NOT EXISTS "exam_products_isActive_idx"
  ON "exam_products"("isActive");
