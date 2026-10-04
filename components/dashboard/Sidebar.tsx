"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "./DashboardContext";
import {
  LayoutDashboard,
  ReceiptText,
  Wifi,
  PhoneCall,
  Zap,
  Tv,
  GraduationCap,
  KeyRound,
  Webhook,
  BookOpen,
  LogOut,
  Wallet,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, openFunding, handleLogout } = useDashboard();

  const navGroups = [
    {
      group: "Core",
      items: [
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Transactions", href: "/dashboard/history", icon: ReceiptText },
      ],
    },
    {
      group: "Vending Services",
      items: [
        { label: "Buy Data", href: "/dashboard/data", icon: Wifi },
        { label: "Buy Airtime", href: "/dashboard/airtime", icon: PhoneCall },
        { label: "Electricity", href: "/dashboard/electricity", icon: Zap },
        { label: "Cable TV", href: "/dashboard/cable", icon: Tv },
        { label: "Exam Pins", href: "/dashboard/exams", icon: GraduationCap },
      ],
    },
    {
      group: "Developer Hub",
      items: [
        { label: "API Keys", href: "/dashboard/developer/keys", icon: KeyRound },
        { label: "Webhooks", href: "/dashboard/developer/webhooks", icon: Webhook },
        { label: "API Documentation", href: "/docs", icon: BookOpen },
      ],
    },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-[#06133a]/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#d7e8ff] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-[#eaf2ff] px-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMobile}>
            <img
              src="/logo.jpeg"
              alt="MK DATA"
              className="h-8 w-8 rounded-xl object-cover shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#07143d] tracking-tight">MK DATA</span>
              <span className="text-[9px] font-bold text-[#008fef] tracking-widest uppercase">
                Portal
              </span>
            </div>
          </Link>
          <button
            onClick={closeMobile}
            className="p-1 rounded-lg text-[#526079] hover:bg-[#f0f7ff] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Quick Balance & Fund Card */}
          <div className="p-3.5 rounded-xl bg-[linear-gradient(135deg,#f5faff_0%,#eaf4ff_100%)] border border-[#d7e8ff] shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#526079] uppercase tracking-wider flex items-center gap-1">
                <Wallet className="h-3 w-3 text-[#008fef]" />
                Balance
              </span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  user?.tier === "agent"
                    ? "bg-[#008fef] text-white"
                    : "bg-[#e2edff] text-[#0060d0]"
                }`}
              >
                {user?.tier || "User"} Tier
              </span>
            </div>

            <div className="text-lg font-black text-[#06133a] tracking-tight">
              ₦{Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <button
              onClick={() => {
                closeMobile();
                openFunding();
              }}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Fund Wallet
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.group}>
                <p className="px-2.5 mb-1.5 text-[10px] font-black text-[#8aa0be] uppercase tracking-wider">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
                          isActive
                            ? "bg-[#eaf4ff] text-[#008fef] shadow-sm"
                            : "text-[#526079] hover:bg-[#f8fbff] hover:text-[#06133a]"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-[#008fef]" : "text-[#7fa5d8]"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-[#eaf2ff] bg-[#f8fbff]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 rounded-lg bg-[#008fef] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {(user?.fullName || "MK").slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#06133a] truncate">{user?.fullName || "User"}</p>
                <p className="text-[10px] text-[#526079] truncate">{user?.phone}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-1.5 px-3 rounded-lg border border-[#cfe2fb] bg-white text-xs font-bold text-[#e53e3e] hover:bg-[#fff5f5] transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
