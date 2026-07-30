"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#04102f] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="mb-6 flex items-center gap-3">
              <img src="/logo.jpeg" alt="MK DATA" className="h-9 w-9 rounded-lg object-cover" />
              <span className="text-sm font-black">MK DATA</span>
            </Link>
            <p className="text-sm text-white/62">
              Fast, reliable, affordable mobile data for Nigeria.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-white/58 transition-colors hover:text-white">Features</a></li>
              <li><a href="#pricing" className="text-sm text-white/58 transition-colors hover:text-white">Pricing</a></li>
              <li><a href="#howitworks" className="text-sm text-white/58 transition-colors hover:text-white">How it Works</a></li>
              <li><a href="#faq" className="text-sm text-white/58 transition-colors hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-white/58 transition-colors hover:text-white">About</Link></li>
              <li><Link href="/" className="text-sm text-white/58 transition-colors hover:text-white">Contact</Link></li>
              <li><Link href="/" className="text-sm text-white/58 transition-colors hover:text-white">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-white/58 transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/" className="text-sm text-white/58 transition-colors hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Contact Developer</span>
                <a
                  href="https://wa.me/2348034910470"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-black text-[#25b8ff] transition-colors hover:underline"
                >
                  WhatsApp Developer (+234 803 491 0470)
                </a>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Contact MK DATA</span>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="https://wa.me/2349066120642"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-black text-[#17d96f] transition-colors hover:underline"
                  >
                    WhatsApp Support
                  </a>
                  <span className="text-white/30">•</span>
                  <a
                    href="tel:+2349066120642"
                    className="inline-flex items-center gap-2 text-sm font-black text-white transition-colors hover:text-[#25b8ff] hover:underline"
                  >
                    Call +234 906 612 0642
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/54 sm:text-sm">Copyright {currentYear} MK DATA. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
