"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Phone, User, Mail, ShieldCheck, ArrowRight, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form states
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.data?.id) {
            router.replace("/dashboard");
          } else {
            setCheckingAuth(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) setCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) {
      toast.error("Please provide both phone number and 6-digit PIN.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Check your credentials.");
      }

      toast.success(`Welcome back, ${data.user?.fullName || "Partner"}!`);
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim() || !pin.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (pin.length !== 6 || confirmPin.length !== 6) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }

    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }

    if (!acceptTerms) {
      toast.error("You must accept the terms of service to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          pin: pin.trim(),
          confirmPin: confirmPin.trim(),
          acceptTerms: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      toast.success("Account created successfully! Welcome to MK DATA.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(getFriendlyMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5faff]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#008fef]" />
          <p className="text-sm font-medium text-[#526079]">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f5faff] text-[#06133a]">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.jpeg"
            alt="MK DATA Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-sm font-black text-[#07143d] tracking-tight">MK DATA</span>
            <span className="text-[10px] font-semibold text-[#008fef] tracking-wider uppercase">
              Enterprise Portal
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526079] hover:text-[#008fef] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px] rounded-2xl border border-[#d7e8ff] bg-white/95 p-8 shadow-[0_20px_50px_rgba(7,20,61,0.06)] backdrop-blur-md">
          {/* Header Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-[#06133a] tracking-tight">
              {mode === "login" ? "Sign In to Dashboard" : "Create Developer Account"}
            </h1>
            <p className="mt-1.5 text-xs text-[#526079]">
              {mode === "login"
                ? "Access telecom vending, wallet funding, and developer APIs."
                : "Join MK DATA to integrate our high-speed telecom infrastructure."}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f0f7ff] p-1 mb-6 border border-[#e2edff]">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white text-[#008fef] shadow-sm"
                  : "text-[#526079] hover:text-[#06133a]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white text-[#008fef] shadow-sm"
                  : "text-[#526079] hover:text-[#06133a]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    maxLength={11}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#06133a]">
                    6-Digit Security PIN
                  </label>
                  <span className="text-[11px] text-[#526079]">Default auth PIN</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full pl-10 pr-11 py-2.5 text-sm tracking-widest rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7fa5d8] hover:text-[#06133a]"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-sm font-bold shadow-[0_10px_25px_rgba(0,143,239,0.25)] hover:bg-[#0060d0] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1">
                  Full Name / Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe or Acme Tech"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#06133a] mb-1">
                  Phone Number (Primary ID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7fa5d8]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    maxLength={11}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#06133a] mb-1">
                    6-Digit PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full px-3 py-2 text-sm tracking-widest rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#06133a] mb-1">
                    Confirm PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? "text" : "password"}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full px-3 py-2 text-sm tracking-widest rounded-xl border border-[#cfe2fb] bg-[#f8fbff] text-[#06133a] placeholder:text-[#9db7dc] outline-none transition focus:border-[#008fef] focus:bg-white focus:ring-2 focus:ring-[#008fef]/15"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 rounded border-[#cfe2fb] text-[#008fef] focus:ring-[#008fef]"
                />
                <label htmlFor="acceptTerms" className="text-[11px] text-[#526079] leading-tight">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#008fef] underline font-semibold">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#008fef] underline font-semibold">
                    Privacy Policy
                  </Link>.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#008fef] text-white text-sm font-bold shadow-[0_10px_25px_rgba(0,143,239,0.25)] hover:bg-[#0060d0] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mobile App Switch Link */}
          <div className="mt-4 pt-3 border-t border-[#eaf2ff] text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008fef] hover:underline"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Buying personal airtime or data? Open Mobile App
            </Link>
          </div>

          {/* Security Assurance */}
          <div className="mt-3 pt-3 border-t border-[#eaf2ff] flex items-center justify-center gap-2 text-xs text-[#526079]">
            <ShieldCheck className="h-4 w-4 text-[#00a040]" />
            <span>Bank-grade 256-bit SSL encryption</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-[#7fa5d8]">
        © {new Date().getFullYear()} MK DATA Enterprise Telecom. All rights reserved.
      </footer>
    </div>
  );
}
