"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Smartphone } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/60 bg-white/86 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/logo.jpeg" 
              alt="MK Data" 
              className="h-9 w-9 rounded-xl object-cover shadow-sm"
            />
            <span className="hidden text-sm font-black text-[#07143d] sm:inline">
              MK DATA
            </span>
          </Link>

          <div className="hidden items-center gap-10 rounded-full border border-[#d7e8ff] bg-white/80 px-5 py-2 shadow-sm md:flex">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "How it works", href: "#howitworks" },
              { label: "FAQ", href: "#faq" }
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[#526079] transition-colors duration-200 hover:text-[#008fef]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-[#008fef] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,143,239,0.24)] transition-colors duration-200 hover:bg-[#0060d0]"
            >
              <Smartphone className="h-4 w-4" />
              Open App
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="-mr-2 flex items-center justify-center rounded-xl border border-[#d7e8ff] bg-white p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-[#07143d]" />
            ) : (
              <Menu className="h-5 w-5 text-[#07143d]" />
            )}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-[#d7e8ff] bg-white md:hidden">
            <div className="flex flex-col space-y-1 py-3">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How it works", href: "#howitworks" },
                { label: "FAQ", href: "#faq" }
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[#526079] transition-colors duration-200 hover:bg-[#f0f7ff] hover:text-[#008fef]"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 border-t border-[#d7e8ff] pt-3">
                <Link
                  href="/app"
                  className="block w-full rounded-xl bg-[#008fef] px-4 py-3 text-center text-sm font-black text-white"
                  onClick={closeMenu}
                >
                  Open App
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
