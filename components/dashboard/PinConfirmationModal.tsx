"use client";

import React, { useState } from "react";
import { Lock, X, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

interface PinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void>;
  title: string;
  amount: number;
  recipient: string;
  itemDescription: string;
  loading: boolean;
}

export function PinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  amount,
  recipient,
  itemDescription,
  loading,
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06133a]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-[#d7e8ff] shadow-2xl p-6 text-[#06133a]">
        <div className="flex items-center justify-between pb-3 border-b border-[#eaf2ff]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#06133a]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#526079] hover:bg-[#f0f7ff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="my-4 p-3.5 rounded-xl bg-[#f8fbff] border border-[#d7e8ff] text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-[#526079]">Package:</span>
            <span className="font-bold text-[#06133a]">{itemDescription}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#526079]">Recipient:</span>
            <span className="font-bold font-mono text-[#06133a]">{recipient}</span>
          </div>
          <div className="pt-2 border-t border-[#eaf2ff] flex justify-between items-center">
            <span className="font-bold text-[#526079]">Total Charge:</span>
            <span className="text-base font-black text-[#008fef]">
              ₦{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* PIN Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#06133a] mb-1.5">
              Enter 6-Digit PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                className="w-full px-3 py-2 text-center text-lg tracking-[0.3em] font-bold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7fa5d8] hover:text-[#06133a]"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf2ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="flex-1 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
