"use client";

import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Create Account",
    description: "Sign up with your phone number in under 60 seconds.",
  },
  {
    number: "2",
    title: "Fund Your Wallet",
    description: "Use your dedicated bank account number to top up.",
  },
  {
    number: "3",
    title: "Buy & Enjoy",
    description: "Select a plan, enter recipient, confirm with PIN.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="howitworks" className="relative bg-[#eaf6ff] px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase text-[#008fef]">Three steps</p>
          <h2 className="mb-4 text-4xl font-black text-[#06133a] sm:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#526079]">
            Simple and straightforward. Get data in just three steps.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="rounded-lg border border-white bg-white/85 p-8 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[#008fef] text-2xl font-black text-white">
                {step.number}
              </div>
              <h3 className="mb-3 text-xl font-black text-[#06133a]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#526079]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="mb-6 text-[#526079]">
            Get started in minutes. No complicated setup required.
          </p>
          <Link
            href="/app"
            className="inline-block rounded-lg bg-[#008fef] px-8 py-3 font-black text-white transition-colors hover:bg-[#0060d0]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
