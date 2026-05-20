"use client";

import { AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  type Goal,
  type GoalProgress,
  type GoalStatus,
  PERIOD_LABELS,
  GOAL_TYPE_LABELS,
} from "@/lib/goals";

function formatValue(
  value: number,
  goalType: Goal["goal_type"],
  currency: string
): string {
  if (goalType === "net_pnl") return formatCurrency(value, currency);
  if (goalType === "trade_count") return Math.round(value) + " Trades";
  return value.toFixed(1) + " %";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

export default function GoalCard({
  goal,
  progress,
  status,
  currency,
  onEdit,
  onDelete,
  deleteConfirming,
  onDeleteConfirm,
  onDeleteCancel,
  deleting,
}: {
  goal: Goal;
  progress: GoalProgress;
  status: GoalStatus;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  deleteConfirming?: boolean;
  onDeleteConfirm?: () => void;
  onDeleteCancel?: () => void;
  deleting?: boolean;
}) {
  const achieved = status === "achieved";
  const missed = status === "missed";

  return (
    <div
      className={cn(
        "bg-bg-card border rounded-2xl p-4 flex flex-col gap-3 transition-all",
        achieved
          ? "border-gold-500/40 shadow-[0_0_28px_rgba(212,175,55,0.12)]"
          : missed
          ? "border-danger/20 bg-danger/[0.02]"
          : "border-bg-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                achieved
                  ? "bg-gold-500/20 text-gold-400"
                  : missed
                  ? "bg-danger/15 text-danger"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              {PERIOD_LABELS[goal.period_type]}
            </span>
            {achieved && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">
                Erreicht \u2713
              </span>
            )}
            {missed && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-danger/15 text-danger">
                Verfehlt
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white mt-1.5">
            {GOAL_TYPE_LABELS[goal.goal_type]}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {goal.period_start === goal.period_end
              ? formatDate(goal.period_start)
              : formatDate(goal.period_start) + " \u2013 " + formatDate(goal.period_end)}
          </p>
        </div>

        {!deleteConfirming && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-bg-elevated rounded-lg transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-zinc-500 hover:text-danger hover:bg-danger/10 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-end justify-between mb-1.5">
          <span
            className={cn(
              "text-lg font-bold",
              achieved ? "text-gold-400" : missed ? "text-danger/80" : "text-white"
            )}
          >
            {formatValue(progress.current, goal.goal_type, currency)}
          </span>
          <span className="text-xs text-zinc-500">
            Ziel: {formatValue(progress.target, goal.goal_type, currency)}
          </span>
        </div>

        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              achieved
                ? "bg-gradient-to-r from-gold-500 to-gold-400"
                : missed
                ? "bg-danger/60"
                : "bg-gradient-to-r from-gold-600 to-gold-500"
            )}
            style={{ width: Math.max(progress.percent, 2) + "%" }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">0</span>
          <span
            className={cn(
              "text-[10px] font-semibold",
              achieved ? "text-gold-400" : missed ? "text-danger/70" : "text-zinc-400"
            )}
          >
            {Math.round(progress.percent)}%
          </span>
        </div>
      </div>

      {deleteConfirming && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3 mt-1">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span className="text-xs text-danger flex-1">Ziel wirklich l\u00f6schen?</span>
          <button
            onClick={onDeleteConfirm}
            disabled={deleting}
            className="text-xs font-semibold text-danger hover:text-white bg-danger/20 hover:bg-danger/40 px-3 py-1 rounded-lg transition"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ja"}
          </button>
          <button
            onClick={onDeleteCancel}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg hover:bg-bg-elevated transition"
          >
            Nein
          </button>
        </div>
      )}
    </div>
  );
}
