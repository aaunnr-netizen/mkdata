"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, TrendingUp, SlidersHorizontal, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  network: string;
  sizeLabel: string;
  validity: string;
  price: number;
  user_price: number;
  agent_price: number;
  admin_price?: number;
  apiSource: string;
  externalPlanId: number;
  externalNetworkId: number;
  apiAPlanId?: number | null;
  apiANetworkId?: number | null;
  apiBPlanId?: number | null;
  apiBNetworkId?: number | null;
  apiCPlanId?: number | null;
  apiCNetworkId?: number | null;
  apiDPlanId?: number | null;
  apiDNetworkId?: number | null;
  isActive: boolean;
  dataType?: string;
}

const apiSourceLabels: Record<string, string> = {
  API_A: "SMEPlug",
  API_B: "Saiful",
  API_C: "Alrahuz",
  API_D: "Amysub",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Pricing Tier Modal State
  const [quickTierPlan, setQuickTierPlan] = useState<Plan | null>(null);
  const [quickTierForm, setQuickTierForm] = useState({
    user_price: 0,
    agent_price: 0,
    admin_price: 0,
  });
  const [savingQuickTier, setSavingQuickTier] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    network: "MTN",
    sizeLabel: "",
    validity: "",
    user_price: 0,
    agent_price: 0,
    admin_price: 0,
    apiSource: "API_A",
    apiAPlanId: 0,
    apiANetworkId: 1,
    apiBPlanId: 0,
    apiBNetworkId: 1,
    apiCPlanId: 0,
    apiCNetworkId: 1,
    apiDPlanId: 0,
    apiDNetworkId: 1,
    dataType: "SME",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      network: "MTN",
      sizeLabel: "",
      validity: "",
      user_price: 0,
      agent_price: 0,
      admin_price: 0,
      apiSource: "API_A",
      apiAPlanId: 0,
      apiANetworkId: 1,
      apiBPlanId: 0,
      apiBNetworkId: 1,
      apiCPlanId: 0,
      apiCNetworkId: 1,
      apiDPlanId: 0,
      apiDNetworkId: 1,
      dataType: "SME",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.admin_price < 0) {
        throw new Error("Admin price cannot be negative");
      }
      if (formData.agent_price < formData.admin_price) {
        throw new Error("Agent price cannot be less than admin cost price");
      }
      if (formData.user_price < formData.agent_price) {
        throw new Error("User price cannot be less than agent price");
      }

      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save plan");
      }

      await fetchPlans();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      network: plan.network,
      sizeLabel: plan.sizeLabel,
      validity: plan.validity,
      user_price: plan.user_price,
      agent_price: plan.agent_price,
      admin_price: plan.admin_price || 0,
      apiSource: plan.apiSource,
      apiAPlanId: plan.apiAPlanId || (plan.apiSource === "API_A" ? plan.externalPlanId : 0),
      apiANetworkId: plan.apiANetworkId || (plan.apiSource === "API_A" ? plan.externalNetworkId : 1),
      apiBPlanId: plan.apiBPlanId || (plan.apiSource === "API_B" ? plan.externalPlanId : 0),
      apiBNetworkId: plan.apiBNetworkId || (plan.apiSource === "API_B" ? plan.externalNetworkId : 1),
      apiCPlanId: plan.apiCPlanId || (plan.apiSource === "API_C" ? plan.externalPlanId : 0),
      apiCNetworkId: plan.apiCNetworkId || (plan.apiSource === "API_C" ? plan.externalNetworkId : 1),
      apiDPlanId: plan.apiDPlanId || (plan.apiSource === "API_D" ? plan.externalPlanId : 0),
      apiDNetworkId: plan.apiDNetworkId || (plan.apiSource === "API_D" ? plan.externalNetworkId : 1),
      dataType: plan.dataType || "SME",
    });
    setEditingId(plan.id);
    setOpenDialog(true);
  };

  const openQuickTierModal = (plan: Plan) => {
    setQuickTierPlan(plan);
    setQuickTierForm({
      user_price: plan.user_price,
      agent_price: plan.agent_price,
      admin_price: plan.admin_price || 0,
    });
  };

  const handleSaveQuickTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTierPlan) return;

    try {
      setSavingQuickTier(true);
      setError(null);

      if (quickTierForm.admin_price < 0) {
        throw new Error("Admin price cannot be negative");
      }
      if (quickTierForm.agent_price < quickTierForm.admin_price) {
        throw new Error("Agent price cannot be less than admin cost price");
      }
      if (quickTierForm.user_price < quickTierForm.agent_price) {
        throw new Error("User price cannot be less than agent price");
      }

      const res = await fetch("/api/admin/plans/pricing-tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: quickTierPlan.id,
          user_price: quickTierForm.user_price,
          agent_price: quickTierForm.agent_price,
          admin_price: quickTierForm.admin_price,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Failed to update pricing tiers");
      }

      await fetchPlans();
      setQuickTierPlan(null);
    } catch (err: any) {
      setError(err?.message || "Error updating pricing tiers");
    } finally {
      setSavingQuickTier(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete plan");
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!response.ok) throw new Error("Failed to toggle plan");
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Filter plans based on network tab and search query
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesNetwork = selectedNetwork === "ALL" || plan.network === selectedNetwork;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        plan.name.toLowerCase().includes(q) ||
        plan.network.toLowerCase().includes(q) ||
        plan.sizeLabel.toLowerCase().includes(q) ||
        (plan.dataType && plan.dataType.toLowerCase().includes(q)) ||
        String(plan.externalPlanId).includes(q);
      return matchesNetwork && matchesSearch;
    });
  }, [plans, selectedNetwork, searchQuery]);

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Plans & Pricing Tiers</h1>
          <p className="text-xs text-slate-600 mt-1">
            Manually configure 3-tier pricing: <strong>User Price</strong>, <strong>Agent Wholesale</strong>, and <strong>Admin Cost</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPlans} title="Refresh Plans">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Sync
          </Button>

          <Dialog
            open={openDialog}
            onOpenChange={(open) => {
              setOpenDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger>
              <Button onClick={() => setEditingId(null)} className="bg-[#008fef] hover:bg-[#0060d0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Plan & Pricing Tiers" : "Add New Plan & Pricing Tiers"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., MTN 1GB SME" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Network</Label>
                    <select
                      value={formData.network}
                      onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                      className="w-full border border-slate-200 rounded-md bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MTN">MTN</option>
                      <option value="GLO">Glo</option>
                      <option value="AIRTEL">Airtel</option>
                      <option value="NINEMOBILE">9Mobile</option>
                    </select>
                  </div>
                  <div>
                    <Label>Size Label</Label>
                    <Input value={formData.sizeLabel} onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })} placeholder="e.g., 1GB, 500MB" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Validity</Label>
                    <Input value={formData.validity} onChange={(e) => setFormData({ ...formData, validity: e.target.value })} placeholder="e.g., 30 Days" required />
                  </div>
                  <div>
                    <Label>Plan Type (dataType)</Label>
                    <select
                      value={formData.dataType}
                      onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                      className="w-full border border-slate-200 rounded-md bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SME">SME</option>
                      <option value="SME2">SME2</option>
                      <option value="GIFTING">Gifting</option>
                      <option value="MTN CG">Corporate Gifting (CG)</option>
                      <option value="DATA COUPONS">Data Coupons</option>
                    </select>
                  </div>
                </div>

                {/* 3-Tier Pricing Configuration Section */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                        Pricing Tiers (Manual Configuration)
                      </h4>
                      <p className="text-[11px] text-blue-700">
                        Rule: Admin Price (Cost) ≤ Agent Price ≤ User Price
                      </p>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-800 bg-white text-[10px] font-bold">
                      3 Configurable Tiers
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">User Price (₦)</Label>
                      <p className="text-[10px] text-slate-500 mb-1">Standard customer retail</p>
                      <Input
                        type="number"
                        min="1"
                        value={formData.user_price || ""}
                        onChange={(e) => setFormData({ ...formData, user_price: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 290"
                        className="bg-white font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Agent Price (₦)</Label>
                      <p className="text-[10px] text-slate-500 mb-1">Wholesale / API developer</p>
                      <Input
                        type="number"
                        min="1"
                        value={formData.agent_price || ""}
                        onChange={(e) => setFormData({ ...formData, agent_price: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 270"
                        className="bg-white font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Admin Price (₦)</Label>
                      <p className="text-[10px] text-slate-500 mb-1">API gateway base cost</p>
                      <Input
                        type="number"
                        min="0"
                        value={formData.admin_price ?? ""}
                        onChange={(e) => setFormData({ ...formData, admin_price: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 255"
                        className="bg-white font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Profit Margins Visualizer */}
                  <div className="pt-2.5 border-t border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600">
                      Customer Margin:{" "}
                      <span className={`font-bold ${formData.user_price - formData.admin_price >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        +₦{(formData.user_price - formData.admin_price).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Agent Margin:{" "}
                      <span className={`font-bold ${formData.agent_price - formData.admin_price >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        +₦{(formData.agent_price - formData.admin_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>API Source</Label>
                    <select
                      value={formData.apiSource}
                      onChange={(e) => setFormData({ ...formData, apiSource: e.target.value })}
                      className="w-full border border-slate-200 rounded-md bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="API_A">SMEPlug</option>
                      <option value="API_B">Saiful</option>
                      <option value="API_C">Alrahuz</option>
                      <option value="API_D">Amysub</option>
                    </select>
                  </div>
                </div>

                {[
                  { id: "API_A", name: "SMEPlug", plan: "apiAPlanId", network: "apiANetworkId" },
                  { id: "API_B", name: "Saiful", plan: "apiBPlanId", network: "apiBNetworkId" },
                  { id: "API_C", name: "Alrahuz", plan: "apiCPlanId", network: "apiCNetworkId" },
                  { id: "API_D", name: "Amysub", plan: "apiDPlanId", network: "apiDNetworkId" },
                ]
                  .filter((source) => formData.apiSource === source.id)
                  .map((source) => (
                    <div key={source.name} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{source.name} IDs</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{source.name} Plan ID</Label>
                          <Input
                            type="number"
                            min="1"
                            value={(formData as any)[source.plan] || ""}
                            onChange={(e) => setFormData({ ...formData, [source.plan]: parseInt(e.target.value, 10) || 0 })}
                            required
                          />
                        </div>
                        <div>
                          <Label>{source.name} Network ID</Label>
                          <Input
                            type="number"
                            min="1"
                            value={(formData as any)[source.network] || ""}
                            onChange={(e) => setFormData({ ...formData, [source.network]: parseInt(e.target.value, 10) || 0 })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                <Button type="submit" className="w-full bg-[#008fef] hover:bg-[#0060d0]">
                  {editingId ? "Update Plan & Pricing Tiers" : "Create Plan & Configure Tiers"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "MTN", "AIRTEL", "GLO", "NINEMOBILE"].map((net) => (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedNetwork === net
                  ? "bg-[#008fef] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {net}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plan or ID..."
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Plans & Pricing Tiers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan ID</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Network</th>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-blue-700 bg-blue-50/50">User Price</th>
                <th className="px-4 py-3 text-left font-semibold text-emerald-700 bg-emerald-50/50">Agent Price</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 bg-slate-100/60">Admin Price</th>
                <th className="px-4 py-3 text-left font-semibold">Margins (User / Agent)</th>
                <th className="px-4 py-3 text-left font-semibold">API</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                    No data plans found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const adminPrice = plan.admin_price || 0;
                  const customerMargin = plan.user_price - adminPrice;
                  const agentMargin = plan.agent_price - adminPrice;

                  return (
                    <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 text-xs">
                        #{plan.externalPlanId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{plan.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-bold">{plan.network}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">{plan.sizeLabel}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] uppercase">{plan.dataType || "SME"}</Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-800 bg-blue-50/30">
                        ₦{plan.user_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700 bg-emerald-50/30">
                        ₦{plan.agent_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 bg-slate-100/40">
                        ₦{adminPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs font-semibold">
                          <span className={customerMargin >= 0 ? "text-emerald-700" : "text-rose-600"}>
                            User: +₦{customerMargin.toLocaleString()}
                          </span>
                          <span className={agentMargin >= 0 ? "text-blue-700 text-[11px]" : "text-rose-600 text-[11px]"}>
                            Agent: +₦{agentMargin.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[11px]">
                          {apiSourceLabels[plan.apiSource] || plan.apiSource}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={plan.isActive ? "bg-emerald-100 text-emerald-800 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openQuickTierModal(plan)}
                            title="Quick Edit Pricing Tiers"
                            className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(plan)}
                            title="Full Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(plan)}
                            title={plan.isActive ? "Deactivate" : "Activate"}
                            className="h-8 w-8 p-0"
                          >
                            {plan.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(plan.id)}
                            title="Delete Plan"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Pricing Tier Modal */}
      {quickTierPlan && (
        <Dialog open={Boolean(quickTierPlan)} onOpenChange={(open) => !open && setQuickTierPlan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                Configure Pricing Tiers
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveQuickTier} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="font-bold text-slate-800">{quickTierPlan.name}</div>
                <div className="text-slate-500">
                  Network: <strong>{quickTierPlan.network}</strong> | Size: <strong>{quickTierPlan.sizeLabel}</strong> | Plan ID: <strong>#{quickTierPlan.externalPlanId}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">User Price (₦)</Label>
                  <p className="text-[10px] text-slate-500 mb-1">Standard customer retail</p>
                  <Input
                    type="number"
                    min="1"
                    value={quickTierForm.user_price || ""}
                    onChange={(e) => setQuickTierForm({ ...quickTierForm, user_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Agent Price (₦)</Label>
                  <p className="text-[10px] text-slate-500 mb-1">Wholesale reseller / developer</p>
                  <Input
                    type="number"
                    min="1"
                    value={quickTierForm.agent_price || ""}
                    onChange={(e) => setQuickTierForm({ ...quickTierForm, agent_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Admin Price (₦)</Label>
                  <p className="text-[10px] text-slate-500 mb-1">Base API gateway cost</p>
                  <Input
                    type="number"
                    min="0"
                    value={quickTierForm.admin_price ?? ""}
                    onChange={(e) => setQuickTierForm({ ...quickTierForm, admin_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              {/* Profit Preview */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs flex justify-between">
                <div>
                  Customer Profit:{" "}
                  <strong className={quickTierForm.user_price - quickTierForm.admin_price >= 0 ? "text-emerald-700" : "text-rose-600"}>
                    +₦{(quickTierForm.user_price - quickTierForm.admin_price).toLocaleString()}
                  </strong>
                </div>
                <div>
                  Agent Profit:{" "}
                  <strong className={quickTierForm.agent_price - quickTierForm.admin_price >= 0 ? "text-blue-700" : "text-rose-600"}>
                    +₦{(quickTierForm.agent_price - quickTierForm.admin_price).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setQuickTierPlan(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingQuickTier} className="bg-[#008fef] hover:bg-[#0060d0] text-white">
                  {savingQuickTier ? "Saving..." : "Save Pricing Tiers"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
