"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useDashboard } from "./DashboardContext";
import { Menu, Plus, RefreshCw, Wallet, ShieldCheck } from "lucide-react";

interface HeaderProps {
  onToggleMobile: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/data": "Buy Mobile Data",
  "/dashboard/airtime": "Buy Airtime",
  "/dashboard/electricity": "Electricity Bills",
  "/dashboard/cable": "Cable TV Subscriptions",
  "/dashboard/exams": "Exam Pins",
  "/dashboard/history": "Transaction History",
  "/dashboard/developer/keys": "API Keys",
  "/dashboard/developer/plans": "Plan IDs",
  "/dashboard/plans": "Plan IDs",
  "/dashboard/developer/webhooks": "Developer Webhooks",
  "/dashboard/docs": "Developer Documentation",
};

export function Header({ onToggleMobile }: HeaderProps) {
  const pathname = usePathname();
  const { user, openFunding, refreshUser } = useDashboard();
  const pageTitle = ROUTE_NAMES[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 border-b border-[#d7e8ff] backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="p-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] lg:hidden hover:bg-[#eaf4ff]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-[#8aa0be]">
            <span>Portal</span>
            <span>/</span>
            <span className="font-semibold text-[#008fef]">{pageTitle}</span>
          </div>
          <h1 className="text-base font-black text-[#06133a] hidden sm:block tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Balance Pill & Fund Wallet CTA */}
      <div className="flex items-center gap-3">
        {/* Live Balance Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#d7e8ff] bg-[#f5faff] shadow-xs">
          <Wallet className="h-4 w-4 text-[#008fef]" />
          <span className="text-xs font-bold text-[#06133a]">
            ₦{Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <button
            onClick={refreshUser}
            title="Refresh balance"
            className="p-1 rounded-md text-[#8aa0be] hover:text-[#008fef] hover:bg-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        {/* Quick Fund Button */}
        <button
          onClick={openFunding}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Fund Wallet</span>
        </button>
      </div>
    </header>
  );
}
