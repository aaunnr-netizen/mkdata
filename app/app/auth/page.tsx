"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

type AuthMode = "login" | "signup";

const inputBase =
  "h-12 w-full rounded-lg border border-[#cfe2fb] bg-white px-4 text-[15px] text-[#06133a] shadow-sm outline-none transition focus:border-[#008fef] focus:ring-4 focus:ring-[#008fef]/12";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [savedPhone, setSavedPhone] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const res = await fetch(`/api/auth/me?${cacheBuster}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) {
          router.push("/app");
          return;
        }
      } catch {}
      finally {
        clearTimeout(timeout);
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("saved_phone");
        if (saved) {
          setSavedPhone(saved);
          setPhone(saved);
        }
      }
      setHasCheckedAuth(true);
    };
    checkAuth();
  }, [router]);

  const resetFormForMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setName("");
    setEmail("");
    setPhone(nextMode === "login" ? savedPhone : "");
    setPin("");
    setConfirmPin("");
    setAcceptTerms(false);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 11) {
      toast.error("Enter your 11-digit phone number to continue.");
      return;
    }
    if (pin.length !== 6) {
      toast.error("Enter your 6-digit PIN to sign in.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("saved_phone", phone);
        }
        toast.success("You are signed in.");
        router.push("/app");
      } else {
        const data = await res.json();
        toast.error(getFriendlyMessage(data.error, "We could not sign you in right now."));
      }
    } catch {
      toast.error("Connection is unstable right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      toast.error("Enter your full name to continue.");
      return;
    }
    if (!phone || phone.length !== 11) {
      toast.error("Enter your 11-digit phone number to continue.");
      return;
    }
    if (pin.length !== 6) {
      toast.error("Choose a 6-digit PIN for your account.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Those PIN entries do not match yet.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Accept the terms to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          pin,
          confirmPin,
          acceptTerms,
        }),
      });

      if (res.status === 409) {
        toast.error("That phone number already has an account. Please sign in instead.");
        setMode("login");
        setPhone(phone);
        return;
      }

      if (res.ok) {
        toast.success("Your account is ready.");
        router.push("/app");
      } else {
        const data = await res.json();
        toast.error(getFriendlyMessage(data.error, "We could not create your account right now."));
      }
    } catch {
      toast.error("Connection is unstable right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasCheckedAuth) {
    return <div className="min-h-screen bg-[#f5faff]" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#e7f5ff_0%,#ffffff_44%,#eafaf2_100%)] px-4 py-6 text-[#06133a] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full overflow-hidden rounded-lg border border-white bg-white/86 shadow-[0_24px_70px_rgba(0,16,64,0.14)] backdrop-blur-xl"
        >
          <div className="bg-[#06133a] p-6 text-white">
            <div>
              <img src="/logo.jpeg" alt="MK DATA" className="mb-5 h-16 w-16 rounded-lg bg-white object-cover p-1" />
              <p className="mb-3 text-xs font-black uppercase text-[#71c7ff]">MK Data account</p>
              <h1 className="mb-3 text-3xl font-black leading-tight">
                Fast access to data, airtime, wallet and rewards.
              </h1>
              <p className="text-sm leading-6 text-white/72">
                Sign in or create your account with your phone number and secure transaction PIN.
              </p>
            </div>

            <div className="mt-5 grid gap-2">
              {["Instant plan access", "Secure PIN checkout", "Rewards-ready wallet"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white/8 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00c76a]" />
                  <span className="text-sm font-bold text-white/88">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#008fef]">Welcome to</p>
                  <h1 className="text-2xl font-black text-[#06133a]">MK DATA</h1>
                </div>
              </div>
              <a href="/" className="text-sm font-black text-[#008fef] hover:text-[#0060d0]">
                Home
              </a>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-[#d7e8ff] bg-[#eef7ff] p-1">
              {[
                ["login", "Sign in"],
                ["signup", "Create account"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => resetFormForMode(value as AuthMode)}
                  className={`h-11 rounded-md text-sm font-black transition ${
                    mode === value
                      ? "bg-white text-[#008fef] shadow-sm"
                      : "text-[#526079] hover:text-[#06133a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="mb-2 text-3xl font-black text-[#06133a]">
                {mode === "login" ? "Sign in to your account" : "Get started in seconds"}
              </h2>
              <p className="text-sm leading-6 text-[#526079]">
                {mode === "login"
                  ? "Continue with your phone number and secure 6-digit PIN."
                  : "Create your MK DATA profile with the same secure PIN flow."}
              </p>
              {mode === "login" && savedPhone ? (
                <p className="mt-3 inline-flex rounded-full bg-[#eafaf2] px-3 py-1 text-xs font-bold text-[#00a040]">
                  Saved number restored
                </p>
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-[#526079]">Phone</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bc]" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={11}
                        placeholder="08012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className={`${inputBase} pl-11 font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-[#526079]">PIN</label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bc]" />
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="current-password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className={`${inputBase} px-11 text-center font-mono text-lg font-black tracking-[0.18em]`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((value) => !value)}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#008fef] hover:bg-[#eef7ff]"
                        aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#008fef] text-sm font-black text-white shadow-[0_14px_30px_rgba(0,143,239,0.24)] transition hover:bg-[#0060d0] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Signing in..." : "Sign in"}
                    {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSignup}
                  className="space-y-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase text-[#526079]">Name</label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bc]" />
                        <input
                          type="text"
                          autoComplete="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase text-[#526079]">Email</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bc]" />
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.trim())}
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase text-[#526079]">Phone</label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0bc]" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={11}
                          placeholder="08012345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          className={`${inputBase} pl-11 font-mono`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase text-[#526079]">PIN</label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="new-password"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className={`${inputBase} pr-11 text-center font-mono text-lg font-black tracking-[0.18em]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin((value) => !value)}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#008fef] hover:bg-[#eef7ff]"
                          aria-label={showPin ? "Hide PIN" : "Show PIN"}
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase text-[#526079]">Confirm</label>
                      <div className="relative">
                        <input
                          type={showConfirmPin ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="new-password"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className={`${inputBase} pr-11 text-center font-mono text-lg font-black tracking-[0.18em]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin((value) => !value)}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#008fef] hover:bg-[#eef7ff]"
                          aria-label={showConfirmPin ? "Hide confirm PIN" : "Show confirm PIN"}
                        >
                          {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d7e8ff] bg-[#f8fcff] p-3">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#cfe2fb] accent-[#008fef]"
                    />
                    <span className="text-sm leading-5 text-[#526079]">I agree to terms</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#00a040] text-sm font-black text-white shadow-[0_14px_30px_rgba(0,160,64,0.22)] transition hover:bg-[#008735] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Creating..." : "Create account"}
                    {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-7 text-center text-sm text-[#526079]">
              {mode === "login" ? "No account?" : "Have account?"}{" "}
              <button
                type="button"
                onClick={() => resetFormForMode(mode === "login" ? "signup" : "login")}
                className="font-black text-[#008fef] hover:text-[#0060d0]"
              >
                {mode === "login" ? "Create" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
