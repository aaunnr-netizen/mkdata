"use client";

import React, { useState } from "react";
import { useDashboard } from "./DashboardContext";
import { X, Copy, Check, Building2, ShieldCheck, RefreshCw, AlertCircle, Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export function FundingModal() {
  const { isFundingOpen, closeFunding, reservedAccount, loadingAccount, user, generateAccount } = useDashboard();
  const [copied, setCopied] = useState(false);

  if (!isFundingOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06133a]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#d7e8ff] shadow-2xl p-6 text-[#06133a]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#eaf2ff]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#06133a]">Fund Your Wallet</h2>
              <p className="text-xs text-[#526079]">Automatic instant bank transfer</p>
            </div>
          </div>
          <button
            onClick={closeFunding}
            className="p-1.5 rounded-lg text-[#526079] hover:bg-[#f0f7ff] hover:text-[#06133a] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5">
          {loadingAccount ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#008fef]" />
              <p className="text-xs text-[#526079]">Generating your dedicated bank account...</p>
            </div>
          ) : reservedAccount ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[linear-gradient(135deg,#008fef_0%,#0060d0_100%)] text-white shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                      Bank Name
                    </span>
                    <h3 className="text-sm font-bold">{reservedAccount.bankName || "Commercial Bank"}</h3>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    24/7 Auto-Credit
                  </span>
                </div>

                <div className="mb-3">
                  <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                    Account Number
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-2xl font-black tracking-wider">
                      {reservedAccount.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(reservedAccount.accountNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#0060d0] text-xs font-bold shadow-sm hover:bg-white/90 active:scale-95 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#00a040]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20 flex justify-between items-center text-xs">
                  <span className="text-white/80">Beneficiary:</span>
                  <span className="font-semibold text-right">
                    {reservedAccount.accountName || user?.fullName || "MK DATA"}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-[#f5faff] border border-[#d7e8ff] text-xs text-[#526079] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#06133a] font-bold">
                  <ShieldCheck className="h-4 w-4 text-[#00a040]" />
                  <span>How to fund:</span>
                </div>
                <p>
                  1. Open your banking or fintech app and transfer any amount to the account above.
                </p>
                <p>
                  2. Your MK DATA balance will update automatically within 5 to 15 seconds.
                </p>
                <p>
                  3. Standard CBN/NIBSS electronic transfer fees apply. Zero hidden charges.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#f5faff] border border-[#d7e8ff] text-center space-y-3">
              <Building2 className="h-8 w-8 text-[#008fef] mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-[#06133a]">Dedicated Bank Account</h3>
                <p className="text-xs text-[#526079] mt-1 max-w-xs mx-auto">
                  Generate your dedicated virtual account number to fund your wallet automatically 24/7 via bank transfer.
                </p>
              </div>
              <button
                onClick={() => generateAccount("PALMPAY")}
                disabled={loadingAccount}
                className="w-full py-2.5 px-4 rounded-xl bg-[#008fef] text-white text-xs font-bold hover:bg-[#0060d0] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Generate Account Now
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#eaf2ff] flex items-center justify-end">
          <button
            onClick={closeFunding}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] hover:bg-[#eaf2ff] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
