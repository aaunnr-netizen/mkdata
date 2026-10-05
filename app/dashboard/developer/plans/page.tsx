"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Layers,
  Copy,
  Check,
  Search,
  RefreshCw,
  Code2,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface PlanItem {
  id: string;
  plan_id: number;
  name: string;
  network: "MTN" | "AIRTEL" | "GLO" | "9MOBILE" | string;
  size: string;
  validity: string;
  type: string;
  price: number;
  retailPrice: number;
  updatedAt: string;
}

const NETWORK_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  MTN: { bg: "bg-[#fff9db]", text: "text-[#856404]", border: "border-[#ffeeba]", accent: "#e0a800" },
  AIRTEL: { bg: "bg-[#fff0f0]", text: "text-[#c82333]", border: "border-[#f5c6cb]", accent: "#dc3545" },
  GLO: { bg: "bg-[#ebfbee]", text: "text-[#218838]", border: "border-[#c3e6cb]", accent: "#28a745" },
  "9MOBILE": { bg: "bg-[#e8fbf6]", text: "text-[#0e705b]", border: "border-[#b2eee0]", accent: "#00966b" },
};

export default function DeveloperPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [activeSamplePlan, setActiveSamplePlan] = useState<PlanItem | null>(null);

  const fetchPlans = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/developer/plans", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.plans)) {
        setPlans(data.plans);
        setLastUpdated(new Date().toLocaleTimeString());
        if (!activeSamplePlan && data.plans.length > 0) {
          setActiveSamplePlan(data.plans[0]);
        }
        if (isManualRefresh) {
          toast.success("Plans updated live from system.");
        }
      } else {
        toast.error("Failed to fetch plan catalog.");
      }
    } catch {
      toast.error("Network error fetching live plan list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCopyId = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    toast.success(`Copied Plan ID: ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentSamplePlan = activeSamplePlan || plans[0] || {
    network: "MTN",
    plan_id: 82,
    size: "2GB",
  };

  const sampleJson = JSON.stringify(
    {
      network: currentSamplePlan.network,
      plan_id: currentSamplePlan.plan_id,
      number: "08012345678",
      tx_id: `MKD-TX-${Date.now()}`,
    },
    null,
    2
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(sampleJson);
    setCopiedPayload(true);
    toast.success("Sample JSON payload copied.");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchNetwork = selectedNetwork === "ALL" || plan.network === selectedNetwork;
      const matchType = selectedType === "ALL" || plan.type.toLowerCase() === selectedType.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        plan.name.toLowerCase().includes(query) ||
        plan.size.toLowerCase().includes(query) ||
        String(plan.plan_id).includes(query) ||
        plan.network.toLowerCase().includes(query);
      return matchNetwork && matchType && matchSearch;
    });
  }, [plans, selectedNetwork, selectedType, searchQuery]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((p) => {
      if (p.type) set.add(p.type);
    });
    return Array.from(set);
  }, [plans]);

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: plans.length, MTN: 0, AIRTEL: 0, GLO: 0, "9MOBILE": 0 };
    plans.forEach((p) => {
      if (counts[p.network] !== undefined) {
        counts[p.network]++;
      }
    });
    return counts;
  }, [plans]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#008fef]/10 text-[#008fef]">
              <Layers className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-[#06133a] tracking-tight">Plan IDs</h1>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#e8fbf6] text-[#0e705b] border border-[#b2eee0] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00966b] animate-pulse" />
              Live Pricing
            </span>
          </div>
          <p className="text-xs text-[#526079]">
            Live catalog of numeric plan IDs for your data vending integrations. Real-time synchronized with wholesale pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] font-semibold text-[#8a9bb5]">
              Synced at {lastUpdated}
            </span>
          )}
          <button
            onClick={() => fetchPlans(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#0060d0] hover:bg-[#edf5ff] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Integration Payload Reference */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#06133a] to-[#002766] text-white shadow-lg border border-[#0060d0]/30">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#00c6ff]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#9db7dc]">
                Integration Payload Structure
              </span>
            </div>
            <p className="text-xs text-[#d7e8ff] leading-relaxed">
              Send a <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#00c6ff] font-mono">POST</code> request to{" "}
              <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">/api/v1/data/purchase</code> with the numeric{" "}
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#00c6ff] font-mono">plan_id</code> and your unique{" "}
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#00c6ff] font-mono">tx_id</code>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#9db7dc] block text-[10px] font-bold">network</span>
                <span className="font-semibold text-white">MTN, AIRTEL, GLO, 9MOBILE</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#9db7dc] block text-[10px] font-bold">plan_id</span>
                <span className="font-semibold text-[#00c6ff]">Numeric ID (e.g. 5, 82)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#9db7dc] block text-[10px] font-bold">number</span>
                <span className="font-semibold text-white">11-digit phone number</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#9db7dc] block text-[10px] font-bold">tx_id</span>
                <span className="font-semibold text-white">Unique idempotency key</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#9db7dc] px-1">
              <span>Sample JSON Body</span>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[11px] font-bold text-[#00c6ff] hover:underline"
              >
                {copiedPayload ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedPayload ? "Copied" : "Copy Payload"}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[12px] text-[#00e5ff] overflow-x-auto leading-tight shadow-inner">
              {sampleJson}
            </pre>
          </div>
        </div>
      </div>

      {/* Network Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "MTN", "AIRTEL", "GLO", "9MOBILE"] as const).map((net) => {
          const isActive = selectedNetwork === net;
          const count = networkCounts[net] || 0;
          return (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                isActive
                  ? "bg-[#008fef] text-white shadow-[#008fef]/20"
                  : "bg-white text-[#526079] border border-[#d7e8ff] hover:bg-[#f5faff]"
              }`}
            >
              <span>{net === "ALL" ? "All Networks" : net}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-[#f0f5ff] text-[#0060d0]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9bb5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by size, plan name, or numeric ID..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#cfe2fb] bg-white text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:ring-2 focus:ring-[#008fef]/15"
          />
        </div>

        {uniqueTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#526079]">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#cfe2fb] bg-white text-[#06133a] font-semibold outline-none focus:border-[#008fef]"
            >
              <option value="ALL">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-[#d7e8ff] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-[#008fef] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#526079]">Loading live plan catalog...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="h-8 w-8 text-[#9db7dc] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#06133a]">No plans found</p>
            <p className="text-[11px] text-[#526079] mt-1">Try adjusting your network filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#eaf2ff] bg-[#f8fbff] text-[11px] font-black text-[#526079] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Plan ID</th>
                  <th className="py-3.5 px-4">Network</th>
                  <th className="py-3.5 px-4">Plan Name</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Wholesale Price</th>
                  <th className="py-3.5 px-4">Standard Price</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf2ff] text-xs font-medium text-[#06133a]">
                {filteredPlans.map((plan) => {
                  const netStyle = NETWORK_COLORS[plan.network] || {
                    bg: "bg-[#f0f4f9]",
                    text: "text-[#334155]",
                    border: "border-[#cbd5e1]",
                    accent: "#64748b",
                  };
                  const isCopied = copiedId === plan.plan_id;
                  const isSample = activeSamplePlan?.plan_id === plan.plan_id;

                  return (
                    <tr
                      key={plan.id}
                      className={`hover:bg-[#fbfdff] transition-colors ${
                        isSample ? "bg-[#f0f7ff]/70" : ""
                      }`}
                    >
                      {/* Numeric Plan ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-black text-[#0060d0] px-2 py-0.5 rounded-lg bg-[#eef6ff] border border-[#d0e4ff]">
                            {plan.plan_id}
                          </span>
                          <button
                            onClick={() => handleCopyId(plan.plan_id)}
                            title="Copy Plan ID"
                            className="p-1 rounded-md text-[#8a9bb5] hover:text-[#008fef] hover:bg-[#edf5ff] transition"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Network */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${netStyle.bg} ${netStyle.text} ${netStyle.border}`}
                        >
                          {plan.network}
                        </span>
                      </td>

                      {/* Plan Name */}
                      <td className="py-3 px-4 font-bold text-[#06133a]">
                        {plan.name}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 font-black text-[#0060d0]">
                        {plan.size}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold text-[#526079] bg-[#f0f4f8] px-2 py-0.5 rounded-md">
                          {plan.type}
                        </span>
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4 text-[#526079]">
                        {plan.validity}
                      </td>

                      {/* Wholesale Price (Developer Agent Price) */}
                      <td className="py-3 px-4 font-black text-[#059669]">
                        ₦{plan.price.toLocaleString()}
                      </td>

                      {/* Standard Retail Price */}
                      <td className="py-3 px-4 text-[#8a9bb5] line-through text-[11px]">
                        ₦{plan.retailPrice.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveSamplePlan(plan);
                            handleCopyId(plan.plan_id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#cfe2fb] bg-[#f8fbff] text-[#0060d0] hover:bg-[#edf5ff] transition"
                        >
                          Use in Payload
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
