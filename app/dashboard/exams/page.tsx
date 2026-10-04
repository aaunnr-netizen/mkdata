"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PinConfirmationModal } from "@/components/dashboard/PinConfirmationModal";
import { TransactionReceiptModal, TransactionDetail } from "@/components/dashboard/TransactionReceiptModal";
import { GraduationCap, Check, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface ExamProduct {
  id: string;
  examName: string;
  displayName: string;
  price: number;
  maxQuantity: number;
}

export default function DashboardExamsPage() {
  const { user, refreshUser } = useDashboard();
  const [products, setProducts] = useState<ExamProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    fetch("/api/exam/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
          if (data.data.length > 0) setSelectedProductId(data.data[0].id);
        }
      })
      .catch(() => toast.error("Could not load exam products."))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalAmount = (selectedProduct?.price || 0) * quantity;

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select an exam product.");
      return;
    }
    if (Number(user?.balance || 0) < totalAmount) {
      toast.error("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setPinModalOpen(true);
  };

  const handleConfirm = async (pin: string) => {
    if (!user || !selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/exam/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user.phone,
          productId: selectedProduct.id,
          quantity,
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Exam pin purchase failed.");
      }

      toast.success("Exam PIN generated successfully!");
      setPinModalOpen(false);
      await refreshUser();

      setReceiptTx({
        id: data.transaction?.id || String(Date.now()),
        reference: data.transaction?.reference || `MKD-${Date.now()}`,
        type: "EXAM_PIN",
        amount: totalAmount,
        status: data.transaction?.status || "SUCCESS",
        phone: user.phone,
        description: `${selectedProduct.displayName} (${quantity} unit${quantity > 1 ? "s" : ""})`,
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
            <div className="h-8 w-8 rounded-xl bg-[#f0f7ff] text-[#008fef] flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Exam Scratch Cards & PINs</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Instant electronic scratch cards and registration tokens for WAEC, NECO, JAMB & NABTEB.
          </p>
        </div>
      </div>

      <form onSubmit={handleInitiate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              1. Select Examination Board
            </label>
            {loading ? (
              <div className="py-4 text-xs text-[#526079] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#008fef]" />
                <span>Loading examination products...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#008fef] bg-[#f0f7ff] shadow-xs ring-2 ring-[#008fef]/15"
                          : "border-[#cfe2fb] bg-[#f8fbff] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#06133a]">{p.displayName}</span>
                        <span className="text-xs font-black text-[#008fef]">
                          ₦{Number(p.price).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#526079]">Direct instant PIN delivery</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              2. Number of PINs
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`w-12 h-10 rounded-xl border font-bold text-xs transition-all ${
                    quantity === q
                      ? "bg-[#008fef] text-white border-[#008fef] shadow-xs"
                      : "bg-[#f8fbff] text-[#06133a] border-[#cfe2fb] hover:bg-white"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#06133a] tracking-tight pb-3 border-b border-[#eaf2ff]">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Exam:</span>
                <span className="font-bold text-[#06133a] truncate max-w-[150px]">
                  {selectedProduct?.displayName || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Unit Price:</span>
                <span className="font-bold text-[#06133a]">
                  ₦{Number(selectedProduct?.price || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526079]">Quantity:</span>
                <span className="font-bold text-[#06133a]">{quantity}</span>
              </div>

              <div className="pt-3 border-t border-[#eaf2ff] flex justify-between items-center">
                <span className="text-xs font-bold text-[#06133a]">Total Charge:</span>
                <span className="text-xl font-black text-[#008fef]">
                  ₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProduct}
              className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Authorize Purchase
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#526079]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a040]" />
              <span>Instant Examination Voucher</span>
            </div>
          </div>
        </div>
      </form>

      <PinConfirmationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirm}
        title="Authorize Exam PIN Purchase"
        amount={totalAmount}
        recipient={user?.phone || ""}
        itemDescription={`${selectedProduct?.displayName || ""} (${quantity} PIN${quantity > 1 ? "s" : ""})`}
        loading={submitting}
      />

      <TransactionReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
