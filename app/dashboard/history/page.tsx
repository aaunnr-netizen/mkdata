"use client";

import React, { useEffect, useState, useMemo } from "react";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import {
  ReceiptText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions?limit=30");
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch {
      toast.error("Could not load transaction history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== "ALL") {
        const t = (tx.type || "").toUpperCase();
        if (!t.includes(typeFilter)) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        const s = (tx.status || "").toUpperCase();
        if (statusFilter === "SUCCESS" && !["SUCCESS", "SUCCESSFUL", "COMPLETED"].includes(s)) return false;
        if (statusFilter === "PENDING" && !["PENDING", "PROCESSING"].includes(s)) return false;
        if (statusFilter === "FAILED" && !["FAILED", "REJECTED"].includes(s)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = (tx.reference || "").toLowerCase().includes(q);
        const matchesPhone = (tx.phone || "").toLowerCase().includes(q);
        const matchesDesc = (tx.description || "").toLowerCase().includes(q);
        if (!matchesRef && !matchesPhone && !matchesDesc) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, searchQuery]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = ["Reference", "Type", "Recipient/Phone", "Description", "Amount (NGN)", "Status", "Date"];
    const rows = filtered.map((tx) => [
      `"${tx.reference}"`,
      `"${tx.type}"`,
      `"${tx.phone || ""}"`,
      `"${(tx.description || "").replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.status}"`,
      `"${new Date(tx.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mkdata_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
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
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <ReceiptText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Transaction History</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Search, filter, view printable receipts, and export your transaction audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="p-2.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] hover:bg-[#eaf4ff] transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Service Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2 text-xs font-semibold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
          >
            <option value="ALL">All Services</option>
            <option value="DATA">Data</option>
            <option value="AIRTIME">Airtime</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="CABLE">Cable TV</option>
            <option value="EXAM">Exam PINs</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2 text-xs font-semibold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="rounded-2xl bg-white border border-[#d7e8ff] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[#526079]">
              <Loader2 className="h-6 w-6 animate-spin text-[#008fef]" />
              <span>Fetching transaction history...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#526079]">
              No transactions match your current filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fbff] text-[11px] font-bold text-[#526079] uppercase tracking-wider border-b border-[#eaf2ff]">
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Service</th>
                  <th className="py-3 px-5">Recipient / Details</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf2ff] text-xs">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#f8fbff]/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="py-3.5 px-5 font-mono text-[11px] text-[#06133a] font-semibold">
                      {tx.reference}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#06133a] uppercase">
                      {tx.type}
                    </td>
                    <td className="py-3.5 px-5 text-[#526079] max-w-[220px] truncate">
                      {tx.description || tx.phone || "—"}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#06133a]">
                      ₦{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">{getStatusBadge(tx.status)}</td>
                    <td className="py-3.5 px-5 text-[#8aa0be]">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#cfe2fb] bg-[#f8fbff] text-[11px] font-bold text-[#008fef] hover:bg-[#eaf4ff] transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
