CREATE TABLE IF NOT EXISTS "biometric_credentials" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "biometric_credentials_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "biometric_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "biometric_credentials_tokenHash_key" ON "biometric_credentials"("tokenHash");
CREATE INDEX IF NOT EXISTS "biometric_credentials_userId_idx" ON "biometric_credentials"("userId");
CREATE INDEX IF NOT EXISTS "biometric_credentials_phone_idx" ON "biometric_credentials"("phone");
CREATE INDEX IF NOT EXISTS "biometric_credentials_expiresAt_idx" ON "biometric_credentials"("expiresAt");
CREATE INDEX IF NOT EXISTS "biometric_credentials_revokedAt_idx" ON "biometric_credentials"("revokedAt");
