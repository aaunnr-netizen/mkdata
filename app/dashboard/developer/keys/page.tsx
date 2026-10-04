"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  Loader2,
  Power,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface ApiKeyInfo {
  id: string;
  prefix: string;
  maskedKey: string;
  status: "ACTIVE" | "REVOKED";
  name: string;
  lastUsedAt?: string | null;
  createdAt?: string;
}

export default function DeveloperKeysPage() {
  const { user, refreshUser } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<string>("NONE");
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestPlatform, setRequestPlatform] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeyData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/key");
      const data = await res.json();
      if (data.success) {
        setAccessStatus(data.apiAccessStatus || "NONE");
        setKeyInfo(data.apiKey);
      }
    } catch {
      toast.error("Could not load API key information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard!");
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim() || requestReason.length < 5) {
      toast.error("Please explain your platform or use case.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/developer/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: requestPlatform.trim() || "Web/Mobile App",
          reason: requestReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request.");
      }

      toast.success("Developer API access request submitted! Pending admin review.");
      setRequestModalOpen(false);
      setAccessStatus("PENDING");
      await refreshUser();
      await fetchKeyData();
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/developer/key", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to regenerate API key.");
      }

      setRevealedKey(data.apiKey);
      setShowKey(true);
      toast.success("New API key generated! Store it securely.");
      setRegenerateModalOpen(false);
      await fetchKeyData();
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleRevoke = async () => {
    if (!keyInfo) return;
    setActionLoading(true);
    try {
      const isRevoking = keyInfo.status === "ACTIVE";
      const res = await fetch("/api/developer/key", {
        method: isRevoking ? "DELETE" : "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update key status.");
      }

      toast.success(
        isRevoking ? "API key revoked. Requests will be blocked." : "API key re-enabled successfully."
      );
      await fetchKeyData();
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const displayedKeyString = revealedKey
    ? (showKey ? revealedKey : revealedKey.replace(/./g, "•"))
    : (keyInfo
      ? (showKey ? keyInfo.maskedKey : keyInfo.maskedKey.replace(/./g, "•"))
      : "No API Key");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <KeyRound className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Developer API Keys</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Secure programmatic access to automated mobile data vending, airtime, and balance requery.
          </p>
        </div>

        <Link
          href="/dashboard/docs"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5 text-[#008fef]" />
          View Documentation
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-[#526079]">
          <Loader2 className="h-6 w-6 animate-spin text-[#008fef]" />
          <span>Loading developer status...</span>
        </div>
      ) : accessStatus === "NONE" || accessStatus === "REJECTED" ? (
        /* State 1: Request Access */
        <div className="p-8 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#f0f7ff] border border-[#cfe2fb] flex items-center justify-center text-[#008fef]">
            <KeyRound className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-black text-[#06133a]">
              Enable Developer API Access
            </h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Integrate MK DATA into your web apps, mobile applications, bot systems, or VTU portals. Enjoy automated wholesale agent pricing, 99.9% uptime, and real-time webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#f8fbff] border border-[#eaf2ff] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#06133a]">
                <Sparkles className="h-4 w-4 text-[#008fef]" />
                <span>Agent Wholesale Rates</span>
              </div>
              <p className="text-[11px] text-[#526079]">All API purchases automatically receive wholesale tier prices.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fbff] border border-[#eaf2ff] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#06133a]">
                <Zap className="h-4 w-4 text-[#d97706]" />
                <span>Single Live Key</span>
              </div>
              <p className="text-[11px] text-[#526079]">Standardized <code className="font-mono text-[#008fef]">mk...</code> keys with zero environment complexity.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#f8fbff] border border-[#eaf2ff] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#06133a]">
                <ShieldCheck className="h-4 w-4 text-[#059669]" />
                <span>Safe Idempotency</span>
              </div>
              <p className="text-[11px] text-[#526079]">Double-charge protection via 24-hour request deduplication.</p>
            </div>
          </div>

          <button
            onClick={() => setRequestModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all inline-flex items-center gap-2"
          >
            Request API Access
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : accessStatus === "PENDING" ? (
        /* State 2: Request Pending */
        <div className="p-8 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#d97706]">
            <Clock className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-black text-[#06133a]">
              API Access Request Under Review
            </h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Your developer application has been submitted and is currently being reviewed by our administrative team. Once approved, your live <code className="font-mono text-[#008fef]">mk...</code> API key will automatically become active here.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-xs font-bold text-[#d97706]">
            <Clock className="h-3.5 w-3.5" />
            Status: Pending Approval
          </div>
        </div>
      ) : (
        /* State 3: Approved & Live Key Management */
        <div className="space-y-6">
          {/* Wholesale Pricing Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#065f46]">Agent Wholesale Rates Active</h4>
                <p className="text-[11px] text-[#047857]">
                  All requests authenticated with your API Key are automatically billed at wholesale Agent tier prices.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white text-[#059669] text-xs font-bold border border-[#a7f3d0] shadow-2xs">
              WHOLESALE TIER
            </span>
          </div>

          {/* Key Management Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#06133a]">
                  Production API Key
                </span>
                <p className="text-[11px] text-[#526079]">
                  Single live key used in Bearer authorization headers.
                </p>
              </div>

              {keyInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    keyInfo.status === "ACTIVE"
                      ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                      : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      keyInfo.status === "ACTIVE" ? "bg-[#059669]" : "bg-[#dc2626]"
                    }`}
                  />
                  {keyInfo.status}
                </span>
              )}
            </div>

            {/* Secret Box */}
            <div className="p-4 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-xs sm:text-sm font-bold text-[#06133a] break-all select-all">
                {displayedKeyString}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 rounded-lg border border-[#cfe2fb] bg-white text-[#526079] hover:text-[#06133a] hover:bg-[#f0f7ff] transition-colors"
                  title={showKey ? "Hide key" : "Reveal key"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleCopy(revealedKey || keyInfo?.maskedKey || "")}
                  className="px-3 py-2 rounded-lg bg-[#008fef] text-white text-xs font-bold shadow-2xs hover:bg-[#0060d0] flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Key
                </button>
              </div>
            </div>

            {revealedKey && (
              <div className="p-3.5 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#d97706] mt-0.5" />
                <span>
                  <strong>New Key Notice:</strong> Make sure to copy your raw key now. For your security, it will not be displayed unmasked again after you refresh this page.
                </span>
              </div>
            )}

            {/* Key Action Buttons */}
            <div className="pt-3 border-t border-[#eaf2ff] flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-[#526079]">
                {keyInfo?.lastUsedAt ? (
                  <span>Last used: {new Date(keyInfo.lastUsedAt).toLocaleString("en-GB")}</span>
                ) : (
                  <span>Never used yet</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {keyInfo && (
                  <button
                    onClick={handleToggleRevoke}
                    disabled={actionLoading}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      keyInfo.status === "ACTIVE"
                        ? "border-[#fecaca] bg-[#fff5f5] text-[#dc2626] hover:bg-[#fee2e2]"
                        : "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {keyInfo.status === "ACTIVE" ? "Revoke / Disable" : "Re-enable Key"}
                  </button>
                )}

                <button
                  onClick={() => setRegenerateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#008fef]" />
                  Regenerate Key
                </button>
              </div>
            </div>
          </div>

          {/* Quick Technical Reference Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#06133a]">
                API Base URL & Authorization
              </h4>
              <p className="text-xs text-[#526079]">Send your key via the standard HTTP Bearer header:</p>
              <pre className="p-2.5 rounded-xl bg-[#06133a] text-[#86e1fc] font-mono text-xs overflow-x-auto">
                Authorization: Bearer mk...
              </pre>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#06133a]">
                Safe Idempotency & Rate Limit
              </h4>
              <p className="text-xs text-[#526079]">60 requests/minute. Prevent double-billing on purchase retries:</p>
              <pre className="p-2.5 rounded-xl bg-[#06133a] text-[#86e1fc] font-mono text-xs overflow-x-auto">
                Idempotency-Key: &lt;unique-request-id&gt;
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06133a]/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#d7e8ff] shadow-2xl p-6 text-[#06133a] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eaf2ff]">
              <KeyRound className="h-5 w-5 text-[#008fef]" />
              <h3 className="text-sm font-black text-[#06133a]">Request Developer API Access</h3>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1">
                  Application or Company Name
                </label>
                <input
                  type="text"
                  required
                  value={requestPlatform}
                  onChange={(e) => setRequestPlatform(e.target.value)}
                  placeholder="e.g. Acme Telecom / My VTU Bot"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1">
                  Integration Use Case
                </label>
                <textarea
                  required
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Describe where and how you plan to integrate our data and airtime vending API..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  disabled={submittingRequest}
                  className="px-4 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingRequest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Key Confirmation Modal */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06133a]/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-[#d7e8ff] shadow-2xl p-6 text-[#06133a] space-y-4">
            <div className="flex items-center gap-2 text-[#dc2626]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-black text-[#06133a]">Regenerate API Key?</h3>
            </div>

            <p className="text-xs text-[#526079] leading-relaxed">
              Are you sure you want to regenerate your API key? Your current key will be immediately revoked, and any running services, webhooks, or apps using it will fail until updated.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRegenerateModalOpen(false)}
                disabled={regenerating}
                className="px-4 py-2 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={regenerating}
                className="px-4 py-2 rounded-xl bg-[#dc2626] text-white text-xs font-bold shadow-sm hover:bg-[#b91c1c] flex items-center gap-1.5 disabled:opacity-50"
              >
                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
