# 📱 MK DATA — Enterprise Fintech & VTU Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **MK DATA** is a high-performance, enterprise-grade Nigerian fintech and VTU (Virtual Top-Up) platform engineered with Next.js App Router, React 19, Neon Serverless PostgreSQL, Prisma ORM, and TailwindCSS. It facilitates instant mobile data bundling, airtime top-ups, electricity token vending, cable TV subscriptions, educational exam PIN purchases, and automated wallet funding via reserved virtual bank accounts.

---

## 🏗 System Architecture & Workflow

The architecture follows a resilient, API-driven design featuring atomic database transactions, anti-race wallet balance guards, multiple telecom vendor failovers, and asynchronous webhook reconciliation.

```mermaid
graph TD
    User([End User / Agent / Guest]) -->|HTTPS / REST| NextApp[Next.js App Router Web & PWA]
    NextApp -->|JWT / Biometrics| AuthEngine[Auth & Session Engine]
    NextApp -->|Direct / In-App Checkout| PurchaseEngine[Order & VTU Dispatcher]
    
    PurchaseEngine -->|Atomic Balance Deduction| NeonDB[(Neon Serverless PostgreSQL)]
    
    PurchaseEngine -->|Primary Vendor| Alrahuz[Alrahuz VTU API]
    PurchaseEngine -->|Failover / Multi-Vendor| OtherVTU[AmySub / Saiful / SMEPlug]
    
    User -->|Bank Transfer / USSD| ReservedAcc[BillStack Reserved Virtual Accounts]
    ReservedAcc -->|HMAC Verified Webhook| WebhookHandler[BillStack Webhook Engine]
    WebhookHandler -->|Idempotent Credit| NeonDB
    
    Admin([Administrator]) -->|Role Guard / PIN Auth| AdminPortal[Admin Management Suite]
    AdminPortal -->|Catalog & Pricing Sync| NeonDB
    AdminPortal -->|FCM Multicast| Firebase[Firebase Admin Push Notifications]
```

---

## 📁 Repository Directory Structure

```text
mkdata/
├── app/                              # Next.js App Router Architecture
│   ├── (auth)/                       # Authentication views (Login, Signup)
│   ├── admin/                        # Dedicated Admin Portal routes & submodules
│   │   ├── agents/                   # Agent upgrade review & management
│   │   ├── airtime-cash/             # Airtime-to-cash fee configuration
│   │   ├── analytics/                # Real-time revenue & order analytics
│   │   ├── broadcasts/               # Push notification broadcast manager
│   │   ├── kyc/                      # User KYC verification & compliance
│   │   ├── notices/                  # System-wide announcement banner editor
│   │   ├── plans/                    # Data plan pricing & network toggles
│   │   ├── pricing/                  # Retail vs wholesale tier pricing
│   │   ├── push-notifications/       # Direct device push dispatcher
│   │   ├── rewards/                  # Milestone bonus management
│   │   ├── services/                 # Electricity, Cable TV, & Exam catalogs
│   │   ├── transactions/             # Global financial audit log
│   │   ├── users/                    # User account editor & balance credit/debit
│   │   └── webhooks/                 # Payment gateway webhook monitoring
│   ├── api/                          # REST API Endpoints
│   │   ├── admin/                    # Admin API endpoints (guards & mutations)
│   │   ├── agent/                    # Agent registration and status
│   │   ├── airtime/                  # Airtime vending
│   │   ├── auth/                     # Session, JWT, Biometrics, PIN reset
│   │   ├── cable/                    # Cable TV lookup & subscription
│   │   ├── data/                     # Data bundle purchase & guest checkout
│   │   ├── electricity/              # Disco bill verification & token vending
│   │   ├── exam/                     # WAEC/NECO/JAMB PIN purchases
│   │   ├── notices/                  # Active service notices
│   │   ├── payments/                 # BillStack reserved accounts & webhooks
│   │   ├── rewards/                  # Incentive progress & claims
│   │   ├── settings/                 # System parameters
│   │   └── transactions/             # Order verification & status querying
│   ├── app/                          # In-App User Dashboard & Embedded Flows
│   ├── privacy/                      # Privacy Policy & Compliance
│   ├── transaction-status/           # Public receipt & order verification
│   ├── layout.tsx                    # Root layout with Theme & Query providers
│   └── page.tsx                      # High-converting landing page
├── components/                       # Reusable UI component library (shadcn/ui)
├── docs/                             # Official client handover & deployment runbooks
│   └── HANDOVER_CHECKLIST.md         # Production cutover & credential matrix
├── hooks/                            # Custom React Hooks
├── lib/                              # Core backend libraries & utility modules
│   ├── adminAuth.ts                  # Admin session verification & guards
│   ├── alrahuz.ts                    # Alrahuz VTU API driver
│   ├── amysub.ts                     # AmySub VTU API driver
│   ├── auth.ts                       # Jose JWT signing & cookie management
│   ├── billstack.ts                  # BillStack Virtual Accounts & Webhooks
│   ├── db.ts                         # Prisma Client singleton
│   ├── firebase.ts                   # Firebase Admin SDK & FCM Multicast
│   ├── saiful.ts                     # Saiful Legend Connect API driver
│   ├── security.ts                   # CSRF, rate-limiting & sanitization
│   └── smeplug.ts                    # SMEPlug API driver
├── prisma/                           # Database Schema & Seed Data
│   ├── schema.prisma                 # Declarative Prisma schema definition
│   └── seed.ts                       # Base catalog & initial admin seeder
├── public/                           # Static assets, logos, and network icons
├── scripts/                          # Production tooling & catalog scripts
│   ├── deploy-and-seed.sh            # One-click deployment shell script
│   ├── generate-og-images.js         # Dynamic social share card generator
│   └── seed-admin-services.ts        # Comprehensive utility service seeder
├── store/                            # Client-side Zustand stores
├── tests/                            # Automated test suite
├── .env.example                      # Complete environment configuration template
├── package.json                      # Dependencies and npm build scripts
├── schema.sql                        # Consolidated PostgreSQL schema (Source of truth)
└── tsconfig.json                     # TypeScript configuration
```

