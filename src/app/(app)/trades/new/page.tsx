"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calculateXauusdPnl,
  calculateRMultiple,
  calculatePlannedRR,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";

export default function NewTradePage() {
  const router = useRouter();
  const supabase = createClient();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    account_id: "",
    direction: "long" as "long" | "short",
    setup: "",
    reasoning: "",
    planned_entry: "",
    planned_stop: "",
    planned_target: "",
    lot_size: "0.01",
    actual_entry: "",
    actual_exit: "",
    entry_time: "",
    exit_time: "",
    notes: "",
    status: "closed" as "planned" | "open" | "closed",
  });

  useEffect(() => {
    async function loadAccounts() {
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true);
      if (data && data.length > 0) {
        setAccounts(data);
        setForm((f) => ({ ...f, account_id: data[0].id }));
      }
    }
    loadAccounts();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const lotSize = parseFloat(form.lot_size) || 0.01;
    const plannedEntry = parseFloat(form.planned_entry) || null;
    const plannedStop = parseFloat(form.planned_stop) || null;
    const plannedTarget = parseFloat(form.planned_target) || null;
    const actualEntry = parseFloat(form.actual_entry) || null;
    const actualExit = parseFloat(form.actual_exit) || null;

    let plannedRR = null;
    if (plannedEntry && plannedStop && plannedTarget) {
      plannedRR = calculatePlannedRR(plannedEntry, plannedStop, plannedTarget, form.direction);
    }

    let pnl = null;
    let rMultiple = null;
    let pnlPercent = null;
    if (form.status === "closed" && actualEntry && actualExit) {
      pnl = calculateXauusdPnl(actualEntry, actualExit, lotSize, form.direction);
      if (plannedStop) {
        rMultiple = calculateRMultiple(actualEntry, plannedStop, actualExit, form.direction);
      }
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        pnlPercent = (pnl / Number(account.starting_balance)) * 100;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Nicht eingeloggt");
      setLoading(false);
      return;
    }

    const { data: newTrade, error: insertError } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        account_id: form.account_id,
        symbol: "XAUUSD",
        direction: form.direction,
        setup: form.setup || null,
        reasoning: form.reasoning || null,
        planned_entry: plannedEntry,
        planned_stop: plannedStop,
        planned_target: plannedTarget,
        planned_rr: plannedRR,
        lot_size: lotSize,
        actual_entry: actualEntry,
        actual_exit: actualExit,
        entry_time: form.entry_time || null,
        exit_time: form.exit_time || null,
        pnl_currency: pnl,
        pnl_percent: pnlPercent,
        r_multiple: rMultiple,
        status: form.status,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Konto-Saldo aktualisieren bei geschlossenem Trade
    if (form.status === "closed" && pnl !== null && pnl !== 0) {
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        await supabase
          .from("accounts")
          .update({
            current_balance: Number(account.current_balance) + pnl,
          })
          .eq("id", account.id);
      }
    }

    router.push(`/trades/${newTrade.id}`);
    router.refresh();
  }

  if (accounts.length === 0) {
    return <div className="text-zinc-400">Lade Konten...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Neuer Trade
        </h1>
        <p className="text-zinc-400 text-sm mt-1">XAUUSD · Vantage</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Konto + Direction */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
          {accounts.length > 1 && (
            <div>
              <Label>Konto</Label>
              <select
                value={form.account_id}
                onChange={(e) => update("account_id", e.target.value)}
                className="w-full mt-1.5 px-4 py-3 bg-bg-elevated border border-bg-border rounded-xl text-white focus:outline-none focus:border-gold-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Richtung</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => update("direction", "long")}
                className={cn(
                  "py-3 rounded-xl font-semibold transition",
                  form.direction === "long"
                    ? "bg-success/20 border border-success/40 text-success"
                    : "bg-bg-elevated border border-bg-border text-zinc-400"
                )}
              >
                ▲ LONG
              </button>
              <button
                type="button"
                onClick={() => update("direction", "short")}
                className={cn(
                  "py-3 rounded-xl font-semibold transition",
                  form.direction === "short"
                    ? "bg-danger/20 border border-danger/40 text-danger"
                    : "bg-bg-elevated border border-bg-border text-zinc-400"
                )}
              >
                ▼ SHORT
              </button>
            </div>
          </div>
        </div>

        {/* Pre-Trade Plan */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
              Pre-Trade Plan
            </h3>
          </div>
          <div>
            <Label>Setup</Label>
            <input
              type="text"
              value={form.setup}
              onChange={(e) => update("setup", e.target.value)}
              placeholder="z.B. Breakout, FVG, Liquidity Sweep"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Begründung</Label>
            <textarea
              value={form.reasoning}
              onChange={(e) => update("reasoning", e.target.value)}
              placeholder="Warum machst du diesen Trade?"
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Entry geplant</Label>
              <input
                type="number"
                step="0.01"
                value={form.planned_entry}
                onChange={(e) => update("planned_entry", e.target.value)}
                placeholder="2650.50"
                className={inputCls}
              />
            </div>
            <div>
              <Label>Stop</Label>
              <input
                type="number"
                step="0.01"
                value={form.planned_stop}
                onChange={(e) => update("planned_stop", e.target.value)}
                placeholder="2645.00"
                className={inputCls}
              />
            </div>
            <div>
              <Label>Target</Label>
              <input
                type="number"
                step="0.01"
                value={form.planned_target}
                onChange={(e) => update("planned_target", e.target.value)}
                placeholder="2660.00"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <Label>Lot Size</Label>
            <input
              type="number"
              step="0.01"
              value={form.lot_size}
              onChange={(e) => update("lot_size", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Post-Trade */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
              Ausführung
            </h3>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as any)}
              className="text-xs bg-bg-elevated border border-bg-border rounded-lg px-2 py-1 text-white"
            >
              <option value="planned">Geplant</option>
              <option value="open">Offen</option>
              <option value="closed">Geschlossen</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tatsächlicher Entry</Label>
              <input
                type="number"
                step="0.01"
                value={form.actual_entry}
                onChange={(e) => update("actual_entry", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Exit</Label>
              <input
                type="number"
                step="0.01"
                value={form.actual_exit}
                onChange={(e) => update("actual_exit", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Entry-Zeit</Label>
              <input
                type="datetime-local"
                value={form.entry_time}
                onChange={(e) => update("entry_time", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Exit-Zeit</Label>
              <input
                type="datetime-local"
                value={form.exit_time}
                onChange={(e) => update("exit_time", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <Label>Notizen</Label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Was lief gut? Fehler? Beobachtungen?"
              rows={3}
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-bg-card border border-bg-border text-zinc-300 font-medium rounded-xl hover:bg-bg-elevated transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition disabled:opacity-50 shadow-md shadow-gold-500/20"
          >
            {loading ? "Speichern..." : "Trade speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full mt-1.5 px-3 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
      {children}
    </label>
  );
}
