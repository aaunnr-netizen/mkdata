"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Webhook,
  Send,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  Radio,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  events: string[];
  failureCount: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  responseCode?: number | null;
  responseBody?: string | null;
  attempts: number;
  payload: any;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { id: "data.purchase.success", label: "data.purchase.success", desc: "Triggered on successful mobile data delivery" },
  { id: "data.purchase.failed", label: "data.purchase.failed", desc: "Triggered if data purchase fails and was refunded" },
  { id: "airtime.purchase.success", label: "airtime.purchase.success", desc: "Triggered on successful airtime top-up" },
  { id: "airtime.purchase.failed", label: "airtime.purchase.failed", desc: "Triggered if airtime purchase fails and was refunded" },
];

export default function DeveloperWebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [endpoint, setEndpoint] = useState<WebhookEndpoint | null>(null);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "data.purchase.success",
    "data.purchase.failed",
    "airtime.purchase.success",
    "airtime.purchase.failed",
  ]);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Deliveries
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const fetchEndpoint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/webhooks");
      if (!res.ok) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && data.endpoint) {
        setEndpoint(data.endpoint);
        setUrl(data.endpoint.url);
        if (Array.isArray(data.endpoint.events) && data.endpoint.events.length > 0) {
          setSelectedEvents(data.endpoint.events);
        }
      } else {
        setEndpoint(null);
      }
    } catch {
      // Endpoint simply not created yet - keep clean state
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const res = await fetch("/api/developer/webhooks/deliveries?limit=20");
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setDeliveries(data.data);
        }
      }
    } catch {
      // Silent fallback
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    fetchEndpoint();
    fetchDeliveries();
  }, []);

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    toast.success("Webhook signing secret copied to clipboard!");
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !url.startsWith("http")) {
      toast.error("Please enter a valid HTTPS or HTTP webhook endpoint URL.");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please subscribe to at least one webhook event.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          events: selectedEvents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save webhook settings.");
      }

      toast.success("Webhook endpoint updated successfully!");
      await fetchEndpoint();
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestWebhook = async () => {
    if (!endpoint || !endpoint.url) {
      toast.error("Save your webhook endpoint URL before sending a test ping.");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/v1/webhooks/test", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Webhook test failed with HTTP ${res.status}`);
      }

      toast.success(
        `Webhook test delivered! Target returned HTTP ${data.statusCode} in ${data.durationMs}ms.`
      );
      await fetchDeliveries();
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setTesting(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== eventId));
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
              <Webhook className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-[#06133a] tracking-tight">Webhooks Console</h2>
          </div>
          <p className="mt-1 text-xs text-[#526079]">
            Receive real-time signed HTTP POST notifications whenever asynchronous transactions resolve.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/docs#webhooks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-xs font-bold text-[#06133a] hover:bg-[#eaf4ff] transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#008fef]" />
            Docs & HMAC
          </Link>

          <button
            type="button"
            onClick={handleSendTestWebhook}
            disabled={testing || !endpoint?.url}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] active:scale-95 transition-all disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dispatching Test...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send Test Webhook
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveWebhook} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs space-y-5">
          {/* Endpoint URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              Endpoint URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/mkdata"
              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] outline-none transition focus:border-[#008fef] focus:bg-white"
            />
            <p className="text-[11px] text-[#526079]">
              Must be an publicly reachable HTTPS URL that returns HTTP 200 within 5 seconds.
            </p>
          </div>

          {/* Signing Secret Box */}
          {endpoint?.secret && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
                Webhook Signing Secret (HMAC-SHA256)
              </label>
              <div className="p-3.5 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#06133a] break-all">
                  {showSecret ? endpoint.secret : endpoint.secret.slice(0, 10) + "••••••••••••••••••••••••••••"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1.5 rounded-lg border border-[#cfe2fb] bg-white text-[#526079] hover:text-[#06133a]"
                  >
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(endpoint.secret)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#008fef] text-white text-xs font-bold shadow-2xs hover:bg-[#0060d0] flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#526079]">
                Verify payloads using the <code className="font-mono text-[#008fef]">X-MK-Signature: t=...,v1=...</code> header to ensure authenticity.
              </p>
            </div>
          )}

          {/* Event Subscriptions */}
          <div className="space-y-3 pt-2 border-t border-[#eaf2ff]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#06133a]">
              Subscribed Events
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_EVENTS.map((evt) => {
                const isChecked = selectedEvents.includes(evt.id);
                return (
                  <label
                    key={evt.id}
                    onClick={() => toggleEvent(evt.id)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? "border-[#008fef] bg-[#f0f7ff]/70"
                        : "border-[#eaf2ff] bg-[#f8fbff]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-[#008fef] focus:ring-[#008fef]"
                    />
                    <div>
                      <span className="block font-mono text-xs font-bold text-[#06133a]">
                        {evt.label}
                      </span>
                      <span className="text-[11px] text-[#526079]">{evt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#eaf2ff] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold shadow-sm hover:bg-[#0060d0] flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Webhook Configuration
            </button>
          </div>
        </div>
      </form>

      {/* Deliveries Audit Logs */}
      <div className="rounded-2xl bg-white border border-[#d7e8ff] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f8fbff] border-b border-[#eaf2ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#008fef]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#06133a]">
              Recent Webhook Deliveries
            </h3>
          </div>
          <button
            onClick={fetchDeliveries}
            className="p-1.5 rounded-lg border border-[#cfe2fb] bg-white text-[#526079] hover:text-[#06133a] hover:bg-[#f0f7ff] transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingDeliveries ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#526079]">
              <Loader2 className="h-5 w-5 animate-spin text-[#008fef]" />
              <span>Fetching delivery logs...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#526079]">
              No webhook deliveries recorded yet. Trigger transactions or send a test ping to see live logs.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[10px] font-bold text-[#526079] uppercase tracking-wider border-b border-[#eaf2ff]">
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">HTTP Response</th>
                  <th className="py-2.5 px-4">Attempts</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf2ff] text-xs">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f8fbff]/60">
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-[#06133a]">
                      {d.event}
                    </td>
                    <td className="py-3 px-4">
                      {d.status === "DELIVERED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          <CheckCircle2 className="h-3 w-3" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#526079]">
                      {d.responseCode ? (
                        <span
                          className={`font-bold ${
                            d.responseCode >= 200 && d.responseCode < 300
                              ? "text-[#059669]"
                              : "text-[#dc2626]"
                          }`}
                        >
                          HTTP {d.responseCode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#526079]">{d.attempts}</td>
                    <td className="py-3 px-4 text-right text-[11px] text-[#8aa0be]">
                      {new Date(d.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
