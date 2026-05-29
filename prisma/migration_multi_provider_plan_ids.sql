ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "apiAPlanId" INTEGER,
  ADD COLUMN IF NOT EXISTS "apiANetworkId" INTEGER,
  ADD COLUMN IF NOT EXISTS "apiBPlanId" INTEGER,
  ADD COLUMN IF NOT EXISTS "apiBNetworkId" INTEGER,
  ADD COLUMN IF NOT EXISTS "apiCPlanId" INTEGER,
  ADD COLUMN IF NOT EXISTS "apiCNetworkId" INTEGER;

UPDATE "plans"
SET
  "apiAPlanId" = COALESCE("apiAPlanId", CASE WHEN "apiSource" = 'API_A' THEN "externalPlanId" END),
  "apiANetworkId" = COALESCE("apiANetworkId", CASE WHEN "apiSource" = 'API_A' THEN "externalNetworkId" END),
  "apiBPlanId" = COALESCE("apiBPlanId", CASE WHEN "apiSource" = 'API_B' THEN "externalPlanId" END),
  "apiBNetworkId" = COALESCE("apiBNetworkId", CASE WHEN "apiSource" = 'API_B' THEN "externalNetworkId" END),
  "apiCPlanId" = COALESCE("apiCPlanId", CASE WHEN "apiSource" = 'API_C' THEN "externalPlanId" END),
  "apiCNetworkId" = COALESCE("apiCNetworkId", CASE WHEN "apiSource" = 'API_C' THEN "externalNetworkId" END);