---

## 🔐 Environment Variables Reference

All runtime configuration is managed through environment variables. Copy `.env.example` to `.env.local` for local execution.

| Category | Variable Name | Required | Description | Example Fallback |
| :--- | :--- | :---: | :--- | :--- |
| **App** | `NEXT_PUBLIC_APP_URL` | **Yes** | Public canonical domain of the web app | `https://mkdata.com.ng` |
| **App** | `NODE_ENV` | No | Runtime environment (`development` / `production`) | `production` |
| **App** | `PORT` | No | HTTP server port | `3000` |
| **Database** | `DATABASE_URL` | **Yes** | Neon PostgreSQL connection string (Pooled) | `postgresql://user:pass@host/db?sslmode=require` |
| **Database** | `DIRECT_URL` | No | Unpooled Neon PostgreSQL string (Migrations) | `postgresql://user:pass@host/db?sslmode=require` |
| **Security** | `JWT_SECRET` | **Yes** | 256-bit entropy secret for JWT signing | `min_32_chars_random_string` |
| **Security** | `ADMIN_PASSWORD` | **Yes** | Master fallback password for admin login | `secure_admin_password` |
| **Admin** | `MK_ADMIN_PHONE` | **Yes** | Primary Superadmin phone number | `09066120642` |
| **Admin** | `MK_ADMIN_NAME` | No | Display name for seed superadmin | `MK Admin` |
| **Admin** | `MK_ADMIN_PIN` | **Yes** | 6-digit numeric PIN for seed superadmin | `000000` |
| **Payments** | `BILLSTACK_SECRET_KEY` | **Yes** | BillStack Secret Key for API & Webhook signatures | `sk_live_...` |
| **Payments** | `BILLSTACK_BASE_URL` | No | Base API URL for BillStack endpoints | `https://api.billstack.co/v1` |
| **VTU Vendor** | `ALRAHUZ_API_TOKEN` | **Yes** | Alrahuz VTU partner API authorization token | `66f2e...` |
| **VTU Vendor** | `ALRAHUZ_EPIN_API_TOKEN` | No | Dedicated Alrahuz token for exam PINs | `same as ALRAHUZ_API_TOKEN` |
| **VTU Vendor** | `ALRAHUZ_BASE_URL` | No | Alrahuz base API URL | `https://alrahuzdata.com.ng` |
| **VTU Vendor** | `AMYSUB_API_KEY` | No | Secondary/backup provider API key | `...` |
| **VTU Vendor** | `SAIFUL_API_KEY` | No | Alternative telecom provider API key | `...` |
| **VTU Vendor** | `SMEPLUG_API_KEY` | No | SMEPlug partner API key | `...` |
| **Firebase** | `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional | Stringified JSON for Vercel FCM push delivery | `{"type":"service_account",...}` |
| **Firebase** | `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional | Local filesystem path to service account JSON | `./firebase-adminsdk.json` |

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: Version `20.x` or higher (LTS recommended)
- **PostgreSQL**: Neon Serverless or standard PostgreSQL 15+
- **Package Manager**: `npm` (included with Node.js)

