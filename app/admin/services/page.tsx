"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Tv,
  X,
  Zap,
} from "lucide-react";
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
  plans?: CablePlan[];
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

const defaultElectricity = {
  name: "",
  discoName: 1,
  minAmount: 500,
  maxAmount: 50000,
  isActive: true,
};

const defaultCableProvider = {
  name: "",
  cablename: 1,
  isActive: true,
};

const defaultCablePlan = {
  providerId: "",
  name: "",
  cableplan: 1,
  price: 1000,
  isActive: true,
};

const defaultExam = {
  examName: "",
  displayName: "",
  price: 2000,
  maxQuantity: 5,
  isActive: true,
};

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || "Request failed");
  }
  return payload;
}

export default function ServicesAdminPage() {
  const [activeTab, setActiveTab] = useState<"electricity" | "cable" | "exam">("electricity");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search filters
  const [searchElectricity, setSearchElectricity] = useState("");
  const [searchCable, setSearchCable] = useState("");
  const [searchExam, setSearchExam] = useState("");

  // Data state
  const [electricity, setElectricity] = useState<ElectricityProvider[]>([]);
  const [electricityForm, setElectricityForm] = useState(defaultElectricity);
  const [editingElectricityId, setEditingElectricityId] = useState<string | null>(null);
  const [showElectricityModal, setShowElectricityModal] = useState(false);

  const [cableProviders, setCableProviders] = useState<CableProvider[]>([]);
  const [cableProviderForm, setCableProviderForm] = useState(defaultCableProvider);
  const [editingCableProviderId, setEditingCableProviderId] = useState<string | null>(null);
  const [showCableProviderModal, setShowCableProviderModal] = useState(false);

  const [cablePlans, setCablePlans] = useState<CablePlan[]>([]);
  const [cablePlanForm, setCablePlanForm] = useState(defaultCablePlan);
  const [editingCablePlanId, setEditingCablePlanId] = useState<string | null>(null);
  const [showCablePlanModal, setShowCablePlanModal] = useState(false);

  const [exams, setExams] = useState<ExamProduct[]>([]);
  const [examForm, setExamForm] = useState(defaultExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);

  const loadAll = async () => {
    setError(null);
    try {
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
    } catch (err: any) {
      setError(err.message || "Failed to load services catalog");
    }
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  const handleSyncAlrahuz = async () => {
    if (!window.confirm("Sync default Alrahuz DISCOs, cable TV plans, and exam products into the database?")) {
      return;
    }
    setSyncing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiRequest("/api/admin/services/sync", { method: "POST" });
      setSuccessMsg(`Catalog synced successfully! (${res.data?.electricityCount || 0} Discos, ${res.data?.cableProviderCount || 0} Cable Providers, ${res.data?.cablePlanCount || 0} Cable Plans, ${res.data?.examCount || 0} Exam Products)`);
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Catalog sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // --- CRUD Electricity ---
  const saveElectricity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("electricity");
    setError(null);
    try {
      await apiRequest(
        editingElectricityId
          ? `/api/admin/services/electricity/${editingElectricityId}`
          : "/api/admin/services/electricity",
        {
          method: editingElectricityId ? "PATCH" : "POST",
          body: JSON.stringify(electricityForm),
        }
      );
      setElectricityForm(defaultElectricity);
      setEditingElectricityId(null);
      setShowElectricityModal(false);
      await loadAll();
      setSuccessMsg("Electricity provider saved successfully.");
    } catch (err: any) {
      setError(err.message || "Could not save electricity provider");
    } finally {
      setSaving("");
    }
  };

  const toggleElectricityStatus = async (item: ElectricityProvider) => {
    try {
      await apiRequest(`/api/admin/services/electricity/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Could not update status");
    }
  };

  // --- CRUD Cable Provider ---
  const saveCableProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("cable-provider");
    setError(null);
    try {
      await apiRequest(
        editingCableProviderId
          ? `/api/admin/services/cable-providers/${editingCableProviderId}`
          : "/api/admin/services/cable-providers",
        {
          method: editingCableProviderId ? "PATCH" : "POST",
          body: JSON.stringify(cableProviderForm),
        }
      );
      setCableProviderForm(defaultCableProvider);
      setEditingCableProviderId(null);
      setShowCableProviderModal(false);
      await loadAll();
      setSuccessMsg("Cable provider saved successfully.");
    } catch (err: any) {
      setError(err.message || "Could not save cable provider");
    } finally {
      setSaving("");
    }
  };

  const toggleCableProviderStatus = async (item: CableProvider) => {
    try {
      await apiRequest(`/api/admin/services/cable-providers/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Could not update status");
    }
  };

  // --- CRUD Cable Plan ---
  const saveCablePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("cable-plan");
    setError(null);
    try {
      await apiRequest(
        editingCablePlanId
          ? `/api/admin/services/cable-plans/${editingCablePlanId}`
          : "/api/admin/services/cable-plans",
        {
          method: editingCablePlanId ? "PATCH" : "POST",
          body: JSON.stringify(cablePlanForm),
        }
      );
      setCablePlanForm(defaultCablePlan);
      setEditingCablePlanId(null);
      setShowCablePlanModal(false);
      await loadAll();
      setSuccessMsg("Cable plan saved successfully.");
    } catch (err: any) {
      setError(err.message || "Could not save cable plan");
    } finally {
      setSaving("");
    }
  };

  const toggleCablePlanStatus = async (item: CablePlan) => {
    try {
      await apiRequest(`/api/admin/services/cable-plans/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Could not update status");
    }
  };

  // --- CRUD Exam Product ---
  const saveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("exam");
    setError(null);
    try {
      await apiRequest(
        editingExamId
          ? `/api/admin/services/exams/${editingExamId}`
          : "/api/admin/services/exams",
        {
          method: editingExamId ? "PATCH" : "POST",
          body: JSON.stringify(examForm),
        }
      );
      setExamForm(defaultExam);
      setEditingExamId(null);
      setShowExamModal(false);
      await loadAll();
      setSuccessMsg("Exam product saved successfully.");
    } catch (err: any) {
      setError(err.message || "Could not save exam product");
    } finally {
      setSaving("");
    }
  };

  const toggleExamStatus = async (item: ExamProduct) => {
    try {
      await apiRequest(`/api/admin/services/exams/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Could not update status");
    }
  };

  // Generic remove helper
  const remove = async (path: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    setError(null);
    try {
      await apiRequest(path, { method: "DELETE" });
      await loadAll();
      setSuccessMsg(`Deleted "${itemName}" successfully.`);
    } catch (err: any) {
      setError(err.message || "Could not delete item");
    }
  };

  // Filtered lists
  const filteredElectricity = useMemo(() => {
    return electricity.filter(
      (item) =>
        item.name.toLowerCase().includes(searchElectricity.toLowerCase()) ||
        item.discoName.toString().includes(searchElectricity)
    );
  }, [electricity, searchElectricity]);

  const filteredCablePlans = useMemo(() => {
    return cablePlans.filter(
      (item) =>
        item.name.toLowerCase().includes(searchCable.toLowerCase()) ||
        item.provider?.name.toLowerCase().includes(searchCable.toLowerCase()) ||
        item.cableplan.toString().includes(searchCable)
    );
  }, [cablePlans, searchCable]);

  const filteredExams = useMemo(() => {
    return exams.filter(
      (item) =>
        item.displayName.toLowerCase().includes(searchExam.toLowerCase()) ||
        item.examName.toLowerCase().includes(searchExam.toLowerCase())
    );
  }, [exams, searchExam]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading services catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Services Catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage DISCO electricity providers, cable TV packages, and exam tokens powered by Alrahuz.
          </p>
        </div>
        <Button
          onClick={handleSyncAlrahuz}
          disabled={syncing}
          variant="outline"
          className="gap-2 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing Catalog..." : "Sync Alrahuz Defaults"}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="relative">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <button
            onClick={() => setError(null)}
            className="absolute right-3 top-3 text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {successMsg && (
        <Alert className="relative border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMsg}</AlertDescription>
          <button
            onClick={() => setSuccessMsg(null)}
            className="absolute right-3 top-3 text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("electricity")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "electricity"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Zap className="h-4 w-4" />
          Electricity DISCOs
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {electricity.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("cable")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "cable"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Tv className="h-4 w-4" />
          Cable TV
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {cablePlans.length} plans
          </span>
        </button>

        <button
          onClick={() => setActiveTab("exam")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "exam"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Exam Checker
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {exams.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ELECTRICITY DISCOS */}
      {activeTab === "electricity" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search DISCOs by name or ID..."
                value={searchElectricity}
                onChange={(e) => setSearchElectricity(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setEditingElectricityId(null);
                setElectricityForm(defaultElectricity);
                setShowElectricityModal(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add DISCO Provider
            </Button>
          </div>

          {/* Modal / Form */}
          {showElectricityModal && (
            <Card className="border-blue-200 bg-blue-50/30 p-5 shadow-sm">
              <form onSubmit={saveElectricity} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingElectricityId ? "Edit Electricity DISCO" : "Add New Electricity DISCO"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowElectricityModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <Label>Provider Name</Label>
                    <Input
                      required
                      value={electricityForm.name}
                      onChange={(e) => setElectricityForm({ ...electricityForm, name: e.target.value })}
                      placeholder="e.g. Ikeja Electric"
                    />
                  </div>
                  <div>
                    <Label>Alrahuz Disco ID</Label>
                    <Input
                      type="number"
                      required
                      value={electricityForm.discoName}
                      onChange={(e) => setElectricityForm({ ...electricityForm, discoName: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Min Amount (₦)</Label>
                    <Input
                      type="number"
                      required
                      value={electricityForm.minAmount}
                      onChange={(e) => setElectricityForm({ ...electricityForm, minAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Amount (₦)</Label>
                    <Input
                      type="number"
                      required
                      value={electricityForm.maxAmount}
                      onChange={(e) => setElectricityForm({ ...electricityForm, maxAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={electricityForm.isActive}
                      onChange={(e) => setElectricityForm({ ...electricityForm, isActive: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Active for Customers
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowElectricityModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving === "electricity"} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      {saving === "electricity" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {editingElectricityId ? "Update DISCO" : "Save DISCO"}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Table / Grid */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Disco ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Min / Max Limit</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredElectricity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No electricity DISCOs found. Click "Sync Alrahuz Defaults" or "Add DISCO Provider".
                      </td>
                    </tr>
                  ) : (
                    filteredElectricity.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">
                          <Badge variant="outline" className="font-mono">
                            ID: {item.discoName}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          ₦{item.minAmount.toLocaleString()} – ₦{item.maxAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleElectricityStatus(item)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                              item.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-green-600" : "bg-slate-400"}`} />
                            {item.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingElectricityId(item.id);
                                setElectricityForm(item);
                                setShowElectricityModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => remove(`/api/admin/services/electricity/${item.id}`, item.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: CABLE TV */}
      {activeTab === "cable" && (
        <div className="space-y-6">
          {/* Cable Providers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">1. Cable Providers</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingCableProviderId(null);
                  setCableProviderForm(defaultCableProvider);
                  setShowCableProviderModal(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Provider
              </Button>
            </div>

            {showCableProviderModal && (
              <Card className="border-blue-200 bg-blue-50/30 p-4 shadow-sm">
                <form onSubmit={saveCableProvider} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      {editingCableProviderId ? "Edit Cable Provider" : "Add Cable Provider"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCableProviderModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Provider Name</Label>
                      <Input
                        required
                        value={cableProviderForm.name}
                        onChange={(e) => setCableProviderForm({ ...cableProviderForm, name: e.target.value })}
                        placeholder="e.g. DSTV"
                      />
                    </div>
                    <div>
                      <Label>Provider ID (Alrahuz)</Label>
                      <Input
                        type="number"
                        required
                        value={cableProviderForm.cablename}
                        onChange={(e) => setCableProviderForm({ ...cableProviderForm, cablename: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cableProviderForm.isActive}
                        onChange={(e) => setCableProviderForm({ ...cableProviderForm, isActive: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowCableProviderModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={saving === "cable-provider"}>
                        {saving === "cable-provider" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Provider
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {cableProviders.map((provider) => (
                <Card key={provider.id} className="p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{provider.name}</p>
                      <p className="text-xs text-slate-500 font-mono">Provider ID: {provider.cablename}</p>
                    </div>
                    <button
                      onClick={() => toggleCableProviderStatus(provider)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        provider.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {provider.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-2 text-xs text-slate-500">
                    <span>{cablePlans.filter((p) => p.providerId === provider.id).length} packages</span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setEditingCableProviderId(provider.id);
                          setCableProviderForm(provider);
                          setShowCableProviderModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => remove(`/api/admin/services/cable-providers/${provider.id}`, provider.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cable Plans Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900">2. Cable TV Packages / Plans</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Filter plans..."
                    value={searchCable}
                    onChange={(e) => setSearchCable(e.target.value)}
                    className="h-9 pl-8 text-xs w-48 sm:w-64"
                  />
                </div>
                <Button
                  onClick={() => {
                    setEditingCablePlanId(null);
                    setCablePlanForm({
                      ...defaultCablePlan,
                      providerId: cableProviders[0]?.id || "",
                    });
                    setShowCablePlanModal(true);
                  }}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-9 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Plan
                </Button>
              </div>
            </div>

            {showCablePlanModal && (
              <Card className="border-blue-200 bg-blue-50/30 p-5 shadow-sm">
                <form onSubmit={saveCablePlan} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900">
                      {editingCablePlanId ? "Edit Cable Plan" : "Add Cable Plan"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCablePlanModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <Label>Provider</Label>
                      <Select
                        value={cablePlanForm.providerId}
                        onValueChange={(providerId) => setCablePlanForm({ ...cablePlanForm, providerId })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {cableProviders.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Plan Name</Label>
                      <Input
                        required
                        value={cablePlanForm.name}
                        onChange={(e) => setCablePlanForm({ ...cablePlanForm, name: e.target.value })}
                        placeholder="e.g. GOtv Max"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label>Alrahuz Plan ID</Label>
                      <Input
                        type="number"
                        required
                        value={cablePlanForm.cableplan}
                        onChange={(e) => setCablePlanForm({ ...cablePlanForm, cableplan: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label>Price (₦)</Label>
                      <Input
                        type="number"
                        required
                        value={cablePlanForm.price}
                        onChange={(e) => setCablePlanForm({ ...cablePlanForm, price: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cablePlanForm.isActive}
                        onChange={(e) => setCablePlanForm({ ...cablePlanForm, isActive: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      Active for Customers
                    </label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowCablePlanModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={saving === "cable-plan"} className="bg-blue-600 hover:bg-blue-700">
                        {saving === "cable-plan" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {editingCablePlanId ? "Update Plan" : "Save Plan"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Provider</th>
                      <th className="px-4 py-3 font-semibold">Plan Name</th>
                      <th className="px-4 py-3 font-semibold">Plan ID</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCablePlans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No cable plans found.
                        </td>
                      </tr>
                    ) : (
                      filteredCablePlans.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <Badge variant="secondary">{item.provider?.name || "Unknown"}</Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">ID: {item.cableplan}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">₦{item.price.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleCablePlanStatus(item)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                                item.isActive
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-green-600" : "bg-slate-400"}`} />
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCablePlanId(item.id);
                                  setCablePlanForm({
                                    providerId: item.providerId,
                                    name: item.name,
                                    cableplan: item.cableplan,
                                    price: item.price,
                                    isActive: item.isActive,
                                  });
                                  setShowCablePlanModal(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => remove(`/api/admin/services/cable-plans/${item.id}`, item.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: EXAM CHECKER */}
      {activeTab === "exam" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search exam tokens..."
                value={searchExam}
                onChange={(e) => setSearchExam(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setEditingExamId(null);
                setExamForm(defaultExam);
                setShowExamModal(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Exam Token Product
            </Button>
          </div>

          {showExamModal && (
            <Card className="border-blue-200 bg-blue-50/30 p-5 shadow-sm">
              <form onSubmit={saveExam} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900">
                    {editingExamId ? "Edit Exam Product" : "Add Exam Product"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <Label>API Exam Name</Label>
                    <Input
                      required
                      value={examForm.examName}
                      onChange={(e) => setExamForm({ ...examForm, examName: e.target.value.toUpperCase() })}
                      placeholder="e.g. WAEC, NECO"
                    />
                  </div>
                  <div>
                    <Label>Display Name</Label>
                    <Input
                      required
                      value={examForm.displayName}
                      onChange={(e) => setExamForm({ ...examForm, displayName: e.target.value })}
                      placeholder="e.g. WAEC Result Checker"
                    />
                  </div>
                  <div>
                    <Label>Price (₦)</Label>
                    <Input
                      type="number"
                      required
                      value={examForm.price}
                      onChange={(e) => setExamForm({ ...examForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Quantity per Purchase</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      required
                      value={examForm.maxQuantity}
                      onChange={(e) => setExamForm({ ...examForm, maxQuantity: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={examForm.isActive}
                      onChange={(e) => setExamForm({ ...examForm, isActive: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Active for Customers
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowExamModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving === "exam"} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      {saving === "exam" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {editingExamId ? "Update Product" : "Save Product"}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {exam.examName}
                    </Badge>
                    <button
                      onClick={() => toggleExamStatus(exam)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        exam.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {exam.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 text-base">{exam.displayName}</h3>
                  <p className="mt-1 text-2xl font-extrabold text-blue-600">₦{exam.price.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Max limit: {exam.maxQuantity} pins / order</p>
                </div>
                <div className="mt-5 flex gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingExamId(exam.id);
                      setExamForm(exam);
                      setShowExamModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => remove(`/api/admin/services/exams/${exam.id}`, exam.displayName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
