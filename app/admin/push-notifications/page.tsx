"use client";

import { useState } from "react";
import { Send, AlertCircle, CheckCircle2, Loader2, Phone, BellRing } from "lucide-react";
import { toast } from "sonner";

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both a title and a body.");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Push notification broadcasted successfully!");
        setLastResult({ success: true, message: data.message });
        setTitle("");
        setBody("");
      } else {
        toast.error(data.error || "Failed to send notification.");
        setLastResult({ success: false, message: data.error || "Failed to send notification." });
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while sending.");
      setLastResult({ success: false, message: "An unexpected error occurred." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BellRing className="text-blue-500 animate-pulse" size={24} />
            FCM Push Notifications
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Send real-time push notifications to all users who have registered their devices on the mobile app.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Compose Notification</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notification Title
              </label>
              <input
                type="text"
                placeholder="e.g. System Maintenance Update"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                required
                disabled={isSending}
              />
              <div className="flex justify-end text-xs text-slate-400 mt-1">
                {title.length}/50 characters (max recommended)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message Body
              </label>
              <textarea
                placeholder="Write your notice here..."
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 150))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none"
                required
                disabled={isSending}
              />
              <div className="flex justify-end text-xs text-slate-400 mt-1">
                {body.length}/150 characters (max recommended)
              </div>
            </div>

            {lastResult && (
              <div
                className={`p-4 rounded-xl border flex gap-3 items-start text-sm ${
                  lastResult.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-rose-50 border-rose-100 text-rose-800"
                }`}
              >
                {lastResult.success ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{lastResult.success ? "Success" : "Error occurred"}</p>
                  <p className="mt-0.5 opacity-90">{lastResult.message}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || !title.trim() || !body.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Broadcasting notification...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Broadcast Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live device preview panel */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-950 rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/18] flex flex-col relative">
            {/* Phone Speaker/Camera cutout */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
            </div>

            {/* Status bar */}
            <div className="h-10 pt-4 px-6 flex justify-between items-center text-[10px] font-semibold text-slate-400 select-none">
              <span>9:41</span>
              <div className="flex gap-1.5 items-center">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></span>
                <span className="w-3.5 h-2 bg-slate-400 rounded-xs"></span>
              </div>
            </div>

            {/* Simulated Wallpaper / Screen Content */}
            <div className="flex-1 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-4 relative flex flex-col justify-start">
              {/* Notification Banner */}
              <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 mt-4 transition-all duration-300 animate-bounce">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-white">MK</span>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-800">MK DATA</span>
                    <span className="text-[9px] text-slate-500">now</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-[12px] font-bold text-slate-900 truncate">
                    {title || "Notification Title"}
                  </h4>
                  <p className="text-[11px] text-slate-700 leading-normal line-clamp-3 break-words">
                    {body || "Your broadcast message will display here. Start typing in the form to preview how it looks."}
                  </p>
                </div>
              </div>

              {/* Lock screen helper info */}
              <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-slate-500 font-medium">
                Swipe up to unlock
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5">
            <Phone size={12} /> Live Android Lock Screen Preview
          </span>
        </div>
      </div>
    </div>
  );
}
