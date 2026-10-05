import React from "react";
import Link from "next/link";
import { Terminal, KeyRound, Webhook, ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = {
  title: "MK DATA Developer API Documentation | REST & Webhooks",
  description: "Comprehensive REST API reference for automated Nigerian telecom data and airtime vending.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col w-full selection:bg-[#008fef]/15 selection:text-[#0060d0]">
      {/* Standalone Top Developer Navigation Header */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 border-b border-slate-200 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between w-full">
        {/* Brand & Docs Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#008fef] to-[#0055b3] flex items-center justify-center text-white font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
              MK
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">MK DATA</span>
              <span className="text-xs font-semibold text-slate-500">Docs</span>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            v1.0 REST
          </span>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/developer/keys"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#008fef]" />
            API Keys
          </Link>

          <Link
            href="/dashboard/developer/webhooks"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Webhook className="h-3.5 w-3.5 text-[#008fef]" />
            Webhooks
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#008fef] text-white text-xs font-semibold hover:bg-[#0070c0] shadow-xs active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
