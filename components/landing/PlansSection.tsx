"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    size: "500MB",
    validity: "Weekly",
    price: 300,
    network: "MTN",
  },
  {
    size: "1GB",
    validity: "Weekly",
    price: 450,
    network: "All Networks",
    featured: true,
  },
  {
    size: "5GB",
    validity: "Monthly",
    price: 1500,
    network: "All Networks",
  },
  {
    size: "7GB",
    validity: "Monthly",
    price: 3500,
    network: "MTN",
  },
  {
    size: "20GB",
    validity: "Monthly",
    price: 7500,
    network: "All Networks",
  },
  {
    size: "75GB",
    validity: "Monthly",
    price: 18000,
    network: "All Networks",
  },
];

export function PlansSection() {
  return (
    <section id="pricing" className="relative bg-white px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase text-[#00a040]">Simple pricing</p>
          <h2 className="mb-4 text-4xl font-black text-[#06133a] sm:text-5xl">
            Pricing That Works For You
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#526079]">
            No hidden fees. No surprises. Just honest pricing for every network.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-lg border p-6 transition-all ${
                plan.featured
                  ? "border-[#008fef] bg-[#06133a] text-white shadow-[0_18px_40px_rgba(0,16,64,0.22)]"
                  : "border-[#d7e8ff] bg-[#f9fcff] text-[#06133a] hover:border-[#008fef]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-4 rounded-full bg-[#00a040] px-3 py-1 text-xs font-black text-white">
                  Best Value
                </div>
              )}

              <div className="mb-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    plan.featured ? "bg-white/12 text-white" : "bg-[#e7f5ff] text-[#0060d0]"
                  }`}
                >
                  {plan.network}
                </span>
              </div>

              <h3 className="mb-1 text-3xl font-black">{plan.size}</h3>
              <p className={`mb-6 text-sm font-semibold ${plan.featured ? "text-white/72" : "text-[#526079]"}`}>
                {plan.validity}
              </p>

              <div className="mb-6 text-4xl font-black">
                {"\u20a6"}{plan.price.toLocaleString()}
              </div>

              <div
                className="mb-8 space-y-3 border-y py-6"
                style={{
                  borderColor: plan.featured ? "rgba(255,255,255,0.14)" : "#d7e8ff",
                }}
              >
                {["Instant delivery", `Valid for ${plan.validity.toLowerCase()}`, "Best market rate"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="h-4 w-4 flex-shrink-0 text-[#00a040]" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                href={`/app?plan=${encodeURIComponent(plan.size)}`}
                className={`block w-full rounded-lg px-4 py-3 text-center font-black transition-colors ${
                  plan.featured
                    ? "bg-white text-[#06133a] hover:bg-[#eef7ff]"
                    : "bg-[#008fef] text-white hover:bg-[#0060d0]"
                }`}
              >
                Get {plan.size}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-[#526079]">
            All plans available in-app with more options
          </p>
          <Link
            href="/app"
            className="inline-block rounded-lg bg-[#06133a] px-8 py-3 font-black text-white transition-colors hover:bg-[#001040]"
          >
            View All Plans
          </Link>
        </div>
      </div>
    </section>
  );
}
