"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Search,
  ExternalLink,
  Hash,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type CodeLang = "curl" | "node" | "python";

interface OutlineItem {
  id: string;
  title: string;
  method?: "GET" | "POST" | null;
  badge?: string;
}

interface OutlineCategory {
  category: string;
  items: OutlineItem[];
}

const OUTLINE_SECTIONS: OutlineCategory[] = [
  {
    category: "GETTING STARTED",
    items: [
      { id: "overview", title: "Overview & Base URL" },
      { id: "auth", title: "Authentication (Bearer)" },
      { id: "idempotency", title: "Idempotency & Safety" },
    ],
  },
  {
    category: "ACCOUNT & WALLET",
    items: [
      { id: "balance", title: "Wallet Balance", method: "GET" },
    ],
  },
  {
    category: "MOBILE DATA VENDING",
    items: [
      { id: "data-plans", title: "List Data Plans", method: "GET" },
      { id: "data-purchase", title: "Purchase Mobile Data", method: "POST" },
    ],
  },
  {
    category: "AIRTIME VENDING",
    items: [
      { id: "airtime-purchase", title: "Purchase Airtime Top-Up", method: "POST" },
    ],
  },
  {
    category: "REQUERY & WEBHOOKS",
    items: [
      { id: "transaction-requery", title: "Transaction Status", method: "GET" },
      { id: "webhooks", title: "Webhooks & HMAC Verification" },
    ],
  },
  {
    category: "SYSTEM REFERENCE",
    items: [
      { id: "numeric-networks", title: "Numeric Network Codes" },
      { id: "errors", title: "Error Codes & Statuses" },
    ],
  },
];

