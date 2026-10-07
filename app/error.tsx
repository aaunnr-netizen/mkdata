"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof reset === "function") {
      reset();
    } else if (typeof unstable_retry === "function") {
      unstable_retry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#d7e8ff] shadow-xl rounded-2xl p-6 sm:p-8 text-center text-[#06133a]">
        <div className="h-14 w-14 rounded-2xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center mx-auto mb-5 shadow-sm">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Something Went Wrong
        </h1>

        <p className="text-sm text-[#526079] mb-6 leading-relaxed">
          We encountered an unexpected error while preparing this page. Please try reloading or return to the main portal.
        </p>

        {error?.digest && (
          <div className="mb-6 p-2.5 rounded-lg bg-[#f0f4f9] text-[11px] font-mono text-[#526079] break-all select-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleRetry}
            className="w-full py-3 px-4 rounded-xl bg-[#008fef] hover:bg-[#007cd0] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>

          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-[#cfe2fb] bg-[#f8fbff] hover:bg-[#eaf4ff] text-[#008fef] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
