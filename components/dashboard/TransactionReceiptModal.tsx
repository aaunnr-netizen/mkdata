"use client";

import React, { useRef } from "react";
import { X, Printer, CheckCircle2, Clock, XCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

export interface TransactionDetail {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  phone?: string;
  description?: string;
  createdAt: string;
}

interface TransactionReceiptModalProps {
  transaction: TransactionDetail | null;
  onClose: () => void;
}

export function TransactionReceiptModal({
  transaction,
  onClose,
}: TransactionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSuccess =
    transaction.status?.toUpperCase() === "SUCCESS" ||
    transaction.status?.toUpperCase() === "SUCCESSFUL" ||
    transaction.status?.toUpperCase() === "COMPLETED";

  const isPending =
    transaction.status?.toUpperCase() === "PENDING" ||
    transaction.status?.toUpperCase() === "PROCESSING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06133a]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#d7e8ff] shadow-2xl p-6 text-[#06133a]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eaf2ff]">
          <span className="text-xs font-bold text-[#526079] uppercase tracking-wider">
            Transaction Receipt
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526079] hover:bg-[#f0f7ff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="py-6 space-y-5 text-center">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center gap-1">
            <img src="/logo.jpeg" alt="MK DATA" className="h-10 w-10 rounded-xl object-cover" />
            <h2 className="text-base font-black text-[#07143d] tracking-tight">MK DATA TELECOM</h2>
            <p className="text-[11px] text-[#526079]">Official Transaction Voucher</p>
          </div>

          {/* Amount and Status */}
          <div className="py-4 border-y border-[#eaf2ff] bg-[#f8fbff] rounded-xl">
            <span className="text-[11px] text-[#526079] font-medium uppercase tracking-wider">
              Amount Transacted
            </span>
            <div className="text-3xl font-black text-[#06133a] tracking-tight mt-0.5">
              ₦{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex justify-center">
              {isSuccess ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Successful
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                  <Clock className="h-3.5 w-3.5" />
                  Processing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                  <XCircle className="h-3.5 w-3.5" />
                  Failed
                </span>
              )}
            </div>
          </div>

          {/* Key Value Details */}
          <div className="space-y-2.5 text-xs text-left px-2">
            <div className="flex justify-between py-1 border-b border-[#f0f7ff]">
              <span className="text-[#526079]">Reference:</span>
              <span className="font-mono font-bold text-[#06133a]">{transaction.reference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f0f7ff]">
              <span className="text-[#526079]">Service:</span>
              <span className="font-bold text-[#06133a] uppercase">{transaction.type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f0f7ff]">
              <span className="text-[#526079]">Description:</span>
              <span className="font-semibold text-[#06133a] text-right max-w-[200px]">
                {transaction.description || transaction.phone || "Vending order"}
              </span>
            </div>
            {transaction.phone && (
              <div className="flex justify-between py-1 border-b border-[#f0f7ff]">
                <span className="text-[#526079]">Recipient:</span>
                <span className="font-bold font-mono text-[#06133a]">{transaction.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#526079]">Date & Time:</span>
              <span className="font-semibold text-[#06133a]">
                {new Date(transaction.createdAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#eaf2ff] flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="h-4 w-4 text-[#008fef]" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
