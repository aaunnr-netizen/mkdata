"use client";

import React, { useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import { PhoneCall, Phone, ShieldCheck, ArrowRight, Loader2, Sparkles, Percent, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";
import { detectNigerianNetwork } from "@/lib/nigerian-networks";

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "bg-[#ffcc00] text-black", discount: 2 },
  { id: "airtel", name: "Airtel", color: "bg-[#e50000] text-white", discount: 2 },
  { id: "glo", name: "Glo", color: "bg-[#00a040] text-white", discount: 3 },
  { id: "9mobile", name: "9mobile", color: "bg-[#006000] text-white", discount: 2 },
];

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export default function DashboardAirtimePage() {
  const { user, refreshUser } = useDashboard();
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  const [autoDetectedNetwork, setAutoDetectedNetwork] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(500);
  const [customAmountStr, setCustomAmountStr] = useState("500");

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionDetail | null>(null);

  const activeNetworkObj = NETWORKS.find((n) => n.id === selectedNetwork) || NETWORKS[0];
  const discountRate = user?.tier === "agent" ? activeNetworkObj.discount + 1 : activeNetworkObj.discount;
  const discountAmount = Math.round((amount * discountRate) / 100);
  const amountToPay = Math.max(0, amount - discountAmount);

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmountStr(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmountStr(raw);
    const parsed = Number(raw) || 0;
    setAmount(parsed);
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 11);
    setRecipientPhone(clean);

    const detected = detectNigerianNetwork(clean);
    if (detected) {
      setAutoDetectedNetwork(detected);
      setSelectedNetwork(detected);
    } else {
      setAutoDetectedNetwork(null);
    }
  };

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim() || !/^0[0-9]{10}$/.test(recipientPhone.trim())) {
      toast.error("Please enter a valid 11-digit phone number.");
      return;
    }
    if (amount < 50) {
      toast.error("Minimum airtime amount is ₦50.");
      return;
    }
    if (amount > 50000) {
      toast.error("Maximum airtime amount is ₦50,000.");
      return;
    }
    if (Number(user?.balance || 0) < amountToPay) {
      toast.error("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setPinModalOpen(true);
  };

  const handleConfirm = async (pin: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user.phone,
          recipientPhone: recipientPhone.trim(),
          network: selectedNetwork,
          amount,
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Airtime top-up failed.");
      }

      toast.success("Airtime top-up successful!");
      setPinModalOpen(false);
      await refreshUser();

      setReceiptTx({
        id: data.transaction?.id || String(Date.now()),
        reference: data.transaction?.reference || `MKD-${Date.now()}`,
        type: "AIRTIME",
        amount: amountToPay,
        status: data.transaction?.status || "SUCCESS",
        phone: recipientPhone.trim(),
        description: `${selectedNetwork.toUpperCase()} Airtime (₦${amount})`,
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
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
              <PhoneCall className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Buy Airtime</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Instant virtual top-up across all Nigerian networks with instant discounts.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0f7ff] border border-[#cfe2fb] text-xs font-bold text-[#008fef]">
          <Percent className="h-3.5 w-3.5" />
          <span>{discountRate}% Instant Discount</span>
        </div>
      </div>

      <form onSubmit={handleInitiate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Step 1: Recipient Phone */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
                1. Recipient Phone Number
              </label>
              {autoDetectedNetwork && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f7ff] border border-[#cfe2fb] text-[10px] font-bold text-[#008fef]">
                  <Smartphone className="h-3 w-3" />
                  Auto-detected: {autoDetectedNetwork.toUpperCase()}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="08012345678"
                maxLength={11}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
              />
            </div>
            <p className="text-[11px] text-[#526079]">
              Network is automatically recognized from the phone prefix. You can customize the network below if ported.
            </p>
          </div>

          {/* Step 2: Network Selection */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
                2. Confirm Mobile Network
              </label>
              <span className="text-[11px] font-bold text-[#008fef] uppercase tracking-wider">
                {selectedNetwork.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NETWORKS.map((net) => {
                const isSelected = selectedNetwork === net.id;
                return (
                  <button
                    type="button"
                    key={net.id}
                    onClick={() => setSelectedNetwork(net.id)}
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

          {/* Step 3: Amount Selection */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              3. Select Airtime Amount
            </label>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAmountSelect(val)}
                  className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all ${
                    amount === val
                      ? "bg-[#008fef] text-white border-[#008fef] shadow-xs"
                      : "bg-[#f8fbff] text-[#06133a] border-[#cfe2fb] hover:bg-white"
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div>
              <span className="block text-[11px] font-semibold text-[#526079] mb-1">
                Custom Amount (₦50 – ₦50,000)
              </span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-[#7fa5d8]">
                  ₦
                </span>
                <input
                  type="text"
                  required
                  value={customAmountStr}
                  onChange={handleCustomAmountChange}
                  placeholder="500"
                  className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#06133a] tracking-tight pb-3 border-b border-[#eaf2ff]">
              Airtime Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Network:</span>
                <span className="font-bold text-[#06133a] uppercase">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Airtime Value:</span>
                <span className="font-bold text-[#06133a]">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#059669]">
                <span>Discount ({discountRate}%):</span>
                <span className="font-bold">-₦{discountAmount.toLocaleString()}</span>
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
                  ₦{amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={amount < 50 || recipientPhone.length !== 11}
              className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continue to PIN Authorization
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#526079]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a040]" />
              <span>Instant VTU Top-Up Guarantee</span>
            </div>
          </div>
        </div>
      </form>

      <PinConfirmationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirm}
        title="Authorize Airtime Top-Up"
        amount={amountToPay}
        recipient={recipientPhone}
        itemDescription={`${selectedNetwork.toUpperCase()} Airtime (₦${amount})`}
        loading={submitting}
      />

      <TransactionReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
