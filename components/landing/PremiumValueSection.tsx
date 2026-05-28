"use client";

import { Zap, Lock, Award } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Data credits delivered in seconds. Most users receive data within 2-5 seconds.",
  },
  {
    icon: Award,
    title: "Best Prices Guaranteed",
    description: "We match or beat any competitor on all networks. Your money goes further with us.",
  },
  {
    icon: Lock,
    title: "Secure & Trusted",
    description: "Bank-grade security protects every transaction. Trusted by 50,000+ Nigerians.",
  },
];

export function PremiumValueSection() {
  return (
    <section className="bg-white px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase text-[#00a040]">Reliable service</p>
          <h2 className="mb-4 text-4xl font-black leading-tight text-[#06133a] sm:text-5xl">
            Why customers choose us
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#526079]">
            We&apos;ve built the fastest and most reliable data platform in Nigeria.
          </p>
        </div>

        <div className="mb-16 grid gap-5 md:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="rounded-lg border border-[#d7e8ff] bg-[#f8fcff] p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#06133a] text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mb-3 text-lg font-black text-[#06133a]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#526079]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#d7e8ff] pt-14">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { number: "50K+", label: "Users" },
              { number: "99.9%", label: "Uptime" },
              { number: "2sec", label: "Delivery" },
              { number: "\u20a6500M+", label: "Volume" },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-lg bg-[#eef7ff] p-5 text-center">
                <p className="mb-2 text-3xl font-black text-[#06133a] md:text-4xl">
                  {stat.number}
                </p>
                <p className="text-sm font-bold text-[#526079]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
