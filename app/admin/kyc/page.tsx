"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, Search, RefreshCw, UserCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface KycUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: string;
  tier: string;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  kycDetails?: string | null;
  kycDetailsParsed?: {
    fullName?: string;
    ninOrId?: string;
    idType?: string;
    additionalInfo?: string;
    submittedAt?: string;
  } | null;
  kycSubmittedAt?: string | null;
  joinedAt: string;
}

export default function AdminKycPage() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [processingId, setActionId] = useState<string | null>(null);

  const fetchKycUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kyc");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch KYC submissions");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycUsers();
  }, []);

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    setActionId(userId);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `KYC status updated to ${action}`);
        fetchKycUsers();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred during update");
    } finally {
      setActionId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === "ALL" || u.kycStatus === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchLower) ||
      u.phone.includes(searchLower) ||
      (u.kycDetailsParsed?.ninOrId || "").toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = users.filter((u) => u.kycStatus === "PENDING").length;
  const approvedCount = users.filter((u) => u.kycStatus === "APPROVED").length;
  const rejectedCount = users.filter((u) => u.kycStatus === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Approvals & Security Verification</h1>
          <p className="text-sm text-slate-500">
            Review user identity submissions. Approved users have rate limit guards completely bypassed.
          </p>
        </div>
        <button
          onClick={fetchKycUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs font-medium text-amber-700">Pending Review</div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
            <div className="text-xs font-medium text-emerald-700">KYC Approved (Guards Bypassed)</div>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{rejectedCount}</div>
            <div className="text-xs font-medium text-rose-700">Rejected Applications</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or NIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                filter === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab === "ALL" ? "All Records" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading KYC applications...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No KYC applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Identity / NIN Details</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.phone}</div>
                    </td>

                    <td className="p-4">
                      {user.kycDetailsParsed ? (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-800">
                            {user.kycDetailsParsed.idType || "NIN"}:{" "}
                            <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {user.kycDetailsParsed.ninOrId || "N/A"}
                            </span>
                          </div>
                          {user.kycDetailsParsed.fullName && (
                            <div className="text-xs text-slate-500">
                              Name on Doc: {user.kycDetailsParsed.fullName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No details attached</span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-slate-600">
                      {user.kycSubmittedAt
                        ? new Date(user.kycSubmittedAt).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          user.kycStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : user.kycStatus === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {user.kycStatus === "APPROVED" && <CheckCircle2 size={12} />}
                        {user.kycStatus === "PENDING" && <Clock size={12} />}
                        {user.kycStatus === "REJECTED" && <XCircle size={12} />}
                        {user.kycStatus}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.kycStatus !== "APPROVED" && (
                          <button
                            disabled={processingId === user.id}
                            onClick={() => handleAction(user.id, "APPROVE")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            <UserCheck size={14} />
                            Approve
                          </button>
                        )}

                        {user.kycStatus !== "REJECTED" && (
                          <button
                            disabled={processingId === user.id}
                            onClick={() => handleAction(user.id, "REJECT")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            <AlertTriangle size={14} />
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
