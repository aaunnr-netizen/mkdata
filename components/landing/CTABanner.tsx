"use client";

import Link from "next/link";

export function CTABanner() {
  return (
    <section className="relative bg-[#06133a] px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-lg bg-white">
          <img src="/logo.jpeg" alt="MK DATA" className="h-12 w-12 rounded-md object-cover" />
        </div>
        <h2 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          Ready to get started?
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/74">
          Join thousands of Nigerians who trust MK DATA for fast, affordable mobile data.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="rounded-lg bg-[#008fef] px-8 py-3 font-black text-white transition-colors hover:bg-[#159cff]"
          >
            Open App
          </Link>
          <a
            href="https://play.google.com/store/apps/details?id=com.mkdata"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/35 px-8 py-3 font-black text-white transition-colors hover:bg-white/10"
          >
            Get on Store
          </a>
        </div>
      </div>
    </section>
  );
}
