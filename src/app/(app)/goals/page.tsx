"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  type Goal,
  type TradeLike,
  calculateGoalProgress,
  getGoalStatus,
  PERIOD_LABELS,
  GOAL_TYPE_LABELS,
  PERIOD_SORT_ORDER,
} from "@/lib/goals";
import GoalCard from "@/components/GoalCard";
import GoalDialog from "@/components/GoalDialog";
import { archiveExpiredGoalsAction } from "@/app/actions/goals";

type Account = { id: string; name: string; currency: string; is_active: boolean };

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatValue(value: number, goalType: Goal["goal_type"], currency: string): string {
  if (goalType === "net_pnl") return formatCurrency(value, currency);
  if (goalType === "trade_count") return Math.round(value) + " Trades";
  return value.toFixed(1) + " %";
}

export default function GoalsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [trades, setTrades] = useState<TradeLike[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [
      { data: goalsData },
      { data: tradesData },
      { data: accountsData },
    ] = await Promise.all([
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase.from("trades").select("account_id, pnl_currency, status, exit_time"),
      supabase.from("accounts").select("id, name, currency, is_active"),
    ]);
    setGoals((goalsData ?? []) as Goal[]);
    setTrades((tradesData ?? []) as TradeLike[]);
    setAccounts((accountsData ?? []) as Account[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    archiveExpiredGoalsAction().then(() => load());
  }, [load]);

  const activeGoals = [...goals]
    .filter((g) => g.is_active)
    .sort((a, b) => PERIOD_SORT_ORDER[a.period_type] - PERIOD_SORT_ORDER[b.period_type]);

  const pastGoals = [...goals]
    .filter((g) => !g.is_active)
    .sort((a, b) => b.period_end.localeCompare(a.period_end));

  const currency = accounts.find((a) => a.is_active)?.currency ?? "EUR";
  const defaultAccountId = accounts.find((a) => a.is_active)?.id ?? "";

  async function handleDelete(goalId: string) {
    setDeletingId(goalId);
    await supabase.from("goals").delete().eq("id", goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setPendingDeleteId(null);
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Ziele
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {activeGoals.length}{" "}
              {activeGoals.length === 1 ? "aktives Ziel" : "aktive Ziele"}
              {pastGoals.length > 0 && " \u00b7 " + pastGoals.length + " vergangen"}
            </p>
          </div>
          <button
            onClick={() => { setEditGoal(null); setDialogOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span className="hidden sm:inline">Neues Ziel</span>
          </button>
        </div>

        <section>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
            Aktive Ziele
          </h2>
          {activeGoals.length === 0 ? (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-10 text-center">
              <Target className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm mb-4">
                Noch keine aktiven Ziele. Setz dir dein erstes Ziel!
              </p>
              <button
                onClick={() => { setEditGoal(null); setDialogOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/40 text-gold-400 text-sm font-medium rounded-xl hover:bg-gold-500/30 transition"
              >
                <Plus className="w-4 h-4" />
                Erstes Ziel anlegen
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeGoals.map((goal) => {
                const progress = calculateGoalProgress(goal, trades);
                const status = getGoalStatus(goal, trades);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progress={progress}
                    status={status}
                    currency={currency}
                    onEdit={() => { setEditGoal(goal); setDialogOpen(true); }}
                    onDelete={() => setPendingDeleteId(goal.id)}
                    deleteConfirming={pendingDeleteId === goal.id}
                    onDeleteConfirm={() => handleDelete(goal.id)}
                    onDeleteCancel={() => setPendingDeleteId(null)}
                    deleting={deletingId === goal.id}
                  />
                );
              })}
            </div>
          )}
        </section>

        {pastGoals.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Vergangene Ziele
            </h2>
            <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-bg-border">
                {pastGoals.map((goal) => {
                  const progress = calculateGoalProgress(goal, trades);
                  const status = getGoalStatus(goal, trades);
                  const achieved = status === "achieved";
                  const missed = status === "missed";
                  return (
                    <div
                      key={goal.id}
                      className={cn("px-4 py-3 flex items-center gap-3", missed && "bg-danger/[0.03]")}
                    >
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", achieved ? "bg-gold-400" : "bg-danger/60")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-white truncate">{GOAL_TYPE_LABELS[goal.goal_type]}</span>
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider flex-shrink-0">{PERIOD_LABELS[goal.period_type]}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {goal.period_start === goal.period_end
                            ? formatDate(goal.period_start)
                            : formatDate(goal.period_start) + " - " + formatDate(goal.period_end)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={cn("text-sm font-semibold", achieved ? "text-gold-400" : "text-danger/80")}>
                          {formatValue(progress.current, goal.goal_type, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          Ziel: {formatValue(progress.target, goal.goal_type, currency)}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-block",
                        achieved ? "bg-gold-500/20 text-gold-400" : "bg-danger/15 text-danger"
                      )}>
                        {achieved ? "Erreicht" : "Verfehlt"}
                      </span>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 text-zinc-600 hover:text-danger hover:bg-danger/10 rounded-lg transition flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      <GoalDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        editGoal={editGoal}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
      />
    </>
  );
}
