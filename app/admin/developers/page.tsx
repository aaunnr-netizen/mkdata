"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Webhook,
  User,
  Copy,
  Check,
  Zap,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DeveloperItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  tier: "user" | "agent";
  balance: number;
  apiAccessStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  joinedAt: string;
  apiKey: {
    id: string;
    keyPrefix: string;
    status: "ACTIVE" | "REVOKED";
    name: string | null;
    lastUsedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
  } | null;
  webhookEndpoint: {
    id: string;
    url: string;
    isActive: boolean;
    failureCount: number;
    events: string[];
    updatedAt: string;
  } | null;
  _count: {
    transactions: number;
  };
}

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<DeveloperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal for displaying newly generated key
  const [generatedKeyData, setGeneratedKeyData] = useState<{
    userName: string;
    key: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchDevelopers = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/developers?query=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load developers");
      }
      setDevelopers(data.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDevelopers(search);
  };

  const handleAction = async (
    userId: string,
    action: "revoke_key" | "enable_key" | "regenerate_key" | "toggle_tier" | "delete_key",
    devName = "Developer"
  ) => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch("/api/admin/developers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action failed");
      }

      if (action === "regenerate_key" && data.newKey) {
        setGeneratedKeyData({ userName: devName, key: data.newKey });
        toast.success(`Key generated for ${devName}!`);
      } else {
        toast.success(data.message || "Operation successful.");
      }

      await fetchDevelopers(search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyNewKey = () => {
    if (!generatedKeyData?.key) return;
    navigator.clipboard.writeText(generatedKeyData.key);
    setCopiedKey(true);
    toast.success("Key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Metrics
  const totalDevs = developers.length;
  const activeKeys = developers.filter((d) => d.apiKey?.status === "ACTIVE").length;
  const revokedKeys = developers.filter((d) => d.apiKey?.status === "REVOKED").length;
  const webhooksActive = developers.filter((d) => d.webhookEndpoint?.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Developer & API Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage live API keys, monitor webhook listeners, assign agent tiers, and protect platform concurrency.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone, name, key..."
              className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <Button type="submit" variant="default" size="sm" className="rounded-xl text-xs font-bold">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                fetchDevelopers("");
              }}
              className="rounded-xl text-xs"
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Developers
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDevs}</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Active Live Keys
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeKeys}</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
            Revoked Keys
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{revokedKeys}</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            Webhooks Registered
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1">{webhooksActive}</p>
        </Card>
      </div>

      {/* Main Developer Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Developer Accounts ({developers.length})
          </span>
          <button
            onClick={() => fetchDevelopers(search)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-colors"
            title="Refresh developers list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading developer accounts...</span>
          </div>
        ) : developers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No developer accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Tier & Wallet</th>
                  <th className="py-3 px-4">API Key Status</th>
                  <th className="py-3 px-4">Webhook Endpoint</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {developers.map((dev) => {
                  const hasKey = Boolean(dev.apiKey);
                  const isKeyActive = dev.apiKey?.status === "ACTIVE";

                  return (
                    <tr key={dev.id} className="hover:bg-slate-50/60">
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {dev.fullName ? dev.fullName.slice(0, 2).toUpperCase() : "DV"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{dev.fullName || "Unnamed User"}</p>
                            <p className="font-mono text-[11px] text-slate-500">{dev.phone}</p>
                            {dev.email && (
                              <p className="text-[10px] text-slate-400">{dev.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tier & Balance */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                              dev.tier === "agent"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {dev.tier === "agent" ? "WHOLESALE AGENT" : "STANDARD USER"}
                          </span>
                          <p className="font-mono font-bold text-slate-800">
                            ₦{Number(dev.balance || 0).toLocaleString()}
                          </p>
                        </div>
                      </td>

                      {/* API Key */}
                      <td className="py-3 px-4">
                        {hasKey ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isKeyActive ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-bold ${
                                  isKeyActive ? "text-emerald-700" : "text-rose-600"
                                }`}
                              >
                                {isKeyActive ? "ACTIVE" : "REVOKED"}
                              </span>
                            </div>
                            <code className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {dev.apiKey?.keyPrefix}•••••
                            </code>
                            {dev.apiKey?.lastUsedAt && (
                              <p className="text-[10px] text-slate-400">
                                Last used: {new Date(dev.apiKey.lastUsedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No Key Issued</span>
                        )}
                      </td>

                      {/* Webhook Endpoint */}
                      <td className="py-3 px-4">
                        {dev.webhookEndpoint ? (
                          <div className="space-y-1 max-w-[200px]">
                            <p className="font-mono text-[11px] text-slate-700 truncate" title={dev.webhookEndpoint.url}>
                              {dev.webhookEndpoint.url}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-emerald-600 font-bold">Enabled</span>
                              {dev.webhookEndpoint.failureCount > 0 && (
                                <span className="text-rose-500 font-semibold">
                                  ({dev.webhookEndpoint.failureCount} fails)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Transactions Count */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800">
                          {dev._count?.transactions || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Revoked */}
                          {hasKey && (
                            <Button
                              size="sm"
                              variant={isKeyActive ? "destructive" : "default"}
                              disabled={actionLoading === `${dev.id}-${isKeyActive ? "revoke_key" : "enable_key"}`}
                              onClick={() =>
                                handleAction(
                                  dev.id,
                                  isKeyActive ? "revoke_key" : "enable_key",
                                  dev.fullName
                                )
                              }
                              className="text-[10px] h-7 px-2.5 rounded-lg"
                            >
                              {isKeyActive ? "Revoke Key" : "Enable Key"}
                            </Button>
                          )}

                          {/* Regenerate Key */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === `${dev.id}-regenerate_key`}
                            onClick={() => handleAction(dev.id, "regenerate_key", dev.fullName)}
                            className="text-[10px] h-7 px-2.5 rounded-lg border-slate-200"
                            title="Generate a brand new live API key for this user"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {hasKey ? "Regen" : "Issue Key"}
                          </Button>

                          {/* Toggle Tier */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === `${dev.id}-toggle_tier`}
                            onClick={() => handleAction(dev.id, "toggle_tier", dev.fullName)}
                            className="text-[10px] h-7 px-2.5 rounded-lg border-slate-200"
                            title="Toggle between User and Agent tier"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {dev.tier === "agent" ? "Demote" : "Make Agent"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Key Generation Modal */}
      {generatedKeyData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-base font-black text-slate-900">
                New API Key Generated
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A new live key was successfully generated for <strong>{generatedKeyData.userName}</strong>. Provide this key to the developer; it is only visible now and will not be displayed in plaintext again.
            </p>

            <div className="p-3.5 bg-slate-900 rounded-xl flex items-center justify-between gap-3 text-emerald-400 font-mono text-xs overflow-x-auto">
              <span className="break-all">{generatedKeyData.key}</span>
              <button
                onClick={handleCopyNewKey}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white shrink-0"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setGeneratedKeyData(null)}
                className="rounded-xl text-xs font-bold"
              >
                Done / Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
