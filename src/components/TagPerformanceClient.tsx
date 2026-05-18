"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { TagStat } from "@/lib/tags";
import { ArrowUpDown } from "lucide-react";

type SortKey = "tradeCount" | "totalPnl" | "winRate" | "avgR";

const SORT_LABELS: Record<SortKey, string> = {
  tradeCount: "Trades",
  totalPnl: "P/L",
  winRate: "Win-Rate",
  avgR: "Ø R",
};

const CATEGORY_LABELS: Record<string, string> = {
  setup: "Setup",
  mistake: "Fehler",
  emotion: "Emotion",
  custom: "Sonstige",
};

export default function TagPerformanceClient({
  stats,
  currency,
}: {
  stats: TagStat[];
  currency: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("tradeCount");

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (sortKey === "avgR") {
        const aVal = a.avgR ?? -Infinity;
        const bVal = b.avgR ?? -Infinity;
        return bVal - aVal;
      }
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
  }, [stats, sortKey]);

  if (stats.length === 0) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-10 text-center">
        <p className="text-zinc-500 text-sm">
          Noch keine Tag-Daten vorhanden. Weise deinen Trades Tags zu, um hier Statistiken zu sehen.
        </p>
      </div>
    );
  }

  const maxAbsPnl = Math.max(...stats.map((s) => Math.abs(s.totalPnl)), 1);

  return (
    <div className="space-y-4">
      {/* Sortier-Leiste */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3" />
          Sortieren nach
        </span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              sortKey === key
                ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                : "bg-bg-card border border-bg-border text-zinc-400 hover:text-zinc-300"
            )}
          >
            {SORT_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Tag-Karten */}
      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-bg-border">
          {sorted.map((stat) => {
            const pnlPct = Math.abs(stat.totalPnl) / maxAbsPnl;
            const isPositive = stat.totalPnl >= 0;

            return (
              <div key={stat.id} className="p-4 space-y-3">
                {/* Header-Zeile */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {stat.name}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider hidden sm:block flex-shrink-0">
                      {CATEGORY_LABELS[stat.category] ?? stat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Trades</div>
                      <div className="text-sm font-medium text-white">{stat.tradeCount}</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Win-Rate</div>
                      <div className="text-sm font-medium text-white">{stat.winRate.toFixed(0)} %</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ø R</div>
                      <div className="text-sm font-medium text-white">
                        {stat.avgR != null ? stat.avgR.toFixed(2) + "R" : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">P/L</div>
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          isPositive ? "text-success" : "text-danger"
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(stat.totalPnl, currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* P/L-Balken */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isPositive ? "bg-success" : "bg-danger"
                    )}
                    style={{ width: (pnlPct * 100).toFixed(1) + "%" }}
                  />
                </div>

                {/* Mobile: Zusatz-Stats */}
                <div className="flex gap-4 sm:hidden text-xs text-zinc-400">
                  <span>{stat.tradeCount} Trades</span>
                  <span>{stat.winRate.toFixed(0)} % Wins</span>
                  {stat.avgR != null && <span>Ø {stat.avgR.toFixed(2)}R</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