### 2. Installation Steps
```bash
# 1. Clone the repository
git clone <repo-url>
cd mkdata

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Open .env.local and insert your valid database URL and API keys

# 4. Generate Prisma Client
npx prisma generate

# 5. Initialize Database & Seed Catalogs
npx prisma db push
npm run seed
npm run seed:admin-services

# 6. Start the Next.js development server
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

---

## 🗄 Database Architecture & Management

The repository uses a single, consolidated `schema.sql` as the primary source of truth.

### Core Relational Entities
- **`users`**: Customer profiles, phone numbers, hashed transaction PINs, role definitions (`USER`, `AGENT`, `ADMIN`), and balances in Kobo.
- **`user_bank_accounts`**: Dedicated BillStack Reserved Virtual Accounts allocated to each user.
- **`plans`**: Multi-network mobile data catalog with separate `user_price` (retail) and `agent_price` (wholesale) pricing.
- **`electricity_providers` & `cable_providers`**: Utilities catalog mapping external vendor product IDs to internal services.
- **`transactions`**: Immutable financial ledger tracking debits, credits, reference hashes, and vendor responses.
- **`payment_webhook_events`**: Idempotent webhook tracking preventing duplicate wallet crediting.

### Manual Database Initialization
If connecting to a fresh Neon or PostgreSQL instance:
```bash
# Apply schema directly using psql:
psql "$DATABASE_URL" -f schema.sql

# Seed initial admin user and services catalog:
npm run seed:admin-services
```

---

## 💳 Payment & Webhook Integration (BillStack)

### Dedicated Virtual Accounts
Upon registration or initial wallet visit, users receive a permanent dedicated bank account (e.g., Wema Bank / Providus Bank) generated via BillStack:
- **API**: `POST /api/payments/reserved-account`
- **Driver**: `lib/billstack.ts`

### Webhook Processing
- **Webhook Endpoint**: `POST /api/payments/webhook`
- **Security**: Validates the `x-billstack-signature` against `BILLSTACK_SECRET_KEY`.
- **Idempotency**: Every inbound transaction reference is recorded in `payment_webhook_events`. Repeated webhook payloads are safely acknowledged with HTTP 200 without double-crediting balances.

---

## 🛡 Admin Portal Operations

The Admin Portal is accessed at `/admin` or `/app` (in Admin mode).

- **Default Administrator Phone**: `09066120642`
- **Default PIN**: `000000` (Can be updated via Admin Settings)

### Administrative Features:
1. **Catalog & Pricing Engine (`/admin/plans`, `/admin/services`)**: Modify retail prices, agent discounts, and enable/disable individual data bundles or utility billers.
2. **User & Balance Management (`/admin/users`)**: Search any user by phone number, adjust wallet balances (with mandatory audit logs), and reset forgotten PINs.
3. **Agent Approval Queue (`/admin/agents`)**: Review pending agent applications and toggle user tiers.
4. **Broadcast & Push Notifications (`/admin/broadcasts`, `/admin/notices`)**: Publish system notices and send instant push notifications to all registered mobile devices.
5. **Webhook & Audit Logs (`/admin/webhooks`, `/admin/transactions`)**: Live inspection of incoming payment webhooks and vendor API response logs.

---

## 🚢 Deployment Runbook (Vercel)

### Production Deployment to Vercel
1. Push your repository to GitHub / GitLab.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Set the **Framework Preset** to **Next.js**.
4. Configure all required Environment Variables listed in `.env.example`.
5. Set the **Build Command** to:
   ```bash
   prisma generate && next build
   ```
6. Deploy.

---

## 🧪 Automated Testing & Quality Verification

Run the comprehensive test suite locally:
```bash
# Execute unit and integration tests
npm test

# Verify production build compilation
npm run build
```

---

## 📞 Developer Contact & Technical Support

For technical inquiries, source code walkthroughs, server migrations, or handover assistance:
- **Lead Developer Phone / WhatsApp**: `08034910470`
- **Handover Support**: Direct Architecture & Environment Inquiries
