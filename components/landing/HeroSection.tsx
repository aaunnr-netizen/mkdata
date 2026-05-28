"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#e7f5ff_0%,#ffffff_42%,#eafaf2_100%)] pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#008fef,#00a040,#0060d0)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center sm:px-8 lg:px-12">
        <div className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full border border-white bg-white/80 px-4 py-2 shadow-sm">
          <img src="/logo.jpeg" alt="MK DATA" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-xs font-black uppercase text-[#008fef]">Fast data for every network</span>
        </div>

        <h1 className="mx-auto mb-7 max-w-5xl text-5xl font-black leading-tight text-[#06133a] sm:text-6xl lg:text-7xl">
          Get data instantly.
          <br />
          <span className="text-[#008fef]">No waiting. No delays.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-[#526079] sm:text-lg">
          Buy mobile data for MTN, Glo, Airtel & 9Mobile at the best prices.
          Delivered in seconds with zero hassle.
        </p>

        <div className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["/mtn.jpg", "MTN"],
            ["/glo.jpg", "Glo"],
            ["/airtel.jpg", "Airtel"],
            ["/9mobile.jpg", "9Mobile"],
          ].map(([src, name]) => (
            <div key={name} className="flex items-center justify-center rounded-lg border border-[#d7e8ff] bg-white/85 px-4 py-3 shadow-sm">
              <img src={src} alt={name} className="h-8 max-w-20 object-contain" />
            </div>
          ))}
        </div>

        <div className="mb-12 grid gap-4 border-y border-[#d7e8ff] py-8 sm:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-[#06133a] sm:text-3xl">50K+</div>
            <div className="text-sm font-semibold text-[#526079]">Happy Customers</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-[#06133a] sm:text-3xl">1M+</div>
            <div className="text-sm font-semibold text-[#526079]">Transactions</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-[#06133a] sm:text-3xl">4.9 star</div>
            <div className="text-sm font-semibold text-[#526079]">Rated on Stores</div>
          </div>
        </div>

        <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008fef] px-8 py-3 font-black text-white shadow-[0_16px_34px_rgba(0,143,239,0.28)] transition-colors duration-200 hover:bg-[#0060d0]"
          >
            <Zap className="h-4 w-4" />
            Get Started
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#b9d9ff] bg-white px-8 py-3 font-black text-[#06133a] transition-colors duration-200 hover:bg-[#f0f7ff]"
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-[#526079]">
            <ShieldCheck className="h-4 w-4 text-[#00a040]" />
            Available on
          </p>
          <img
            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
            alt="Get it on Google Play"
            className="h-12"
          />
        </div>
      </div>
    </section>
  );
}
