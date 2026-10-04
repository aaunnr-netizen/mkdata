"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Code2,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

type CodeLang = "curl" | "node" | "python";

export default function DocumentationPage() {
  const [activeLang, setActiveLang] = useState<CodeLang>("curl");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    toast.success("Code snippet copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full min-w-0">
        {/* Sticky GitBook Table of Contents Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#eaf2ff]">
              <BookOpen className="h-4 w-4 text-[#008fef]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#06133a]">
                API Reference
              </span>
            </div>

            <nav className="space-y-1 text-xs">
              <a
                href="#overview"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>1. Overview & Base URL</span>
              </a>
              <a
                href="#auth"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>2. Authentication</span>
              </a>
              <a
                href="#idempotency"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>3. Idempotency</span>
              </a>
              <a
                href="#balance"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>4. Balance Requery</span>
              </a>
              <a
                href="#data-plans"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>5. Data Plans Catalog</span>
              </a>
              <a
                href="#data-purchase"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>6. Buy Mobile Data</span>
              </a>
              <a
                href="#airtime-purchase"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>7. Buy Airtime</span>
              </a>
              <a
                href="#transaction-requery"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>8. Transaction Status</span>
              </a>
              <a
                href="#webhooks"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>9. Webhooks & HMAC</span>
              </a>
              <a
                href="#errors"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#526079] hover:text-[#008fef] hover:bg-[#f0f7ff] transition-colors"
              >
                <span>10. Error Codes</span>
              </a>
            </nav>
          </div>

          {/* Global Language Selector */}
          <div className="p-4 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-2">
            <span className="block text-[11px] font-bold text-[#526079] uppercase tracking-wider">
              Code Samples Language
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#f0f7ff] rounded-xl border border-[#cfe2fb]">
              <button
                onClick={() => setActiveLang("curl")}
                className={`py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLang === "curl" ? "bg-white text-[#008fef] shadow-2xs" : "text-[#526079]"
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveLang("node")}
                className={`py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLang === "node" ? "bg-white text-[#008fef] shadow-2xs" : "text-[#526079]"
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveLang("python")}
                className={`py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLang === "python" ? "bg-white text-[#008fef] shadow-2xs" : "text-[#526079]"
                }`}
              >
                Python
              </button>
            </div>
          </div>
        </aside>

        {/* Main Documentation Flow */}
        <main className="flex-1 min-w-0 space-y-12 pb-24">
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                1. Overview
              </span>
              <h1 className="text-2xl font-black text-[#06133a] tracking-tight">
                MK DATA Developer Platform API
              </h1>
              <p className="text-xs text-[#526079] leading-relaxed">
                Welcome to the MK DATA developer documentation. Our REST API enables software engineers, fintechs, and VTU aggregators to vend Nigerian mobile data bundles, airtime top-ups, and verify transaction statuses with sub-second execution speeds, automated wholesale agent pricing, and 99.9% uptime.
              </p>

              <div className="p-3.5 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] text-xs font-mono text-[#06133a] break-all">
                <span className="text-[#526079]">Production Base URL: </span>
                <strong className="text-[#008fef]">https://mkdatasub.com/api/v1</strong>
              </div>
            </div>
          </section>

          {/* Section 2: Authentication */}
          <section id="auth" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                2. Authentication
              </span>
              <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                API Keys & Authorization Header
              </h2>
              <p className="text-xs text-[#526079] leading-relaxed">
                Authenticate all requests to the API by providing your live production key in the HTTP <code className="font-mono text-[#008fef]">Authorization</code> header using the standard Bearer scheme.
              </p>

              <div className="p-4 rounded-xl bg-[#06133a] text-[#86e1fc] font-mono text-xs overflow-x-auto flex items-center justify-between gap-4">
                <span className="break-all">Authorization: Bearer mk_live_a1b2c3d4e5f6071829...</span>
                <button
                  onClick={() => copyCode("Authorization: Bearer mk_live_a1b2c3d4e5f6071829...", "auth-header")}
                  className="p-1 rounded text-[#7fa5d8] hover:text-white shrink-0"
                >
                  {copiedIndex === "auth-header" ? <Check className="h-4 w-4 text-[#00a040]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46]">
                <strong>Agent Wholesale Pricing Guaranteed:</strong> Requests authenticated with your live developer key automatically receive discounted wholesale agent rates regardless of your account's consumer tier.
              </div>
            </div>
          </section>

          {/* Section 3: Safe Idempotency */}
          <section id="idempotency" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                3. Concurrency Protection
              </span>
              <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                Idempotency-Key Header
              </h2>
              <p className="text-xs text-[#526079] leading-relaxed">
                To prevent accidental double-billing in case of network timeouts, send an <code className="font-mono text-[#008fef]">Idempotency-Key</code> header with a unique UUID on all mutation endpoints (<code className="font-mono text-[#008fef]">/data/purchase</code> and <code className="font-mono text-[#008fef]">/airtime/purchase</code>). If a request is retried within 24 hours with the same key, MK DATA returns the identical cached response without re-debiting your wallet.
              </p>
            </div>
          </section>

          {/* Section 4: Balance Requery */}
          <section id="balance" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                    4. Account
                  </span>
                  <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                    Check Wallet Balance
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-mono text-xs font-bold">
                  GET /api/v1/balance
                </span>
              </div>

              {/* Code Samples */}
              <div className="rounded-xl overflow-hidden border border-[#1e293b]">
                <div className="px-4 py-2 bg-[#06133a] flex items-center justify-between text-xs text-[#9db7dc] border-b border-[#1e293b]">
                  <span className="font-mono">{activeLang === "curl" ? "cURL" : activeLang === "node" ? "Node.js (Fetch)" : "Python (Requests)"}</span>
                  <button
                    onClick={() =>
                      copyCode(
                        activeLang === "curl"
                          ? `curl -X GET "https://mkdatasub.com/api/v1/balance" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`
                          : activeLang === "node"
                          ? `const res = await fetch("https://mkdatasub.com/api/v1/balance", {\n  headers: { "Authorization": "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();\nconsole.log(data);`
                          : `import requests\n\nres = requests.get("https://mkdatasub.com/api/v1/balance", headers={\n    "Authorization": "Bearer YOUR_API_KEY"\n})\nprint(res.json())`,
                        "balance-code"
                      )
                    }
                    className="hover:text-white"
                  >
                    {copiedIndex === "balance-code" ? <Check className="h-4 w-4 text-[#00a040]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <pre className="p-4 bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
                  {activeLang === "curl" &&
                    `curl -X GET "https://mkdatasub.com/api/v1/balance" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}
                  {activeLang === "node" &&
                    `const res = await fetch("https://mkdatasub.com/api/v1/balance", {\n  headers: { "Authorization": "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();\nconsole.log(data);`}
                  {activeLang === "python" &&
                    `import requests\n\nres = requests.get("https://mkdatasub.com/api/v1/balance", headers={\n    "Authorization": "Bearer YOUR_API_KEY"\n})\nprint(res.json())`}
                </pre>
              </div>

              {/* Response */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#526079] uppercase">Response (200 OK)</span>
                <pre className="p-4 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] font-mono text-xs text-[#06133a] overflow-x-auto">
{`{
  "success": true,
  "balance": 24500.00,
  "currency": "NGN",
  "tier": "agent",
  "pricing": "wholesale"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 5: Data Plans */}
          <section id="data-plans" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                    5. Catalog
                  </span>
                  <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                    List Data Plans
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-mono text-xs font-bold">
                  GET /api/v1/data/plans
                </span>
              </div>

              <p className="text-xs text-[#526079]">
                Query parameter <code className="font-mono text-[#008fef]">?network=mtn|airtel|glo|9mobile</code> is optional. Returns all active data plans with wholesale agent pricing.
              </p>

              <pre className="p-4 rounded-xl bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
{`curl -X GET "https://mkdatasub.com/api/v1/data/plans?network=mtn" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </pre>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#526079] uppercase">Response (200 OK)</span>
                <pre className="p-4 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] font-mono text-xs text-[#06133a] overflow-x-auto">
{`{
  "success": true,
  "plans": [
    {
      "id": "cm7...",
      "network": "MTN",
      "name": "MTN SME 1GB",
      "type": "SME",
      "size": "1GB",
      "validity": "30 Days",
      "price": 285.00
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 6: Buy Mobile Data */}
          <section id="data-purchase" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                    6. Vending
                  </span>
                  <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                    Purchase Mobile Data
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#eff6ff] text-[#008fef] border border-[#bfdbfe] font-mono text-xs font-bold">
                  POST /api/v1/data/purchase
                </span>
              </div>

              {/* Request Schema Table */}
              <div className="border border-[#eaf2ff] rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[400px]">
                  <thead>
                    <tr className="bg-[#f8fbff] text-[10px] font-bold text-[#526079] uppercase border-b border-[#eaf2ff]">
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Required</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaf2ff]">
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#06133a]">plan_id</td>
                      <td className="py-2.5 px-4 text-[#526079]">string</td>
                      <td className="py-2.5 px-4 text-[#059669] font-bold">Yes</td>
                      <td className="py-2.5 px-4 text-[#526079]">The plan ID from catalog</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#06133a]">phone</td>
                      <td className="py-2.5 px-4 text-[#526079]">string</td>
                      <td className="py-2.5 px-4 text-[#059669] font-bold">Yes</td>
                      <td className="py-2.5 px-4 text-[#526079]">11-digit recipient phone (080...)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#06133a]">request_id</td>
                      <td className="py-2.5 px-4 text-[#526079]">string</td>
                      <td className="py-2.5 px-4 text-[#526079]">Optional</td>
                      <td className="py-2.5 px-4 text-[#526079]">Your client-side unique reference</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Code */}
              <pre className="p-4 rounded-xl bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
{`curl -X POST "https://mkdatasub.com/api/v1/data/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Idempotency-Key: uuid-1234-5678" \\
  -H "Content-Type: application/json" \\
  -d '{
    "plan_id": "cm7...",
    "phone": "08012345678",
    "request_id": "INV-99214"
  }'`}
              </pre>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#526079] uppercase">Response (200 OK)</span>
                <pre className="p-4 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] font-mono text-xs text-[#06133a] overflow-x-auto">
{`{
  "success": true,
  "status": "SUCCESS",
  "reference": "MKD-DATA-171800123456",
  "request_id": "INV-99214",
  "amount_charged": 285.00,
  "previous_balance": 10500.00,
  "new_balance": 10215.00,
  "phone": "08012345678",
  "plan": "MTN SME 1GB",
  "created_at": "2026-10-04T22:30:00.000Z"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 7: Buy Airtime */}
          <section id="airtime-purchase" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                    7. Vending
                  </span>
                  <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                    Purchase Airtime Top-Up
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#eff6ff] text-[#008fef] border border-[#bfdbfe] font-mono text-xs font-bold">
                  POST /api/v1/airtime/purchase
                </span>
              </div>

              <pre className="p-4 rounded-xl bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
{`curl -X POST "https://mkdatasub.com/api/v1/airtime/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Idempotency-Key: uuid-9988-7766" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": "mtn",
    "amount": 1000,
    "phone": "08012345678"
  }'`}
              </pre>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#526079] uppercase">Response (200 OK)</span>
                <pre className="p-4 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] font-mono text-xs text-[#06133a] overflow-x-auto">
{`{
  "success": true,
  "status": "SUCCESS",
  "reference": "MKD-AIR-171800998877",
  "amount_charged": 970.00,
  "discount_applied": 30.00,
  "new_balance": 9245.00,
  "phone": "08012345678",
  "network": "MTN"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 8: Transaction Status */}
          <section id="transaction-requery" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                    8. Requery
                  </span>
                  <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                    Requery Transaction Status
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-mono text-xs font-bold">
                  GET /api/v1/transactions/:reference
                </span>
              </div>

              <p className="text-xs text-[#526079]">
                Requery by MK DATA reference or your custom <code className="font-mono text-[#008fef]">request_id</code>.
              </p>

              <pre className="p-4 rounded-xl bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
{`curl -X GET "https://mkdatasub.com/api/v1/transactions/MKD-DATA-171800123456" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </pre>
            </div>
          </section>

          {/* Section 9: Webhooks & Signature Verification */}
          <section id="webhooks" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                9. Webhooks
              </span>
              <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                HMAC Signature Verification
              </h2>
              <p className="text-xs text-[#526079] leading-relaxed">
                Every webhook notification carries a signature header: <code className="font-mono text-[#008fef]">X-MK-Signature: t=1718000000,v1=abc123...</code>. Verify this signature to prevent spoofing:
              </p>

              <pre className="p-4 rounded-xl bg-[#0a1845] text-[#86e1fc] font-mono text-xs overflow-x-auto">
{`import crypto from "crypto";

function verifyWebhook(secret, signatureHeader, rawPayload) {
  const parts = signatureHeader.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.replace("t=", "");
  const signature = parts.find(p => p.startsWith("v1="))?.replace("v1=", "");

  const signedPayload = \`\${timestamp}.\${rawPayload}\`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`}
              </pre>
            </div>
          </section>

          {/* Section 10: Error Codes */}
          <section id="errors" className="scroll-mt-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                10. Error Codes
              </span>
              <h2 className="text-lg font-black text-[#06133a] tracking-tight">
                HTTP Status & Error Reference
              </h2>

              <div className="border border-[#eaf2ff] rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[400px]">
                  <thead>
                    <tr className="bg-[#f8fbff] text-[10px] font-bold text-[#526079] uppercase border-b border-[#eaf2ff]">
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaf2ff]">
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#dc2626]">400</td>
                      <td className="py-2.5 px-4 font-mono text-[#06133a]">BAD_REQUEST</td>
                      <td className="py-2.5 px-4 text-[#526079]">Invalid phone format or missing plan ID.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#dc2626]">401</td>
                      <td className="py-2.5 px-4 font-mono text-[#06133a]">UNAUTHORIZED</td>
                      <td className="py-2.5 px-4 text-[#526079]">Invalid or missing API key in Bearer header.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#dc2626]">402</td>
                      <td className="py-2.5 px-4 font-mono text-[#06133a]">INSUFFICIENT_FUNDS</td>
                      <td className="py-2.5 px-4 text-[#526079]">Wallet balance is lower than transaction cost.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#dc2626]">409</td>
                      <td className="py-2.5 px-4 font-mono text-[#06133a]">CONCURRENT_MUTATION</td>
                      <td className="py-2.5 px-4 text-[#526079]">Another transaction is locking this wallet simultaneously.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#dc2626]">429</td>
                      <td className="py-2.5 px-4 font-mono text-[#06133a]">RATE_LIMIT_EXCEEDED</td>
                      <td className="py-2.5 px-4 text-[#526079]">Exceeded 60 requests per minute limit.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
