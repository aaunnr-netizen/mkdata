"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface DashboardUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: "USER" | "AGENT" | "ADMIN";
  tier: "user" | "agent";
  balance: number; // in Naira or Kobo (normalized)
  apiAccessStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
}

export interface ReservedAccount {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  accountName?: string;
}

interface DashboardContextType {
  user: DashboardUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isFundingOpen: boolean;
  openFunding: () => void;
  closeFunding: () => void;
  reservedAccount: ReservedAccount | null;
  loadingAccount: boolean;
  handleLogout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFundingOpen, setIsFundingOpen] = useState(false);
  const [reservedAccount, setReservedAccount] = useState<ReservedAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        setUser(null);
        router.replace("/dashboard/login");
        return;
      }

      const userData = data.data;
      // In DB, balance is often stored in Kobo or Naira. Normalize to Naira for UI display.
      const rawBalance = typeof userData.balance === "number" ? userData.balance : 0;
      const normalizedBalance = rawBalance > 10000000 ? rawBalance / 100 : rawBalance;

      setUser({
        id: userData.id,
        fullName: userData.fullName || "Valued User",
        phone: userData.phone,
        email: userData.email,
        role: userData.role || "USER",
        tier: userData.tier || "user",
        balance: normalizedBalance,
        apiAccessStatus: userData.apiAccessStatus || "NONE",
      });
    } catch {
      setUser(null);
      router.replace("/dashboard/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchReservedAccount = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const res = await fetch("/api/payments/reserved-account", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setReservedAccount({
          accountNumber: data.data.accountNumber,
          bankName: data.data.bankName,
          bankCode: data.data.bankCode,
          accountName: user?.fullName || "MK DATA Customer",
        });
      }
    } catch {
      // Fallback or retry silently
    } finally {
      setLoadingAccount(false);
    }
  }, [user?.fullName]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user && isFundingOpen && !reservedAccount) {
      fetchReservedAccount();
    }
  }, [user, isFundingOpen, reservedAccount, fetchReservedAccount]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    toast.success("Logged out successfully.");
    router.replace("/dashboard/login");
  };

  const openFunding = () => setIsFundingOpen(true);
  const closeFunding = () => setIsFundingOpen(false);

  return (
    <DashboardContext.Provider
      value={{
        user,
        loading,
        refreshUser: fetchUser,
        isFundingOpen,
        openFunding,
        closeFunding,
        reservedAccount,
        loadingAccount,
        handleLogout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
