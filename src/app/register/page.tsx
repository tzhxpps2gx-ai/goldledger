"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

type Step = "email" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep("verify");
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setError("Code falsch oder abgelaufen. Bitte erneut versuchen.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 animate-slide-up">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-slide-up">
            GoldLedger
          </h1>
          <p className="text-zinc-400 text-sm mt-2 animate-slide-up">
            Erstelle deinen Account
          </p>
        </div>

        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 shadow-2xl animate-slide-up">
          {step === "email" ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">
                Registrieren
              </h2>

              <button
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] mb-4"
              >
                <GoogleIcon />
                {googleLoading ? "Wird vorbereitet..." : "Mit Google registrieren"}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-bg-border" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">oder</span>
                <div className="flex-1 h-px bg-bg-border" />
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email-Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-bg-border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                    placeholder="trader@example.com"
                  />
                  <p className="text-[11px] text-zinc-500 mt-2">
                    Wir senden dir einen 6-stelligen Code an deine Email.
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? "Code wird gesendet..." : "Code senden"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-zinc-400">
                Bereits registriert?{" "}
                <Link
                  href="/login"
                  className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
                >
                  Anmelden
                </Link>
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 mb-4 transition"
              >
                ← Email ändern
              </button>

              <h2 className="text-xl font-semibold text-white mb-2">
                Code eingeben
              </h2>
              <p className="text-sm text-zinc-400 mb-6">
                Wir haben dir einen 6-stelligen Code an{" "}
                <span className="text-white font-medium">{email}</span> gesendet.
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    6-stelliger Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full px-4 py-4 bg-bg-elevated border border-bg-border rounded-xl text-white text-center text-2xl tracking-[0.5em] font-bold placeholder:text-zinc-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? "Prüfe..." : "Code bestätigen"}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition py-2"
                >
                  Code erneut senden
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
        fill="#FBBC04"
      />
      <path
        d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
        fill="#EA4335"
      />
    </svg>
  );
}
