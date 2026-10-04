"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import { Tv, Check, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface CablePlan {
  id: string;
  name: string;
  price: number;
}

interface CableProvider {
  id: string;
  name: string;
  plans: CablePlan[];
}

export default function DashboardCablePage() {
  const { user, refreshUser } = useDashboard();
  const [providers, setProviders] = useState<CableProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [smartcardNumber, setSmartcardNumber] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [verified, setVerified] = useState(false);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    fetch("/api/cable/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProviders(data.data);
          if (data.data.length > 0) {
            setSelectedProviderId(data.data[0].id);
            if (data.data[0].plans?.length > 0) {
              setSelectedPlanId(data.data[0].plans[0].id);
            }
          }
        }
      })
      .catch(() => toast.error("Could not load cable providers."))
      .finally(() => setLoading(false));
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const activePlans = selectedProvider?.plans || [];
  const selectedPlan = activePlans.find((p) => p.id === selectedPlanId);
  const price = selectedPlan?.price || 0;

  const handleVerify = async () => {
    if (!smartcardNumber.trim() || smartcardNumber.length < 8) {
      toast.error("Please enter a valid 10-digit smartcard / IUC number.");
      return;
    }
    if (!selectedProvider) return;

    setVerifying(true);
    setVerified(false);
    setCustomerName("");

    try {
      const res = await fetch("/api/cable/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          smartcardNumber: smartcardNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.name) {
        throw new Error(data.error || "Could not verify smartcard number.");
      }

      setCustomerName(data.data.name);
      setVerified(true);
      toast.success(`Verified: ${data.data.name}`);
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      toast.error("Please verify the smartcard number first.");
      return;
    }
    if (!selectedPlan) {
      toast.error("Please select a cable package.");
      return;
    }
    if (Number(user?.balance || 0) < price) {
      toast.error("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setPinModalOpen(true);
  };

  const handleConfirm = async (pin: string) => {
    if (!user || !selectedPlan || !selectedProvider) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cable/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user.phone,
          providerId: selectedProvider.id,
          planId: selectedPlan.id,
          smartcardNumber: smartcardNumber.trim(),
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cable TV subscription failed.");
      }

      toast.success("Subscription activated successfully!");
      setPinModalOpen(false);
      await refreshUser();

      setReceiptTx({
        id: data.transaction?.id || String(Date.now()),
        reference: data.transaction?.reference || `MKD-${Date.now()}`,
        type: "CABLE",
        amount: price,
        status: data.transaction?.status || "SUCCESS",
        phone: smartcardNumber.trim(),
        description: `${selectedProvider.name} - ${selectedPlan.name}`,
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
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <Tv className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Cable TV Subscription</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Instant renewal and bouquet change for DStv, GOtv & StarTimes.
          </p>
        </div>
      </div>

      <form onSubmit={handleInitiate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              1. Select Provider
            </label>
            {loading ? (
              <div className="py-4 text-xs text-[#526079] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#008fef]" />
                <span>Loading providers...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {providers.map((p) => {
                  const isSelected = selectedProviderId === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setSelectedProviderId(p.id);
                        if (p.plans?.length > 0) setSelectedPlanId(p.plans[0].id);
                        setVerified(false);
                      }}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        isSelected
                          ? "border-[#008fef] bg-[#f0f7ff] text-[#008fef] shadow-xs ring-2 ring-[#008fef]/15"
                          : "border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] hover:bg-white"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a] mb-1.5">
                2. Smartcard / IUC Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={smartcardNumber}
                  onChange={(e) => {
                    setSmartcardNumber(e.target.value.replace(/\D/g, ""));
                    setVerified(false);
                  }}
                  placeholder="Enter 10 to 11-digit IUC number"
                  className="flex-1 px-4 py-2.5 text-sm font-mono rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || smartcardNumber.length < 8}
                  className="px-4 py-2.5 rounded-xl bg-[#06133a] text-white text-xs font-bold hover:bg-[#07143d] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                </button>
              </div>

              {verified && (
                <div className="mt-3 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#047857]">Customer Name: </span>
                    <strong className="text-[#065f46]">{customerName}</strong>
                  </div>
                  <Check className="h-4 w-4 text-[#059669]" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a] mb-1.5">
                3. Bouquet Package
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
              >
                {activePlans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} — ₦{Number(pl.price).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#06133a] tracking-tight pb-3 border-b border-[#eaf2ff]">
              Subscription Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Provider:</span>
                <span className="font-bold text-[#06133a]">{selectedProvider?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Package:</span>
                <span className="font-bold text-[#06133a] truncate max-w-[150px]">
                  {selectedPlan?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Smartcard:</span>
                <span className="font-mono font-bold text-[#06133a]">
                  {smartcardNumber || "—"}
                </span>
              </div>
              {verified && (
                <div className="flex justify-between text-[#047857]">
                  <span>Customer:</span>
                  <span className="font-bold truncate max-w-[150px]">{customerName}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#eaf2ff] flex justify-between items-center">
                <span className="text-xs font-bold text-[#06133a]">Total Charge:</span>
                <span className="text-xl font-black text-[#008fef]">
                  ₦{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!verified || !selectedPlan}
              className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Authorize Renewal
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#526079]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a040]" />
              <span>Instant IUC Activation</span>
            </div>
          </div>
        </div>
      </form>

      <PinConfirmationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirm}
        title="Authorize Cable TV Renewal"
        amount={price}
        recipient={smartcardNumber}
        itemDescription={`${selectedProvider?.name || ""} - ${selectedPlan?.name || ""}`}
        loading={submitting}
      />

      <TransactionReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
