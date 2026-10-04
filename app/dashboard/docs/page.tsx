"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ExternalLink, ArrowRight } from "lucide-react";

export default function DashboardDocsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/docs");
  }, [router]);

  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-[#d7e8ff] shadow-xs text-center space-y-4">
      <div className="h-12 w-12 mx-auto rounded-xl bg-[#e7f5ff] text-[#008fef] flex items-center justify-center">
        <BookOpen className="h-6 w-6" />
      </div>
      <h2 className="text-base font-black text-[#06133a]">Redirecting to Documentation...</h2>
      <p className="text-xs text-[#526079]">
        The API documentation is hosted in a full-screen, dedicated portal for optimal readability and zero horizontal scroll.
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008fef] text-white text-xs font-bold hover:bg-[#0060d0] transition-colors"
      >
        Open Standalone Docs
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
