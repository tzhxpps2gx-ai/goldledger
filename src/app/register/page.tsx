"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 mb-4 shadow-lg shadow-gold-500/20">
            <span className="text-2xl font-bold text-bg">G</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            GoldLedger
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Erstelle deinen Account
          </p>
        </div>

        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            Registrieren
          </h2>

          {success ? (
            <div className="text-center py-6">
              <div className="text-success text-4xl mb-3">✓</div>
              <p className="text-white font-medium mb-2">
                Account erstellt!
              </p>
              <p className="text-zinc-400 text-sm">
                Bitte bestätige deine Email-Adresse. Du wirst gleich zur Anmeldung weitergeleitet.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-bg-border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                    placeholder="trader@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-bg-border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                    placeholder="Mind. 8 Zeichen"
                  />
                </div>

                {error && (
                  <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20"
                >
                  {loading ? "Registrieren..." : "Account erstellen"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-zinc-400">
                Bereits registriert?{" "}
                <Link
                  href="/login"
                  className="text-gold-400 hover:text-gold-300 font-medium transition"
                >
                  Anmelden
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
