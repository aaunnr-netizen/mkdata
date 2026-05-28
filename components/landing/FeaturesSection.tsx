"use client";

import {
  Zap,
  CreditCard,
  Building2,
  Gift,
  Smartphone,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Data arrives instantly. No waiting, no delays.",
  },
  {
    icon: CreditCard,
    title: "Smart Wallet",
    description: "Fund once, buy anytime with your secure PIN.",
  },
  {
    icon: Building2,
    title: "Dedicated Account",
    description: "Personal bank account for seamless funding.",
  },
  {
    icon: Gift,
    title: "Earn Rewards",
    description: "Get rewarded just for using MK DATA.",
  },
  {
    icon: Smartphone,
    title: "App Experience",
    description: "Smooth, fast, beautiful app-like interface.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Secured by Flutterwave, 99.9% uptime.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#f5faff] px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase text-[#008fef]">Why MK DATA?</p>
          <h2 className="mb-4 text-4xl font-black text-[#06133a] sm:text-5xl">
            Why MK DATA?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#526079]">
            We&apos;ve built everything you need for the best data experience in Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="rounded-lg border border-[#d7e8ff] bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-[#008fef]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef7ff] text-[#008fef]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-black text-[#06133a]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#526079]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
