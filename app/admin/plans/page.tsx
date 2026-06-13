"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Native HTML selects used instead of Radix UI select components to avoid overlay issues
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
  const [formData, setFormData] = useState({
    name: "",
    network: "MTN",
    sizeLabel: "",
    validity: "",
    user_price: 0,
    agent_price: 0,
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
      if (formData.agent_price > formData.user_price) {
        throw new Error("Agent price cannot exceed user price");
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

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Data Plans</h1>
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Plan" : "Add New Plan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
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
                  <Label>Size</Label>
                  <Input value={formData.sizeLabel} onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })} placeholder="e.g., 1GB" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Validity</Label>
                  <Input value={formData.validity} onChange={(e) => setFormData({ ...formData, validity: e.target.value })} placeholder="e.g., Monthly" required />
                </div>
                <div>
                  <Label>User Price (N)</Label>
                  <Input type="number" value={formData.user_price} onChange={(e) => setFormData({ ...formData, user_price: parseFloat(e.target.value) || 0 })} required />
                </div>
              </div>
              <div>
                <Label>Agent Price (N)</Label>
                <Input type="number" value={formData.agent_price} onChange={(e) => setFormData({ ...formData, agent_price: parseFloat(e.target.value) || 0 })} required />
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
                  <option value="MTN CG">MTN CG</option>
                </select>
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
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Plan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Network</th>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">Validity</th>
                <th className="px-4 py-3 text-left font-semibold">User Price</th>
                <th className="px-4 py-3 text-left font-semibold">Agent Price</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">API</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{plan.network}</Badge></td>
                  <td className="px-4 py-3">{plan.sizeLabel}</td>
                  <td className="px-4 py-3">{plan.validity}</td>
                  <td className="px-4 py-3 font-semibold">N{plan.user_price}</td>
                  <td className="px-4 py-3 font-semibold">N{plan.agent_price}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{plan.dataType || "SME"}</Badge></td>
                  <td className="px-4 py-3"><Badge>{apiSourceLabels[plan.apiSource] || plan.apiSource}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge className={plan.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(plan)}>
                      {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
