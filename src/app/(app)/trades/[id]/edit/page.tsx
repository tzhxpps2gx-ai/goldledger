"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calculateXauusdPnlEur,
  calculateRMultiple,
  calculatePlannedRR,
  fetchEurUsdRate,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const tradeId = params.id as string;

  const [accounts, setAccounts] = useState<any[]>([]);
  const [originalTrade, setOriginalTrade] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTrade, setLoadingTrade] = useState(true);
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
    async function load() {
      const [{ data: accs }, { data: trade }] = await Promise.all([
        supabase.from("accounts").select("*").eq("is_active", true),
        supabase.from("trades").select("*").eq("id", tradeId).single(),
      ]);
      if (accs) setAccounts(accs);
      if (trade) {
        setOriginalTrade(trade);
        setForm({
          account_id: trade.account_id ?? "",
          direction: (trade.direction as "long" | "short") ?? "long",
          setup: trade.setup ?? "",
          reasoning: trade.reasoning ?? "",
          planned_entry: trade.planned_entry?.toString() ?? "",
          planned_stop: trade.planned_stop?.toString() ?? "",
          planned_target: trade.planned_target?.toString() ?? "",
          lot_size: trade.lot_size?.toString() ?? "0.01",
          actual_entry: trade.actual_entry?.toString() ?? "",
          actual_exit: trade.actual_exit?.toString() ?? "",
          entry_time: trade.entry_time
            ? new Date(trade.entry_time).toISOString().slice(0, 16)
            : "",
          exit_time: trade.exit_time
            ? new Date(trade.exit_time).toISOString().slice(0, 16)
            : "",
          notes: trade.notes ?? "",
          status: (trade.status as any) ?? "closed",
        });
      }
      setLoadingTrade(false);
    }
    load();
  }, [tradeId]);

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

    let pnl: number | null = null;
    let rMultiple: number | null = null;
    let pnlPercent: number | null = null;
    let exchangeRate = Number(originalTrade?.exchange_rate ?? 1.0);

    if (form.status === "closed" && actualEntry && actualExit) {
      // Wenn Entry/Exit geändert → Kurs neu holen
      const entryChanged = actualEntry !== Number(originalTrade?.actual_entry ?? 0);
      const exitChanged = actualExit !== Number(originalTrade?.actual_exit ?? 0);
      if (entryChanged || exitChanged || !exchangeRate) {
        exchangeRate = await fetchEurUsdRate();
      }
      pnl = calculateXauusdPnlEur(actualEntry, actualExit, lotSize, form.direction, exchangeRate);

      if (plannedStop) {
        rMultiple = calculateRMultiple(actualEntry, plannedStop, actualExit, form.direction);
      }
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        pnlPercent = (pnl / Number(account.starting_balance)) * 100;
      }
    }

    const oldPnl = Number(originalTrade?.pnl_currency ?? 0);
    const newPnl = pnl ?? 0;
    const pnlDiff = newPnl - oldPnl;

    const { error: updateError } = await supabase
      .from("trades")
      .update({
        account_id: form.account_id,
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
        exchange_rate: exchangeRate,
        status: form.status,
        notes: form.notes || null,
      })
      .eq("id", tradeId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Konto-Saldo um die Differenz korrigieren
    if (pnlDiff !== 0) {
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        await supabase
          .from("accounts")
          .update({
            current_balance: Number(account.current_balance) + pnlDiff,
          })
          .eq("id", account.id);
      }
    }

    router.push(`/trades/${tradeId}`);
    router.refresh();
  }

  if (loadingTrade) {
    return <div className="text-zinc-400">Lade Trade...</div>;
  }

  if (!originalTrade) {
    return <div className="text-zinc-400">Trade nicht gefunden.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Trade bearbeiten
        </h1>
        <p className="text-zinc-400 text-sm mt-1">XAUUSD · in EUR</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
                  <option key={a.id} value={a.id}>{a.name}</option>
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
              >▲ LONG</button>
              <button
                type="button"
                onClick={() => update("direction", "short")}
                className={cn(
                  "py-3 rounded-xl font-semibold transition",
                  form.direction === "short"
                    ? "bg-danger/20 border border-danger/40 text-danger"
                    : "bg-bg-elevated border border-bg-border text-zinc-400"
                )}
              >▼ SHORT</button>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Pre-Trade Plan</h3>
          <div>
            <Label>Setup</Label>
            <input type="text" value={form.setup} onChange={(e) => update("setup", e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label>Begründung</Label>
            <textarea value={form.reasoning} onChange={(e) => update("reasoning", e.target.value)} rows={2} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Entry geplant</Label><input type="number" step="0.01" value={form.planned_entry} onChange={(e) => update("planned_entry", e.target.value)} className={inputCls} /></div>
            <div><Label>Stop</Label><input type="number" step="0.01" value={form.planned_stop} onChange={(e) => update("planned_stop", e.target.value)} className={inputCls} /></div>
            <div><Label>Target</Label><input type="number" step="0.01" value={form.planned_target} onChange={(e) => update("planned_target", e.target.value)} className={inputCls} /></div>
          </div>
          <div>
            <Label>Lot Size</Label>
            <input type="number" step="0.01" value={form.lot_size} onChange={(e) => update("lot_size", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Ausführung</h3>
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
            <div><Label>Tatsächlicher Entry</Label><input type="number" step="0.01" value={form.actual_entry} onChange={(e) => update("actual_entry", e.target.value)} className={inputCls} /></div>
            <div><Label>Exit</Label><input type="number" step="0.01" value={form.actual_exit} onChange={(e) => update("actual_exit", e.target.value)} className={inputCls} /></div>
            <div><Label>Entry-Zeit</Label><input type="datetime-local" value={form.entry_time} onChange={(e) => update("entry_time", e.target.value)} className={inputCls} /></div>
            <div><Label>Exit-Zeit</Label><input type="datetime-local" value={form.exit_time} onChange={(e) => update("exit_time", e.target.value)} className={inputCls} /></div>
          </div>
          <div>
            <Label>Notizen</Label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className={inputCls} />
          </div>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-bg-card border border-bg-border text-zinc-300 font-medium rounded-xl hover:bg-bg-elevated transition"
          >Abbrechen</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition disabled:opacity-50 shadow-md shadow-gold-500/20"
          >{loading ? "Speichern..." : "Änderungen speichern"}</button>
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
