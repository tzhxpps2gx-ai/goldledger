import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  type Goal,
  type TradeLike,
  calculateGoalProgress,
  isGoalActive,
  PERIOD_LABELS,
  GOAL_TYPE_LABELS,
  PERIOD_SORT_ORDER,
} from "@/lib/goals";

function formatValue(
  value: number,
  goalType: Goal["goal_type"],
  currency: string
): string {
  if (goalType === "net_pnl") return formatCurrency(value, currency);
  if (goalType === "trade_count") return Math.round(value) + " T.";
  return value.toFixed(0) + "%";
}

export default function GoalsWidget({
  goals,
  trades,
  currency,
}: {
  goals: Goal[];
  trades: TradeLike[];
  currency: string;
}) {
  const active = [...goals]
    .filter(isGoalActive)
    .sort((a, b) => PERIOD_SORT_ORDER[a.period_type] - PERIOD_SORT_ORDER[b.period_type])
    .slice(0, 3);

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Ziele</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {active.length} {active.length === 1 ? "aktives Ziel" : "aktive Ziele"}
          </p>
        </div>
        <Link
          href="/goals"
          className="text-xs text-gold-400 hover:text-gold-300 font-medium transition"
        >
          Alle ansehen \u2192
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-zinc-500 mb-3">Noch keine aktiven Ziele.</p>
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300 transition"
          >
            Erstes Ziel setzen \u2192
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-bg-border">
          {active.map((goal) => {
            const p = calculateGoalProgress(goal, trades);
            return (
              <div key={goal.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">
                      {PERIOD_LABELS[goal.period_type]}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {GOAL_TYPE_LABELS[goal.goal_type]}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        p.achieved
                          ? "bg-gradient-to-r from-gold-500 to-gold-400"
                          : "bg-gradient-to-r from-gold-600/70 to-gold-500/70"
                      )}
                      style={{ width: Math.max(p.percent, 2) + "%" }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={cn(
                      "text-xs font-semibold",
                      p.achieved ? "text-gold-400" : "text-white"
                    )}
                  >
                    {formatValue(p.current, goal.goal_type, currency)}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    {Math.round(p.percent)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