export default function DocumentationPage() {
  const [activeLang, setActiveLang] = useState<CodeLang>("curl");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Scrollspy to automatically highlight the current active section in the sticky sidebar
  useEffect(() => {
    const sectionIds = OUTLINE_SECTIONS.flatMap((g) => g.items.map((i) => i.id));
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter outline based on live search
  const filteredOutline = useMemo(() => {
    if (!searchQuery.trim()) return OUTLINE_SECTIONS;
    const q = searchQuery.toLowerCase();
    return OUTLINE_SECTIONS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.method && item.method.toLowerCase().includes(q))
      ),
    })).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-white text-slate-800">
      {/* =========================================================================
          LEFT STICKY GITBOOK SIDEBAR
          Pinned at top-16, fixed viewport height, independent smooth scroll.
         ========================================================================= */}
      <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto border-r border-slate-200/90 bg-[#fafbfc] flex flex-col justify-between z-30">
        <div className="p-4 space-y-4">
          {/* Documentation Book Title */}
          <div className="flex items-center gap-2 text-slate-900 pb-1">
            <BookOpen className="h-4 w-4 text-[#008fef]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              API Reference
            </span>
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#008fef] focus:ring-1 focus:ring-[#008fef] transition-all"
            />
          </div>

          {/* Hierarchical GitBook Outline */}
          <nav className="space-y-5 text-xs">
            {filteredOutline.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.category}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollTo(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors ${
                          isActive
                            ? "bg-[#008fef]/10 text-[#0060d0] font-semibold border-l-2 border-[#008fef]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                      >
                        <span className="truncate pr-2">{item.title}</span>
                        {item.method && (
                          <span
                            className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              item.method === "GET"
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-sky-700 bg-sky-50 border-sky-200"
                            }`}
                          >
                            {item.method}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sticky Sidebar Bottom Controls */}
        <div className="p-4 border-t border-slate-200 bg-white/90 backdrop-blur-xs space-y-3 sticky bottom-0">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Code Language
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveLang("curl")}
                className={`py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === "curl" ? "bg-white text-[#008fef] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveLang("node")}
                className={`py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === "node" ? "bg-white text-[#008fef] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveLang("python")}
                className={`py-1 rounded text-[11px] font-bold transition-all ${
                  activeLang === "python" ? "bg-white text-[#008fef] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Python
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <Link
              href="/dashboard/developer/plans"
              className="hover:text-[#008fef] flex items-center gap-1 font-medium transition-colors"
            >
              <span>View Plan IDs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/dashboard/developer/keys"
              className="hover:text-[#008fef] flex items-center gap-1 font-medium transition-colors"
            >
              <KeyRound className="h-3 w-3" />
              <span>Keys</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN DOCUMENTATION BOOK CONTENT
         ========================================================================= */}
      <main className="flex-1 min-w-0 py-8 px-5 sm:px-10 lg:px-14 max-w-4xl xl:max-w-5xl space-y-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Documentation</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 font-medium">REST API v1.0</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-900 font-semibold">{activeSection}</span>
        </div>

        {/* -----------------------------------------------------------------------
            SECTION 1: OVERVIEW & BASE URL
           ----------------------------------------------------------------------- */}
        <section id="overview" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              1. Getting Started
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              MK DATA Developer Platform API
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome to the official MK DATA API documentation. Our REST service empowers fintech platforms, mobile apps, and VTU aggregators to vend automated Nigerian telecom data bundles, purchase airtime top-ups, and verify real-time status with sub-second execution speeds and wholesale agent rates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="text-slate-500 font-sans font-semibold">Production Base URL:</span>
              <button
                onClick={() => copyCode("https://mkdatasub.com/api/v1", "base-url")}
                className="flex items-center gap-1 text-[#008fef] hover:underline font-bold"
              >
                {copiedIndex === "base-url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>Copy URL</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs font-bold text-[#0060d0] break-all select-all">
              https://mkdatasub.com/api/v1
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 2: AUTHENTICATION
           ----------------------------------------------------------------------- */}
        <section id="auth" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              2. Authentication
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              API Keys & Authorization Header
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            All API requests must include your live production key in the HTTP <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-900 font-semibold">Authorization</code> header using the standard Bearer scheme.
          </p>

          <div className="p-4 rounded-xl bg-[#090d16] text-[#e2e8f0] font-mono text-xs flex items-center justify-between gap-4 border border-slate-800 shadow-sm">
            <span className="break-all text-sky-300">
              Authorization: Bearer mk_live_a1b2c3d4e5f60718293a4b5c...
            </span>
            <button
              onClick={() => copyCode("Authorization: Bearer YOUR_API_KEY", "auth-header")}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 transition-colors"
            >
              {copiedIndex === "auth-header" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Formal Callout Note */}
          <div className="border-l-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-r-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Guaranteed Wholesale Agent Pricing</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Every request authenticated with your API key automatically receives the discounted wholesale Agent Price from our database catalog, regardless of your consumer portal level.
            </p>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 3: CONCURRENCY & IDEMPOTENCY
           ----------------------------------------------------------------------- */}
        <section id="idempotency" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              3. Concurrency Protection
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Idempotency-Key & Safe Retries
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            To prevent double-billing caused by network timeouts or dropped sockets, you can pass an <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-900 font-semibold">Idempotency-Key</code> header or provide a custom <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-900 font-semibold">tx_id</code> in your payload.
          </p>

          <div className="border-l-4 border-[#008fef] bg-sky-50/50 p-4 rounded-r-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-[#008fef]" />
              <span>24-Hour Idempotency Cache</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              If a request is retried with the same transaction key within 24 hours, MK DATA returns the identical cached response with header <code className="font-mono text-[#008fef]">X-Idempotent-Replay: true</code> without debiting your wallet balance a second time.
            </p>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 4: WALLET BALANCE REQUERY
           ----------------------------------------------------------------------- */}
        <section id="balance" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              4. Wallet & Account
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Check Wallet Balance
            </h2>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
              GET
            </span>
            <span className="font-bold">https://mkdatasub.com/api/v1/balance</span>
          </div>

          <p className="text-sm text-slate-600">
            Returns your current live wallet balance and wholesale developer account tier.
          </p>

          {/* Code Tabs */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-sm">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
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
                {copiedIndex === "balance-code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="p-4 text-sky-200 font-mono text-xs overflow-x-auto">
              {activeLang === "curl" &&
                `curl -X GET "https://mkdatasub.com/api/v1/balance" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}
              {activeLang === "node" &&
                `const res = await fetch("https://mkdatasub.com/api/v1/balance", {\n  headers: { "Authorization": "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();\nconsole.log(data);`}
              {activeLang === "python" &&
                `import requests\n\nres = requests.get("https://mkdatasub.com/api/v1/balance", headers={\n    "Authorization": "Bearer YOUR_API_KEY"\n})\nprint(res.json())`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Response (200 OK)</span>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
{`{
  "success": true,
  "balance": 24500.00,
  "currency": "NGN",
  "tier": "agent",
  "pricing": "wholesale"
}`}
            </pre>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 5: DATA PLANS CATALOG
           ----------------------------------------------------------------------- */}
        <section id="data-plans" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              5. Catalog
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              List Active Data Plans
            </h2>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
              GET
            </span>
            <span className="font-bold">https://mkdatasub.com/api/v1/data/plans</span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Retrieves all active data plans with their numeric <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-900 font-semibold">plan_id</code>, numeric network code, and real-time wholesale agent prices. Optional query parameter <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-[#008fef] font-semibold">?network=1|2|3|4</code> filters the catalog.
          </p>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-sm">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
              <span className="font-mono">{activeLang === "curl" ? "cURL" : activeLang === "node" ? "Node.js (Fetch)" : "Python (Requests)"}</span>
              <button
                onClick={() =>
                  copyCode(
                    activeLang === "curl"
                      ? `curl -X GET "https://mkdatasub.com/api/v1/data/plans?network=1" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`
                      : activeLang === "node"
                      ? `const res = await fetch("https://mkdatasub.com/api/v1/data/plans?network=1", {\n  headers: { "Authorization": "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();\nconsole.log(data);`
                      : `import requests\n\nres = requests.get("https://mkdatasub.com/api/v1/data/plans?network=1", headers={\n    "Authorization": "Bearer YOUR_API_KEY"\n})\nprint(res.json())`,
                    "catalog-code"
                  )
                }
                className="hover:text-white"
              >
                {copiedIndex === "catalog-code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="p-4 text-sky-200 font-mono text-xs overflow-x-auto">
              {activeLang === "curl" &&
                `curl -X GET "https://mkdatasub.com/api/v1/data/plans?network=1" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}
              {activeLang === "node" &&
                `const res = await fetch("https://mkdatasub.com/api/v1/data/plans?network=1", {\n  headers: { "Authorization": "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();\nconsole.log(data);`}
              {activeLang === "python" &&
                `import requests\n\nres = requests.get("https://mkdatasub.com/api/v1/data/plans?network=1", headers={\n    "Authorization": "Bearer YOUR_API_KEY"\n})\nprint(res.json())`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Response (200 OK)</span>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
{`{
  "success": true,
  "count": 48,
  "data": [
    {
      "plan_id": 82,
      "network": 1,
      "network_name": "MTN",
      "name": "MTN SME 1GB",
      "type": "SME",
      "size": "1GB",
      "validity": "30 Days",
      "price": 285.00
    },
    {
      "plan_id": 83,
      "network": 1,
      "network_name": "MTN",
      "name": "MTN SME 2GB",
      "type": "SME",
      "size": "2GB",
      "validity": "30 Days",
      "price": 570.00
    }
  ]
}`}
            </pre>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 6: PURCHASE MOBILE DATA
           ----------------------------------------------------------------------- */}
        <section id="data-purchase" className="scroll-mt-24 space-y-5">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              6. Vending
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase Mobile Data
            </h2>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-sky-100 text-sky-800 border border-sky-200">
              POST
            </span>
            <span className="font-bold">https://mkdatasub.com/api/v1/data/purchase</span>
          </div>

          {/* Mandatory Numeric Network Callout */}
          <div className="border-l-4 border-amber-500 bg-amber-50/50 p-4 rounded-r-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>Mandatory: Numeric Network Codes</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              The <code className="font-mono font-bold text-amber-950">network</code> field must always be an integer number, not a text string:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">MTN</span>
                <span className="font-black text-[#008fef] bg-sky-50 px-2 py-0.5 rounded">1</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">GLO</span>
                <span className="font-black text-[#008fef] bg-sky-50 px-2 py-0.5 rounded">2</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">AIRTEL</span>
                <span className="font-black text-[#008fef] bg-sky-50 px-2 py-0.5 rounded">3</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">9MOBILE</span>
                <span className="font-black text-[#008fef] bg-sky-50 px-2 py-0.5 rounded">4</span>
              </div>
            </div>
          </div>

          {/* Formal Parameter Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Request Payload Body (JSON)
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">Field</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Requirement</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">network</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">integer</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                        Required
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      Numeric ID: <strong>1</strong> (MTN), <strong>2</strong> (GLO), <strong>3</strong> (AIRTEL), <strong>4</strong> (9MOBILE).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">plan_id</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">integer</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                        Required
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      Numeric plan ID from the database catalog (e.g. <strong>82</strong>, <strong>5</strong>, <strong>174</strong>).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">number</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">string</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                        Required
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      11-digit recipient phone number (e.g. <code>"08012345678"</code>).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">tx_id</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">string</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
                        Recommended
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      Your unique merchant reference for idempotency tracking and status query.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Code Snippets */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-sm">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
              <span className="font-mono">{activeLang === "curl" ? "cURL" : activeLang === "node" ? "Node.js (Fetch)" : "Python (Requests)"}</span>
              <button
                onClick={() =>
                  copyCode(
                    activeLang === "curl"
                      ? `curl -X POST "https://mkdatasub.com/api/v1/data/purchase" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "network": 1,\n    "plan_id": 82,\n    "number": "08012345678",\n    "tx_id": "MKD-TX-171800123456"\n  }'`
                      : activeLang === "node"
                      ? `const res = await fetch("https://mkdatasub.com/api/v1/data/purchase", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    network: 1, // 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE\n    plan_id: 82,\n    number: "08012345678",\n    tx_id: "MKD-TX-171800123456"\n  })\n});\nconst data = await res.json();\nconsole.log(data);`
                      : `import requests\n\npayload = {\n    "network": 1,  # 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE\n    "plan_id": 82,\n    "number": "08012345678",\n    "tx_id": "MKD-TX-171800123456"\n}\n\nres = requests.post(\n    "https://mkdatasub.com/api/v1/data/purchase",\n    headers={"Authorization": "Bearer YOUR_API_KEY"},\n    json=payload\n)\nprint(res.json())`,
                    "data-code"
                  )
                }
                className="hover:text-white"
              >
                {copiedIndex === "data-code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="p-4 text-sky-200 font-mono text-xs overflow-x-auto">
              {activeLang === "curl" &&
`curl -X POST "https://mkdatasub.com/api/v1/data/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "plan_id": 82,
    "number": "08012345678",
    "tx_id": "MKD-TX-171800123456"
  }'`}
              {activeLang === "node" &&
`const res = await fetch("https://mkdatasub.com/api/v1/data/purchase", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    network: 1, // 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE
    plan_id: 82,
    number: "08012345678",
    tx_id: "MKD-TX-171800123456"
  })
});
const data = await res.json();
console.log(data);`}
              {activeLang === "python" &&
`import requests

payload = {
    "network": 1,  # 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE
    "plan_id": 82,
    "number": "08012345678",
    "tx_id": "MKD-TX-171800123456"
}

res = requests.post(
    "https://mkdatasub.com/api/v1/data/purchase",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json=payload
)
print(res.json())`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Response (200 OK)</span>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
{`{
  "success": true,
  "status": "SUCCESS",
  "reference": "MKD-DATA-171800123456",
  "requestId": "MKD-TX-171800123456",
  "amount": 285.00,
  "balance": 10215.00,
  "phone": "08012345678",
  "network": 1,
  "network_name": "MTN",
  "plan": "MTN SME 1GB",
  "message": "Data vending successful."
}`}
            </pre>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 7: PURCHASE AIRTIME
           ----------------------------------------------------------------------- */}
        <section id="airtime-purchase" className="scroll-mt-24 space-y-5">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              7. Vending
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase Airtime Top-Up
            </h2>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-sky-100 text-sky-800 border border-sky-200">
              POST
            </span>
            <span className="font-bold">https://mkdatasub.com/api/v1/airtime/purchase</span>
          </div>

          <p className="text-sm text-slate-600">
            Instantly credit airtime to any Nigerian phone number. Accepts numeric network: <code className="font-mono text-slate-900 font-bold">1</code> (MTN), <code className="font-mono text-slate-900 font-bold">2</code> (GLO), <code className="font-mono text-slate-900 font-bold">3</code> (AIRTEL), or <code className="font-mono text-slate-900 font-bold">4</code> (9MOBILE).
          </p>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-sm">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
              <span className="font-mono">{activeLang === "curl" ? "cURL" : activeLang === "node" ? "Node.js (Fetch)" : "Python (Requests)"}</span>
              <button
                onClick={() =>
                  copyCode(
                    activeLang === "curl"
                      ? `curl -X POST "https://mkdatasub.com/api/v1/airtime/purchase" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "network": 1,\n    "amount": 1000,\n    "number": "08012345678",\n    "tx_id": "MKD-AIR-171800998877"\n  }'`
                      : activeLang === "node"
                      ? `const res = await fetch("https://mkdatasub.com/api/v1/airtime/purchase", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    network: 1, // 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE\n    amount: 1000,\n    number: "08012345678",\n    tx_id: "MKD-AIR-171800998877"\n  })\n});\nconst data = await res.json();\nconsole.log(data);`
                      : `import requests\n\npayload = {\n    "network": 1,  # 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE\n    "amount": 1000,\n    "number": "08012345678",\n    "tx_id": "MKD-AIR-171800998877"\n}\n\nres = requests.post(\n    "https://mkdatasub.com/api/v1/airtime/purchase",\n    headers={"Authorization": "Bearer YOUR_API_KEY"},\n    json=payload\n)\nprint(res.json())`,
                    "airtime-code"
                  )
                }
                className="hover:text-white"
              >
                {copiedIndex === "airtime-code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="p-4 text-sky-200 font-mono text-xs overflow-x-auto">
              {activeLang === "curl" &&
`curl -X POST "https://mkdatasub.com/api/v1/airtime/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "amount": 1000,
    "number": "08012345678",
    "tx_id": "MKD-AIR-171800998877"
  }'`}
              {activeLang === "node" &&
`const res = await fetch("https://mkdatasub.com/api/v1/airtime/purchase", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    network: 1, // 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE
    amount: 1000,
    number: "08012345678",
    tx_id: "MKD-AIR-171800998877"
  })
});
const data = await res.json();
console.log(data);`}
              {activeLang === "python" &&
`import requests

payload = {
    "network": 1,  # 1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE
    "amount": 1000,
    "number": "08012345678",
    "tx_id": "MKD-AIR-171800998877"
}

res = requests.post(
    "https://mkdatasub.com/api/v1/airtime/purchase",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json=payload
)
print(res.json())`}
            </pre>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Response (200 OK)</span>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
{`{
  "success": true,
  "status": "SUCCESS",
  "reference": "MKD-AIR-171800998877",
  "amount_charged": 970.00,
  "discount_applied": 30.00,
  "new_balance": 9245.00,
  "phone": "08012345678",
  "network": 1,
  "network_name": "MTN"
}`}
            </pre>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 8: TRANSACTION REQUERY
           ----------------------------------------------------------------------- */}
        <section id="transaction-requery" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              8. Requery
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Requery Transaction Status
            </h2>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
              GET
            </span>
            <span className="font-bold">https://mkdatasub.com/api/v1/transactions/:reference</span>
          </div>

          <p className="text-sm text-slate-600">
            Query the final state of any transaction by passing your MK DATA reference or client-side <code className="font-mono text-slate-900 font-bold">request_id</code>.
          </p>

          <pre className="p-4 rounded-xl bg-[#090d16] text-sky-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`curl -X GET "https://mkdatasub.com/api/v1/transactions/MKD-DATA-171800123456" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          </pre>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 9: WEBHOOKS & HMAC
           ----------------------------------------------------------------------- */}
        <section id="webhooks" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              9. Webhooks
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              HMAC Signature Verification
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Every webhook notification sent to your configured endpoint includes a signature header: <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-900">X-MK-Signature: t=1718000000,v1=abc123...</code>. Verify this signature to ensure payloads are authentic and unhampered:
          </p>

          <pre className="p-4 rounded-xl bg-[#090d16] text-sky-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import crypto from "crypto";

export function verifyWebhook(secret: string, signatureHeader: string, rawBody: string): boolean {
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.replace("t=", "");
  const signature = parts.find((p) => p.startsWith("v1="))?.replace("v1=", "");

  if (!timestamp || !signature) return false;

  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`}
          </pre>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 10: NUMERIC NETWORK CODES REFERENCE
           ----------------------------------------------------------------------- */}
        <section id="numeric-networks" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              10. Reference
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Numeric Network Codes Reference Table
            </h2>
          </div>

          <p className="text-sm text-slate-600">
            All API mutation payloads require the network to be specified as an integer code. Refer to this canonical table:
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs min-w-[450px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Network Name</th>
                  <th className="py-2.5 px-4">Numeric ID (Integer)</th>
                  <th className="py-2.5 px-4">Supported Vending Types</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">MTN Nigeria</td>
                  <td className="py-2.5 px-4 font-bold text-[#008fef] text-sm">1</td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">SME, Corporate Gifting, Gifting, Airtime</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-bold font-sans">Operational</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">Globacom (GLO)</td>
                  <td className="py-2.5 px-4 font-bold text-[#008fef] text-sm">2</td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">Corporate Gifting, Airtime</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-bold font-sans">Operational</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">Airtel Nigeria</td>
                  <td className="py-2.5 px-4 font-bold text-[#008fef] text-sm">3</td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">Corporate Gifting, Airtime</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-bold font-sans">Operational</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 font-sans">9mobile Nigeria</td>
                  <td className="py-2.5 px-4 font-bold text-[#008fef] text-sm">4</td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">Corporate Gifting, Airtime</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-bold font-sans">Operational</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 11: ERROR CODES & HTTP STATUSES
           ----------------------------------------------------------------------- */}
        <section id="errors" className="scroll-mt-24 space-y-4">
          <div className="space-y-2 border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
              11. Errors
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              HTTP Status & Error Reference
            </h2>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs min-w-[450px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Error Code</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-rose-600">400</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">BAD_REQUEST</td>
                  <td className="py-2.5 px-4 text-slate-600">Validation failure (e.g. invalid phone number format or missing plan ID).</td>
                  <td className="py-2.5 px-4 text-slate-500">Check payload structure and phone regex.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-rose-600">401</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">UNAUTHORIZED</td>
                  <td className="py-2.5 px-4 text-slate-600">Missing or revoked API key in Authorization header.</td>
                  <td className="py-2.5 px-4 text-slate-500">Regenerate live key in Developer Keys tab.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-rose-600">402</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">INSUFFICIENT_FUNDS</td>
                  <td className="py-2.5 px-4 text-slate-600">Account balance is lower than wholesale purchase cost.</td>
                  <td className="py-2.5 px-4 text-slate-500">Fund developer wallet via virtual account.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-rose-600">409</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">CONCURRENT_MUTATION</td>
                  <td className="py-2.5 px-4 text-slate-600">Another purchase transaction is currently locking this wallet.</td>
                  <td className="py-2.5 px-4 text-slate-500">Retry request with exponential backoff.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-rose-600">429</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">RATE_LIMIT_EXCEEDED</td>
                  <td className="py-2.5 px-4 text-slate-600">Exceeded standard limit of 60 requests/minute.</td>
                  <td className="py-2.5 px-4 text-slate-500">Throttle batch throughput.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Documentation Footer Navigation */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Need integration support? Contact our technical engineering team at <a href="mailto:support@mkdatasub.com" className="text-[#008fef] font-semibold hover:underline">support@mkdatasub.com</a>.
          </div>
          <Link
            href="/dashboard/developer/plans"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            <span>Browse Live Plan IDs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
