"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Zap,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Copy,
  Check,
  Cpu,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

type CodeLang = "curl" | "node" | "python";

export function DeveloperCTA() {
  const [lang, setLang] = useState<CodeLang>("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST "https://mkdatasub.com/api/v1/data/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "plan_id": 82,
    "number": "08012345678",
    "tx_id": "MKD-TX-171800123456"
  }'`,
    node: `const res = await fetch("https://mkdatasub.com/api/v1/data/purchase", {
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
console.log(data.status); // "SUCCESS"`,
    python: `import requests

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
print(res.json()["status"])  # "SUCCESS"`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden bg-[#06102b] text-white py-20 lg:py-28 border-y border-slate-800">
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-1/4 -mt-24 h-96 w-96 rounded-full bg-[#008fef]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-24 h-96 w-96 rounded-full bg-[#00a040]/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-bold text-sky-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>BUILT FOR DEVELOPERS & VTU AGGREGATORS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Automate Telecom Vending with Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008fef] to-[#38bdf8]">High-Speed REST API</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Integrate Nigerian mobile data, airtime top-ups, and transaction requery into your fintech app, Telegram bot, or VTU platform in minutes. Every API call is automatically discounted with wholesale agent rates.
            </p>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/20 text-[#008fef] shrink-0 mt-0.5">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sub-Second Vending</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Direct telecom routing with near-instant balance delivery.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Idempotency Guard</h4>
                  <p className="text-xs text-slate-400 mt-0.5">24h replay deduplication prevents double billing on timeouts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-400 shrink-0 mt-0.5">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Wholesale Agent Price</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Discounted wholesale margin applied to every API token.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-400/20 text-purple-400 shrink-0 mt-0.5">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Standard Numeric IDs</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Simple integer network mapping (1=MTN, 2=GLO, 3=AIRTEL, 4=9MOBILE).</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl bg-[#008fef] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(0,143,239,0.35)] transition-all duration-200 hover:bg-[#0070c0] hover:scale-102 active:scale-98"
              >
                <Code2 className="h-4 w-4" />
                <span>Explore API Documentation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard/developer/keys"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-200 transition-all duration-200 hover:bg-slate-700 hover:text-white"
              >
                <KeyRound className="h-4 w-4 text-[#008fef]" />
                <span>Get API Keys</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Code Terminal Card */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl overflow-hidden text-left">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 pl-2">POST /api/v1/data/purchase</span>
                </div>

                {/* Language Switcher Tabs */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setLang("curl")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      lang === "curl" ? "bg-[#008fef] text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setLang("node")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      lang === "node" ? "bg-[#008fef] text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setLang("python")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      lang === "python" ? "bg-[#008fef] text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              {/* Code Panel */}
              <div className="relative p-4 sm:p-5 font-mono text-xs text-[#f8fafc] bg-[#090d16] overflow-x-auto">
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy snippet"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <pre className="pr-10 leading-relaxed whitespace-pre font-mono bg-transparent text-[#f8fafc]">
                  {snippets[lang]}
                </pre>
              </div>

              {/* Live Response Card Preview */}
              <div className="p-3 bg-[#0d1322] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    200 OK
                  </span>
                  <span>• status: "SUCCESS"</span>
                  <span>• time: 480ms</span>
                </div>
                <Link
                  href="/docs"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-sans font-semibold text-xs"
                >
                  <span>Full API Specs</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
