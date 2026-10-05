"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/components/dashboard/DashboardContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { FundingModal } from "@/components/dashboard/FundingModal";
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname === "/dashboard/login" || pathname?.startsWith("/dashboard/login/");

  // On auth pages (e.g. /dashboard/login), render strictly standalone without sidebar, header, or funding modal
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#f5faff] text-[#06133a]">
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5faff]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#008fef]" />
          <p className="text-xs font-semibold text-[#526079]">Loading your portal...</p>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/login";
      }
    }
  }, [loading, user, isAuthPage]);

  // If not authenticated and not on login page, render clean redirecting guard to prevent layout/balance flash
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5faff]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#008fef]" />
          <p className="text-xs font-semibold text-[#526079]">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5faff] text-[#06133a] flex overflow-x-hidden w-full max-w-full">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 overflow-x-hidden w-full max-w-full">
        <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Global Wallet Funding Modal */}
      <FundingModal />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
