import React from "react";
import Link from "next/link";
import { Terminal, KeyRound, Webhook, ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = {
  title: "MK DATA Developer API Documentation | REST & Webhooks",
  description: "Comprehensive REST API reference for automated Nigerian telecom data and airtime vending.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5faff] text-[#06133a] flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Standalone Top Developer Navigation Header */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 border-b border-[#d7e8ff] backdrop-blur-md px-4 sm:px-8 flex items-center justify-between w-full">
        {/* Brand & Docs Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#008fef] to-[#0055b3] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              MK
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-[#06133a]">MK DATA</span>
              <span className="text-[10px] font-bold text-[#008fef] uppercase tracking-wider">Developer Platform</span>
            </div>
          </Link>

          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-[#f0f7ff] border border-[#cfe2fb] text-[11px] font-bold text-[#008fef]">
            v1.0 REST API
          </span>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/developer/keys"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#008fef]" />
            API Keys
          </Link>

          <Link
            href="/dashboard/developer/webhooks"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-colors"
          >
            <Webhook className="h-3.5 w-3.5 text-[#008fef]" />
            Webhooks
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008fef] text-white text-xs font-bold hover:bg-[#0060d0] shadow-xs active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Portal Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-full">
        {children}
      </div>
    </div>
  );
}
