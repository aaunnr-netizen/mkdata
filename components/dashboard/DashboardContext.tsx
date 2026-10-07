"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  fetchReservedAccount: () => Promise<void>;
  generateAccount: (bank?: string) => Promise<boolean>;
  handleLogout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFundingOpen, setIsFundingOpen] = useState(false);
  const [reservedAccount, setReservedAccount] = useState<ReservedAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        setUser(null);
        return;
      }

      const userData = data.data;
      // In DB, user balance is strictly stored in KOBO (1 NGN = 100 KOBO). Normalize to Naira for UI display.
      const rawBalance = typeof userData.balance === "number" ? userData.balance : 0;
      const normalizedBalance = rawBalance / 100;

      setUser({
        id: userData.id,
        fullName: userData.fullName || "",
        phone: userData.phone,
        email: userData.email,
        role: userData.role || "USER",
        tier: userData.tier || "user",
        balance: normalizedBalance,
        apiAccessStatus: userData.apiAccessStatus || "NONE",
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservedAccount = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const res = await fetch("/api/payments/reserved-account", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && data.data?.accountNumber) {
        setReservedAccount({
          accountNumber: data.data.accountNumber,
          bankName: data.data.bankName,
          bankCode: data.data.bankCode,
          accountName: data.data.accountName || user?.fullName || "MK DATA Customer",
        });
        return;
      }

      // Fallback to /api/payments/accounts
      const fallbackRes = await fetch("/api/payments/accounts", { cache: "no-store" });
      const fallbackData = await fallbackRes.json();
      if (fallbackRes.ok && fallbackData.success && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
        const primary = fallbackData.data.find((a: any) => a.isPrimary) || fallbackData.data[0];
        setReservedAccount({
          accountNumber: primary.accountNumber,
          bankName: primary.bankName,
          bankCode: primary.bankCode,
          accountName: primary.accountName || user?.fullName || "MK DATA Customer",
        });
      }
    } catch {
      // Fallback or retry silently
    } finally {
      setLoadingAccount(false);
    }
  }, [user?.fullName]);

  const generateAccount = useCallback(async (bank: string = "PALMPAY"): Promise<boolean> => {
    setLoadingAccount(true);
    try {
      const res = await fetch("/api/payments/reserved-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.accountNumber) {
        setReservedAccount({
          accountNumber: data.data.accountNumber,
          bankName: data.data.bankName,
          bankCode: data.data.bankCode,
          accountName: data.data.accountName || user?.fullName || "MK DATA Customer",
        });
        toast.success("Dedicated funding account ready!");
        return true;
      }
      toast.error(data.error || "Failed to generate account. Please try another bank.");
      return false;
    } catch {
      toast.error("Network error while generating account.");
      return false;
    } finally {
      setLoadingAccount(false);
    }
  }, [user?.fullName]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user && !reservedAccount) {
      fetchReservedAccount();
    }
  }, [user, reservedAccount, fetchReservedAccount]);

  const handleLogout = async () => {
    try {
      setUser(null);
      setReservedAccount(null);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      toast.success("Logged out successfully.");
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/login";
      }
    }
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
        fetchReservedAccount,
        generateAccount,
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
