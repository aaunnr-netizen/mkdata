"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  Wallet,
  Building2,
  Copy,
  Check,
  ArrowRight,
  Wifi,
  PhoneCall,
  Zap,
  KeyRound,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TransactionItem {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  phone?: string;
  description?: string;
  createdAt: string;
}

export default function DashboardHomePage() {
  const { user, openFunding, reservedAccount, loadingAccount, generateAccount } = useDashboard();
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, []);

  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopied(true);
    toast.success("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "SUCCESS" || s === "SUCCESSFUL" || s === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </span>
      );
    }
    if (s === "PENDING" || s === "PROCESSING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
          <Clock className="h-3 w-3" />
          Processing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#06133a] tracking-tight">
              Welcome back{user?.fullName ? `, ${user.fullName}` : ""}
            </h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                user?.tier === "agent"
                  ? "bg-[#008fef] text-white"
                  : "bg-[#e2edff] text-[#0060d0]"
              }`}
            >
              {user?.tier === "agent" ? "Agent Wholesale Tier" : "Standard Tier"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Manage your wallet, run telecom vending services, and manage your developer API keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openFunding}
            className="px-4 py-2 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Wallet className="h-3.5 w-3.5" />
            Deposit Funds
          </button>
          <Link
            href="/docs"
            className="px-4 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-all flex items-center gap-1.5"
          >
            View API Docs
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Top Cards: Reserved Bank Account & Balance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Dedicated Bank Account Funding Card */}
        <div className="lg:col-span-2 rounded-2xl bg-[linear-gradient(135deg,#008fef_0%,#005bb5_100%)] p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {loadingAccount ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-white">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
              <p className="text-xs font-bold tracking-wide text-white/90">
                Fetching dedicated funding account...
              </p>
            </div>
          ) : reservedAccount?.accountNumber ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Dedicated Funding Account
                    </p>
                    <h3 className="text-base font-bold text-white">
                      {reservedAccount.bankName}
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Instant 24/7 Credit
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                    Account Number
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-wider text-white font-mono">
                    {reservedAccount.accountNumber}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyAccount(reservedAccount.accountNumber)}
                  className="px-4 py-2 rounded-xl bg-white text-[#0060d0] text-xs font-bold shadow-md hover:bg-white/95 active:scale-95 transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#00a040]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Account
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/85 pt-3 border-t border-white/15">
                <span>
                  Beneficiary: <strong className="text-white">{reservedAccount.accountName || user?.fullName || "MK DATA"}</strong>
                </span>
                <span className="text-[11px] text-white/70">
                  Transfer funds from any Nigerian banking app to credit your wallet instantly.
                </span>
              </div>
            </>
          ) : (
            <div className="py-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Dedicated Virtual Account
                    </p>
                    <h3 className="text-base font-bold text-white">
                      Instant Automated Funding
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Automated Credit
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">
                    You don&apos;t have a dedicated bank account yet.
                  </p>
                  <p className="text-xs text-white/80 mt-1 max-w-md">
                    Generate your unique virtual account number to fund your wallet instantly at any time via simple bank transfer.
                  </p>
                </div>

                <button
                  onClick={() => generateAccount("PALMPAY")}
                  disabled={loadingAccount}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#0060d0] text-xs font-black shadow-md hover:bg-white/95 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <PlusCircle className="h-4 w-4" />
                  Generate Account
                </button>
              </div>

              <div className="mt-4 text-[11px] text-white/70 pt-3 border-t border-white/15">
                Instant wallet top-up 24/7 supported across all Nigerian commercial banks.
              </div>
            </div>
          )}
        </div>

        {/* Wallet Balance & Key Overview */}
        <div className="rounded-2xl bg-white border border-[#d7e8ff] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#526079] font-bold uppercase tracking-wider mb-2">
              <span>Available Wallet Balance</span>
              <Wallet className="h-4 w-4 text-[#008fef]" />
            </div>
            <div className="text-3xl font-black text-[#06133a] tracking-tight">
              ₦{Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-[#526079]">
              Used for all telecom vending and developer API vending.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#eaf2ff] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#526079] font-medium">Developer API Access</span>
              {user?.apiAccessStatus === "APPROVED" ? (
                <span className="font-bold text-[#059669] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active Live Key
                </span>
              ) : user?.apiAccessStatus === "PENDING" ? (
                <span className="font-bold text-[#d97706] flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Review
                </span>
              ) : (
                <Link
                  href="/dashboard/developer/keys"
                  className="font-bold text-[#008fef] hover:underline"
                >
                  Request API Access
                </Link>
              )}
            </div>

            <Link
              href="/dashboard/developer/keys"
              className="w-full py-2 px-3 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#008fef]" />
              Manage API Keys
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Services Launcher Grid */}
      <div>
        <h3 className="text-sm font-black text-[#06133a] tracking-tight mb-3">
          Quick Services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/data"
            className="group p-5 rounded-2xl bg-white border border-[#d7e8ff] hover:border-[#008fef] hover:shadow-md transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Wifi className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#06133a] group-hover:text-[#008fef] transition-colors">
              Buy Mobile Data
            </h4>
            <p className="mt-1 text-xs text-[#526079]">
              Instant SME, Gifting & Corporate data on MTN, Glo, Airtel & 9mobile.
            </p>
          </Link>

          <Link
            href="/dashboard/airtime"
            className="group p-5 rounded-2xl bg-white border border-[#d7e8ff] hover:border-[#008fef] hover:shadow-md transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PhoneCall className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#06133a] group-hover:text-[#008fef] transition-colors">
              Buy Airtime
            </h4>
            <p className="mt-1 text-xs text-[#526079]">
              Instant VTU top-up across all networks with wholesale agent discounts.
            </p>
          </Link>

          <Link
            href="/dashboard/electricity"
            className="group p-5 rounded-2xl bg-white border border-[#d7e8ff] hover:border-[#008fef] hover:shadow-md transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#06133a] group-hover:text-[#008fef] transition-colors">
              Electricity Bills
            </h4>
            <p className="mt-1 text-xs text-[#526079]">
              Prepaid & Postpaid disco bill payments with instant token generation.
            </p>
          </Link>

          <Link
            href="/dashboard/developer/keys"
            className="group p-5 rounded-2xl bg-white border border-[#d7e8ff] hover:border-[#008fef] hover:shadow-md transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <KeyRound className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#06133a] group-hover:text-[#008fef] transition-colors">
              Developer APIs
            </h4>
            <p className="mt-1 text-xs text-[#526079]">
              Integrate data and airtime vending directly into your own app or website.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl bg-white border border-[#d7e8ff] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#eaf2ff] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#06133a] tracking-tight">
              Recent Transactions
            </h3>
            <p className="text-xs text-[#526079]">
              Latest activities on your MK DATA wallet
            </p>
          </div>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#008fef] hover:text-[#0060d0] transition-colors"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loadingTx ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#526079]">
              <Loader2 className="h-6 w-6 animate-spin text-[#008fef]" />
              <span>Loading recent transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#526079]">
              No transactions yet. Fund your wallet or make your first purchase to get started.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fbff] text-[11px] font-bold text-[#526079] uppercase tracking-wider border-b border-[#eaf2ff]">
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf2ff] text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#f8fbff]/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#06133a] font-semibold">
                      {tx.reference}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#06133a] uppercase">
                      {tx.type}
                    </td>
                    <td className="py-3.5 px-5 text-[#526079] max-w-[240px] truncate">
                      {tx.description || tx.phone || "Vending order"}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#06133a]">
                      ₦{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">{getStatusBadge(tx.status)}</td>
                    <td className="py-3.5 px-5 text-right text-[#8aa0be]">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
