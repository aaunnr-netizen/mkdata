"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import { Zap, Check, AlertCircle, Loader2, ArrowRight, ShieldCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface Provider {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
}

export default function DashboardElectricityPage() {
  const { user, refreshUser } = useDashboard();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amountStr, setAmountStr] = useState("2000");

  // Meter verification states
  const [verifying, setVerifying] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [verified, setVerified] = useState(false);

  // Modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionDetail | null>(null);
  const [generatedToken, setGeneratedToken] = useState("");

  useEffect(() => {
    fetch("/api/electricity/providers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProviders(data.data);
          if (data.data.length > 0) setSelectedProviderId(data.data[0].id);
        }
      })
      .catch(() => toast.error("Could not load electricity providers."))
      .finally(() => setLoadingProviders(false));
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const amount = Number(amountStr) || 0;

  const handleVerifyMeter = async () => {
    if (!meterNumber.trim() || meterNumber.length < 6) {
      toast.error("Please enter a valid meter number.");
      return;
    }
    if (!selectedProviderId) {
      toast.error("Please select an electricity disco provider.");
      return;
    }

    setVerifying(true);
    setVerified(false);
    setCustomerName("");

    try {
      const res = await fetch("/api/electricity/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          meterNumber: meterNumber.trim(),
          meterType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.name) {
        throw new Error(data.error || "Could not verify meter. Check number and disco.");
      }

      setCustomerName(data.data.name);
      setVerified(true);
      toast.success(`Meter verified: ${data.data.name}`);
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      toast.error("Please verify your meter number first.");
      return;
    }
    if (selectedProvider && (amount < selectedProvider.minAmount || amount > selectedProvider.maxAmount)) {
      toast.error(`Amount must be between ₦${selectedProvider.minAmount.toLocaleString()} and ₦${selectedProvider.maxAmount.toLocaleString()}.`);
      return;
    }
    if (Number(user?.balance || 0) < amount) {
      toast.error("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setPinModalOpen(true);
  };

  const handleConfirm = async (pin: string) => {
    if (!user || !selectedProvider) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/electricity/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user.phone,
          providerId: selectedProvider.id,
          meterNumber: meterNumber.trim(),
          meterType,
          amount,
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Electricity payment failed.");
      }

      const token = data.data?.token || data.transaction?.token || "";
      if (token) setGeneratedToken(token);

      toast.success("Electricity payment successful!");
      setPinModalOpen(false);
      await refreshUser();

      setReceiptTx({
        id: data.transaction?.id || String(Date.now()),
        reference: data.transaction?.reference || `MKD-${Date.now()}`,
        type: "ELECTRICITY",
        amount,
        status: data.transaction?.status || "SUCCESS",
        phone: meterNumber.trim(),
        description: `${selectedProvider.name} (${meterType.toUpperCase()}) - ${token ? `Token: ${token}` : ""}`,
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
            <div className="h-8 w-8 rounded-xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Electricity Bills</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Prepaid token generation and postpaid bill payment across all distribution companies.
          </p>
        </div>
      </div>

      <form onSubmit={handleInitiate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              1. Electricity Disco
            </label>
            {loadingProviders ? (
              <div className="py-4 text-xs text-[#526079] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#008fef]" />
                <span>Loading providers...</span>
              </div>
            ) : (
              <select
                value={selectedProviderId}
                onChange={(e) => {
                  setSelectedProviderId(e.target.value);
                  setVerified(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Meter Type & Meter Number */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a] mb-2">
                2. Meter Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMeterType("prepaid");
                    setVerified(false);
                  }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    meterType === "prepaid"
                      ? "bg-[#008fef] text-white border-[#008fef] shadow-xs"
                      : "bg-[#f8fbff] text-[#526079] border-[#cfe2fb] hover:bg-white"
                  }`}
                >
                  Prepaid (Token)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMeterType("postpaid");
                    setVerified(false);
                  }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    meterType === "postpaid"
                      ? "bg-[#008fef] text-white border-[#008fef] shadow-xs"
                      : "bg-[#f8fbff] text-[#526079] border-[#cfe2fb] hover:bg-white"
                  }`}
                >
                  Postpaid (Bill)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a] mb-1.5">
                3. Meter Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={meterNumber}
                  onChange={(e) => {
                    setMeterNumber(e.target.value.replace(/\D/g, ""));
                    setVerified(false);
                  }}
                  placeholder="Enter 11 to 13-digit meter number"
                  className="flex-1 px-4 py-2.5 text-sm font-mono rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleVerifyMeter}
                  disabled={verifying || meterNumber.length < 6}
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
                4. Purchase Amount (₦)
              </label>
              <input
                type="text"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
                placeholder="2000"
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#06133a] tracking-tight pb-3 border-b border-[#eaf2ff]">
              Payment Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Provider:</span>
                <span className="font-bold text-[#06133a] truncate max-w-[150px]">
                  {selectedProvider?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Type:</span>
                <span className="font-bold text-[#06133a] uppercase">{meterType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Meter:</span>
                <span className="font-mono font-bold text-[#06133a]">
                  {meterNumber || "—"}
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
                  ₦{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!verified || amount < 100}
              className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Authorize Payment
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#526079]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a040]" />
              <span>Instant Token Generation</span>
            </div>
          </div>
        </div>
      </form>

      <PinConfirmationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirm}
        title="Authorize Electricity Payment"
        amount={amount}
        recipient={meterNumber}
        itemDescription={`${selectedProvider?.name || ""} (${meterType.toUpperCase()})`}
        loading={submitting}
      />

      <TransactionReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
