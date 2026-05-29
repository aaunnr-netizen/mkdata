"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ElectricityProvider = {
  id: string;
  name: string;
  discoName: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
};

type CableProvider = {
  id: string;
  name: string;
  cablename: number;
  isActive: boolean;
};

type CablePlan = {
  id: string;
  providerId: string;
  name: string;
  cableplan: number;
  price: number;
  isActive: boolean;
  provider?: CableProvider;
};

type ExamProduct = {
  id: string;
  examName: string;
  displayName: string;
  price: number;
  maxQuantity: number;
  isActive: boolean;
};

const defaultElectricity = { name: "", discoName: 0, minAmount: 500, maxAmount: 50000, isActive: true };
const defaultCableProvider = { name: "", cablename: 0, isActive: true };
const defaultCablePlan = { providerId: "", name: "", cableplan: 0, price: 0, isActive: true };
const defaultExam = { examName: "", displayName: "", price: 0, maxQuantity: 5, isActive: true };

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || "Request failed");
  }
  return payload;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge className={active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>{active ? "Active" : "Inactive"}</Badge>;
}

export default function ServicesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [electricity, setElectricity] = useState<ElectricityProvider[]>([]);
  const [electricityForm, setElectricityForm] = useState(defaultElectricity);
  const [editingElectricityId, setEditingElectricityId] = useState<string | null>(null);

  const [cableProviders, setCableProviders] = useState<CableProvider[]>([]);
  const [cableProviderForm, setCableProviderForm] = useState(defaultCableProvider);
  const [editingCableProviderId, setEditingCableProviderId] = useState<string | null>(null);

  const [cablePlans, setCablePlans] = useState<CablePlan[]>([]);
  const [cablePlanForm, setCablePlanForm] = useState(defaultCablePlan);
  const [editingCablePlanId, setEditingCablePlanId] = useState<string | null>(null);

  const [exams, setExams] = useState<ExamProduct[]>([]);
  const [examForm, setExamForm] = useState(defaultExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [electricityData, providerData, planData, examData] = await Promise.all([
      apiRequest("/api/admin/services/electricity"),
      apiRequest("/api/admin/services/cable-providers"),
      apiRequest("/api/admin/services/cable-plans"),
      apiRequest("/api/admin/services/exams"),
    ]);
    setElectricity(electricityData.data || []);
    setCableProviders(providerData.data || []);
    setCablePlans(planData.data || []);
    setExams(examData.data || []);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load services"))
      .finally(() => setLoading(false));
  }, []);

  const saveElectricity = async () => {
    setSaving("electricity");
    try {
      await apiRequest(editingElectricityId ? `/api/admin/services/electricity/${editingElectricityId}` : "/api/admin/services/electricity", {
        method: editingElectricityId ? "PATCH" : "POST",
        body: JSON.stringify(electricityForm),
      });
      setElectricityForm(defaultElectricity);
      setEditingElectricityId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save electricity provider");
    } finally {
      setSaving("");
    }
  };

  const saveCableProvider = async () => {
    setSaving("cable-provider");
    try {
      await apiRequest(editingCableProviderId ? `/api/admin/services/cable-providers/${editingCableProviderId}` : "/api/admin/services/cable-providers", {
        method: editingCableProviderId ? "PATCH" : "POST",
        body: JSON.stringify(cableProviderForm),
      });
      setCableProviderForm(defaultCableProvider);
      setEditingCableProviderId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save cable provider");
    } finally {
      setSaving("");
    }
  };

  const saveCablePlan = async () => {
    setSaving("cable-plan");
    try {
      await apiRequest(editingCablePlanId ? `/api/admin/services/cable-plans/${editingCablePlanId}` : "/api/admin/services/cable-plans", {
        method: editingCablePlanId ? "PATCH" : "POST",
        body: JSON.stringify(cablePlanForm),
      });
      setCablePlanForm(defaultCablePlan);
      setEditingCablePlanId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save cable plan");
    } finally {
      setSaving("");
    }
  };

  const saveExam = async () => {
    setSaving("exam");
    try {
      await apiRequest(editingExamId ? `/api/admin/services/exams/${editingExamId}` : "/api/admin/services/exams", {
        method: editingExamId ? "PATCH" : "POST",
        body: JSON.stringify(examForm),
      });
      setExamForm(defaultExam);
      setEditingExamId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save exam product");
    } finally {
      setSaving("");
    }
  };

  const remove = async (path: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await apiRequest(path, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Services</h1>
        <p className="mt-1 text-sm text-slate-500">Configure API C products for electricity, cable TV, and exam checker.</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Electricity Discos</h2>
          {editingElectricityId ? <Badge>Editing</Badge> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={electricityForm.name} onChange={(event) => setElectricityForm({ ...electricityForm, name: event.target.value })} placeholder="Ikeja Electric" />
          </div>
          <div>
            <Label>Disco ID</Label>
            <Input type="number" value={electricityForm.discoName} onChange={(event) => setElectricityForm({ ...electricityForm, discoName: Number(event.target.value) })} />
          </div>
          <div>
            <Label>Min Amount</Label>
            <Input type="number" value={electricityForm.minAmount} onChange={(event) => setElectricityForm({ ...electricityForm, minAmount: Number(event.target.value) })} />
          </div>
          <div>
            <Label>Max Amount</Label>
            <Input type="number" value={electricityForm.maxAmount} onChange={(event) => setElectricityForm({ ...electricityForm, maxAmount: Number(event.target.value) })} />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={electricityForm.isActive} onChange={(event) => setElectricityForm({ ...electricityForm, isActive: event.target.checked })} />
          Active
        </label>
        <Button onClick={saveElectricity} disabled={saving === "electricity"} className="mt-4 gap-2">
          {saving === "electricity" ? <Loader2 className="h-4 w-4 animate-spin" /> : editingElectricityId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingElectricityId ? "Update Disco" : "Add Disco"}
        </Button>
        <div className="mt-5 overflow-hidden rounded-lg border">
          {electricity.map((item) => (
            <div key={item.id} className="grid grid-cols-5 items-center gap-3 border-b p-3 last:border-b-0">
              <div className="col-span-2 font-semibold">{item.name}</div>
              <div className="text-sm text-slate-600">ID {item.discoName}</div>
              <ActiveBadge active={item.isActive} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingElectricityId(item.id); setElectricityForm(item); }}>Edit</Button>
                <Button size="icon" variant="outline" onClick={() => remove(`/api/admin/services/electricity/${item.id}`)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Cable Providers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Name</Label>
            <Input value={cableProviderForm.name} onChange={(event) => setCableProviderForm({ ...cableProviderForm, name: event.target.value })} placeholder="DSTV" />
          </div>
          <div>
            <Label>Provider ID</Label>
            <Input type="number" value={cableProviderForm.cablename} onChange={(event) => setCableProviderForm({ ...cableProviderForm, cablename: Number(event.target.value) })} />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={cableProviderForm.isActive} onChange={(event) => setCableProviderForm({ ...cableProviderForm, isActive: event.target.checked })} />
            Active
          </label>
        </div>
        <Button onClick={saveCableProvider} disabled={saving === "cable-provider"} className="mt-4 gap-2">
          {saving === "cable-provider" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editingCableProviderId ? "Update Provider" : "Add Provider"}
        </Button>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cableProviders.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">ID {item.cablename}</p>
                </div>
                <ActiveBadge active={item.isActive} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingCableProviderId(item.id); setCableProviderForm(item); }}>Edit</Button>
                <Button size="icon" variant="outline" onClick={() => remove(`/api/admin/services/cable-providers/${item.id}`)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Cable Plans</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <Label>Provider</Label>
            <Select value={cablePlanForm.providerId} onValueChange={(providerId) => setCablePlanForm({ ...cablePlanForm, providerId })}>
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {cableProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan Name</Label>
            <Input value={cablePlanForm.name} onChange={(event) => setCablePlanForm({ ...cablePlanForm, name: event.target.value })} placeholder="Compact" />
          </div>
          <div>
            <Label>Plan ID</Label>
            <Input type="number" value={cablePlanForm.cableplan} onChange={(event) => setCablePlanForm({ ...cablePlanForm, cableplan: Number(event.target.value) })} />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" value={cablePlanForm.price} onChange={(event) => setCablePlanForm({ ...cablePlanForm, price: Number(event.target.value) })} />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={cablePlanForm.isActive} onChange={(event) => setCablePlanForm({ ...cablePlanForm, isActive: event.target.checked })} />
            Active
          </label>
        </div>
        <Button onClick={saveCablePlan} disabled={saving === "cable-plan"} className="mt-4 gap-2">
          {saving === "cable-plan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editingCablePlanId ? "Update Plan" : "Add Plan"}
        </Button>
        <div className="mt-5 overflow-hidden rounded-lg border">
          {cablePlans.map((item) => (
            <div key={item.id} className="grid grid-cols-6 items-center gap-3 border-b p-3 last:border-b-0">
              <div className="col-span-2 font-semibold">{item.name}</div>
              <div className="text-sm text-slate-600">{item.provider?.name || "Provider"}</div>
              <div className="text-sm text-slate-600">N{item.price.toLocaleString()}</div>
              <ActiveBadge active={item.isActive} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingCablePlanId(item.id); setCablePlanForm({ providerId: item.providerId, name: item.name, cableplan: item.cableplan, price: item.price, isActive: item.isActive }); }}>Edit</Button>
                <Button size="icon" variant="outline" onClick={() => remove(`/api/admin/services/cable-plans/${item.id}`)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Exam Checker</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <Label>API Name</Label>
            <Input value={examForm.examName} onChange={(event) => setExamForm({ ...examForm, examName: event.target.value.toUpperCase() })} placeholder="WAEC" />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input value={examForm.displayName} onChange={(event) => setExamForm({ ...examForm, displayName: event.target.value })} placeholder="WAEC Result Checker" />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" value={examForm.price} onChange={(event) => setExamForm({ ...examForm, price: Number(event.target.value) })} />
          </div>
          <div>
            <Label>Max Qty</Label>
            <Input type="number" value={examForm.maxQuantity} onChange={(event) => setExamForm({ ...examForm, maxQuantity: Number(event.target.value) })} />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={examForm.isActive} onChange={(event) => setExamForm({ ...examForm, isActive: event.target.checked })} />
            Active
          </label>
        </div>
        <Button onClick={saveExam} disabled={saving === "exam"} className="mt-4 gap-2">
          {saving === "exam" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editingExamId ? "Update Product" : "Add Product"}
        </Button>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {exams.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{item.displayName}</p>
                  <p className="text-sm text-slate-500">{item.examName} - N{item.price.toLocaleString()} - Max {item.maxQuantity}</p>
                </div>
                <ActiveBadge active={item.isActive} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingExamId(item.id); setExamForm(item); }}>Edit</Button>
                <Button size="icon" variant="outline" onClick={() => remove(`/api/admin/services/exams/${item.id}`)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
