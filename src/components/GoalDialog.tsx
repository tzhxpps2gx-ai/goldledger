"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  type Goal,
  type GoalType,
  type PeriodType,
  GOAL_TYPE_LABELS,
  GOAL_TYPE_UNITS,
  PERIOD_LABELS,
  getCurrentPeriodBounds,
  getTodayBerlin,
} from "@/lib/goals";

type Account = { id: string; name: string; currency: string; is_active: boolean };

export default function GoalDialog({
  isOpen,
  onClose,
  onSaved,
  editGoal,
  accounts,
  defaultAccountId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editGoal: Goal | null;
  accounts: Account[];
  defaultAccountId: string;
}) {
  const supabase = createClient();

  const [goalType, setGoalType] = useState<GoalType>("net_pnl");
  const [targetValue, setTargetValue] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("daily");
  const [customStart, setCustomStart] = useState(getTodayBerlin());
  const [customEnd, setCustomEnd] = useState(getTodayBerlin());
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editGoal) {
      setGoalType(editGoal.goal_type);
      setTargetValue(String(editGoal.target_value));
      setPeriodType(editGoal.period_type);
      setCustomStart(editGoal.period_start);
      setCustomEnd(editGoal.period_end);
      setAccountId(editGoal.account_id ?? defaultAccountId);
    } else {
      setGoalType("net_pnl");
      setTargetValue("");
      setPeriodType("daily");
      setCustomStart(getTodayBerlin());
      setCustomEnd(getTodayBerlin());
      setAccountId(defaultAccountId);
    }
    setError(null);
  }, [isOpen, editGoal, defaultAccountId]);

  async function handleSave() {
    const parsed = parseFloat(targetValue.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      setError("Zielwert muss gr\u00f6\u00dfer als 0 sein.");
      return;
    }
    if (goalType === "win_rate" && parsed > 100) {
      setError("Win Rate kann nicht \u00fcber 100 % liegen.");
      return;
    }

    let start: string;
    let end: string;

    if (periodType === "custom") {
      if (!customStart || !customEnd || customStart > customEnd) {
        setError("Ung\u00fcltiger Zeitraum.");
        return;
      }
      start = customStart;
      end = customEnd;
    } else {
      const bounds = getCurrentPeriodBounds(periodType);
      start = bounds.start;
      end = bounds.end;
    }

    setSaving(true);
    setError(null);

    const payload = {
      goal_type: goalType,
      target_value: parsed,
      period_type: periodType,
      period_start: start,
      period_end: end,
      account_id: accountId || null,
      is_active: true,
    };

    let err;
    if (editGoal) {
      ({ error: err } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", editGoal.id));
    } else {
      ({ error: err } = await supabase.from("goals").insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  if (!isOpen) return null;

  const GOAL_TYPES: GoalType[] = ["net_pnl", "trade_count", "win_rate"];
  const PERIOD_TYPES: PeriodType[] = ["daily", "weekly", "monthly", "custom"];
  const activeAccount = accounts.find((a) => a.id === accountId);
  const currency = activeAccount?.currency ?? "EUR";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg-card border border-bg-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h2 className="text-base font-semibold text-white">
            {editGoal ? "Ziel bearbeiten" : "Neues Ziel"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-bg-elevated rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Zieltyp
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TYPES.map((gt) => (
                <button
                  key={gt}
                  onClick={() => setGoalType(gt)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-xs font-semibold transition border",
                    goalType === gt
                      ? "bg-gold-500/20 border-gold-500/50 text-gold-400"
                      : "bg-bg-elevated border-bg-border text-zinc-400 hover:text-white"
                  )}
                >
                  {GOAL_TYPE_LABELS[gt]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Zielwert
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={
                  goalType === "net_pnl"
                    ? "z. B. 500"
                    : goalType === "trade_count"
                    ? "z. B. 10"
                    : "z. B. 60"
                }
                className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-gold-500/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                {GOAL_TYPE_UNITS[goalType] === "\u20ac" ? currency : GOAL_TYPE_UNITS[goalType]}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Zeitraum
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PERIOD_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setPeriodType(pt)}
                  className={cn(
                    "px-2 py-2 rounded-xl text-xs font-semibold transition border",
                    periodType === pt
                      ? "bg-gold-500/20 border-gold-500/50 text-gold-400"
                      : "bg-bg-elevated border-bg-border text-zinc-400 hover:text-white"
                  )}
                >
                  {PERIOD_LABELS[pt]}
                </button>
              ))}
            </div>
          </div>

          {periodType === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Von
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Bis
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>
          )}

          {accounts.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                Konto
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-bg-elevated border border-bg-border text-zinc-400 hover:text-white text-sm font-medium rounded-xl transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {editGoal ? "Speichern" : "Ziel anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
