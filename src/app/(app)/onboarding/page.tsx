"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "Vantage Live",
    account_type: "live" as "live" | "demo" | "prop",
    currency: "EUR" as "EUR" | "USD" | "GBP",
    starting_balance: "10000",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Nicht eingeloggt");
      setLoading(false);
      return;
    }

    const startingBalance = parseFloat(form.starting_balance) || 0;

    const { error: insertError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: form.name,
      broker: "Vantage",
      account_type: form.account_type,
      currency: form.currency,
      starting_balance: startingBalance,
      current_balance: startingBalance,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Standard-Tags für Fehleranalyse anlegen
    const defaultTags = [
      { name: "FOMO Entry", category: "mistake", color: "#EF4444" },
      { name: "Revenge Trade", category: "mistake", color: "#EF4444" },
      { name: "Stop verschoben", category: "mistake", color: "#EF4444" },
      { name: "Zu früh ausgestiegen", category: "mistake", color: "#F59E0B" },
      { name: "Gegen Plan", category: "mistake", color: "#EF4444" },
      { name: "Breakout", category: "setup", color: "#10B981" },
      { name: "Liquidity Sweep", category: "setup", color: "#10B981" },
      { name: "FVG", category: "setup", color: "#10B981" },
      { name: "Ruhig", category: "emotion", color: "#3B82F6" },
      { name: "Nervös", category: "emotion", color: "#F59E0B" },
    ];
    await supabase.from("tags").insert(
      defaultTags.map((t) => ({ ...t, user_id: user.id }))
    );

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 mb-4 shadow-lg shadow-gold-500/20">
          <span className="text-2xl font-bold text-bg">G</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Willkommen bei GoldLedger
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Lege dein erstes Trading-Konto an
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-card border border-bg-border rounded-2xl p-6 space-y-4">
        <div>
          <Label>Konto-Name</Label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className={inputCls}
          />
        </div>

        <div>
          <Label>Konto-Typ</Label>
          <select
            value={form.account_type}
            onChange={(e) => setForm({ ...form, account_type: e.target.value as any })}
            className={inputCls}
          >
            <option value="live">Live</option>
            <option value="demo">Demo</option>
            <option value="prop">Prop-Firm</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Währung</Label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
              className={inputCls}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <Label>Startguthaben</Label>
            <input
              type="number"
              step="0.01"
              value={form.starting_balance}
              onChange={(e) => setForm({ ...form, starting_balance: e.target.value })}
              required
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition disabled:opacity-50 shadow-md shadow-gold-500/20"
        >
          {loading ? "Erstelle..." : "Konto anlegen & loslegen"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full mt-1.5 px-3 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
      {children}
    </label>
  );
}
