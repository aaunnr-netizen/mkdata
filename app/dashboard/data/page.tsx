"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import { Wifi, Phone, ShieldCheck, ArrowRight, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface PlanItem {
  id: string;
  name: string;
  network: string;
  type: string;
  size: string;
  validity: string;
  price: number;
  agent_price?: number;
}

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "bg-[#ffcc00] text-black", border: "border-[#ffcc00]" },
  { id: "airtel", name: "Airtel", color: "bg-[#e50000] text-white", border: "border-[#e50000]" },
  { id: "glo", name: "Glo", color: "bg-[#00a040] text-white", border: "border-[#00a040]" },
  { id: "9mobile", name: "9mobile", color: "bg-[#006000] text-white", border: "border-[#006000]" },
];

export default function DashboardDataPage() {
  const { user, refreshUser } = useDashboard();
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    setLoadingPlans(true);
    fetch(`/api/data/plans?network=${selectedNetwork}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.plans)) {
          setPlans(data.plans);
          if (data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id);
          }
        }
      })
      .catch(() => toast.error("Could not load data plans."))
      .finally(() => setLoadingPlans(false));
  }, [selectedNetwork]);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>(["ALL"]);
    plans.forEach((p) => {
      if (p.type) set.add(p.type.toUpperCase());
    });
    return Array.from(set);
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (selectedCategory === "ALL") return plans;
    return plans.filter((p) => (p.type || "").toUpperCase() === selectedCategory);
  }, [plans, selectedCategory]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Price determination: If agent tier, use agent_price if available and > 0
  const activePrice = useMemo(() => {
    if (!selectedPlan) return 0;
    if (user?.tier === "agent" && selectedPlan.agent_price && selectedPlan.agent_price > 0) {
      return selectedPlan.agent_price;
    }
    return selectedPlan.price;
  }, [selectedPlan, user?.tier]);

  const handleInitiatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error("Please select a data bundle.");
      return;
    }
    if (!recipientPhone.trim() || !/^0[0-9]{10}$/.test(recipientPhone.trim())) {
      toast.error("Please enter a valid 11-digit phone number starting with 0.");
      return;
    }
    if (Number(user?.balance || 0) < activePrice) {
      toast.error("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setPinModalOpen(true);
  };

  const handleConfirmPurchase = async (pin: string) => {
    if (!selectedPlan || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          buyerPhone: user.phone,
          recipientPhone: recipientPhone.trim(),
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Data purchase failed.");
      }

      toast.success("Data purchase successful!");
      setPinModalOpen(false);
      await refreshUser();

      setReceiptTx({
        id: data.transaction?.id || String(Date.now()),
        reference: data.transaction?.reference || `MKD-${Date.now()}`,
        type: "DATA",
        amount: activePrice,
        status: data.transaction?.status || "SUCCESS",
        phone: recipientPhone.trim(),
        description: `${selectedNetwork.toUpperCase()} ${selectedPlan.name} (${selectedPlan.size || ""})`,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <Wifi className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Buy Mobile Data</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Instant automated bundle delivery for SME, Gifting & Corporate plans.
          </p>
        </div>

        {user?.tier === "agent" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-bold text-[#059669]">
            <Sparkles className="h-3.5 w-3.5" />
            Wholesale Agent Rates Applied
          </div>
        )}
      </div>

      {/* Main Order Form */}
      <form onSubmit={handleInitiatePurchase} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Network Selection */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              1. Select Mobile Network
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NETWORKS.map((net) => {
                const isSelected = selectedNetwork === net.id;
                return (
                  <button
                    type="button"
                    key={net.id}
                    onClick={() => {
                      setSelectedNetwork(net.id);
                      setSelectedCategory("ALL");
                    }}
                    className={`p-3.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? "border-[#008fef] bg-[#f0f7ff] text-[#008fef] shadow-sm ring-2 ring-[#008fef]/15"
                        : "border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] hover:bg-white"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-xs ${net.color}`}>
                      {net.name.slice(0, 3)}
                    </span>
                    <span>{net.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Bundle Category & Plan Selection */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
                2. Select Data Bundle
              </label>
              {categories.length > 1 && (
                <div className="flex items-center gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        selectedCategory === cat
                          ? "bg-[#008fef] text-white shadow-xs"
                          : "bg-[#f0f7ff] text-[#526079] hover:text-[#06133a]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loadingPlans ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#526079]">
                <Loader2 className="h-5 w-5 animate-spin text-[#008fef]" />
                <span>Loading available data plans...</span>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#526079]">
                No data plans currently available for this category.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const itemPrice =
                    user?.tier === "agent" && plan.agent_price && plan.agent_price > 0
                      ? plan.agent_price
                      : plan.price;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-[#008fef] bg-[#f0f7ff] shadow-xs"
                          : "border-[#eaf2ff] bg-[#f8fbff] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[#008fef] bg-[#008fef] text-white"
                              : "border-[#cfe2fb] bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#06133a]">
                            {plan.name} {plan.size && `(${plan.size})`}
                          </p>
                          <p className="text-[10px] text-[#526079]">
                            {plan.type?.toUpperCase()} • {plan.validity || "30 Days"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#008fef]">
                          ₦{Number(itemPrice).toLocaleString()}
                        </span>
                        {user?.tier === "agent" && plan.agent_price && plan.agent_price < plan.price && (
                          <span className="block text-[10px] text-[#8aa0be] line-through">
                            ₦{Number(plan.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Recipient Phone Number */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              3. Recipient Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="08012345678"
                maxLength={11}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15 font-mono"
              />
            </div>
            <p className="text-[11px] text-[#526079]">
              Ensure the recipient number is registered on {selectedNetwork.toUpperCase()} to avoid failed delivery.
            </p>
          </div>
        </div>

        {/* Order Summary & Submit Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#06133a] tracking-tight pb-3 border-b border-[#eaf2ff]">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Network:</span>
                <span className="font-bold text-[#06133a] uppercase">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Bundle:</span>
                <span className="font-bold text-[#06133a] truncate max-w-[150px]">
                  {selectedPlan?.name || "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Validity:</span>
                <span className="font-semibold text-[#06133a]">
                  {selectedPlan?.validity || "30 Days"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Recipient:</span>
                <span className="font-mono font-bold text-[#06133a]">
                  {recipientPhone || "—"}
                </span>
              </div>

              <div className="pt-3 border-t border-[#eaf2ff] flex justify-between items-center">
                <span className="text-xs font-bold text-[#06133a]">Amount to Pay:</span>
                <span className="text-xl font-black text-[#008fef]">
                  ₦{activePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedPlan || recipientPhone.length !== 11}
              className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continue to PIN Authorization
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#526079]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a040]" />
              <span>Instant automated delivery</span>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation & Receipt Modals */}
      <PinConfirmationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirmPurchase}
        title="Authorize Data Purchase"
        amount={activePrice}
        recipient={recipientPhone}
        itemDescription={`${selectedNetwork.toUpperCase()} ${selectedPlan?.name || ""} (${selectedPlan?.size || ""})`}
        loading={submitting}
      />

      <TransactionReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
