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

function getMetricDisplay(
  stat: TagStat,
  key: SortKey,
  currency: string
): { value: string; sub: string; positive: boolean | null } {
  switch (key) {
    case "tradeCount":
      return {
        value: stat.tradeCount + " Trades",
        sub: stat.winRate.toFixed(0) + " % Win",
        positive: null,
      };
    case "totalPnl":
      return {
        value: (stat.totalPnl >= 0 ? "+" : "") + formatCurrency(stat.totalPnl, currency),
        sub: stat.tradeCount + " Trades",
        positive: stat.totalPnl >= 0,
      };
    case "winRate":
      return {
        value: stat.winRate.toFixed(0) + " %",
        sub: stat.tradeCount + " Trades",
        positive: stat.winRate >= 50,
      };
    case "avgR":
      return {
        value: stat.avgR != null ? stat.avgR.toFixed(2) + "R" : "—",
        sub: stat.tradeCount + " Trades",
        positive: stat.avgR != null ? stat.avgR >= 0 : null,
      };
  }
}

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
            const metric = getMetricDisplay(stat, sortKey, currency);

            return (
              <div key={stat.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Tag-Name + Kategorie */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {stat.name}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex-shrink-0">
                      {CATEGORY_LABELS[stat.category] ?? stat.category}
                    </span>
                  </div>

                  {/* Gewählte Metrik */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        metric.positive === true
                          ? "text-success"
                          : metric.positive === false
                          ? "text-danger"
                          : "text-white"
                      )}
                    >
                      {metric.value}
                    </div>
                    <div className="text-[10px] text-zinc-500">{metric.sub}</div>
                  </div>
                </div>

                {/* P/L-Balken */}
                <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isPositive ? "bg-success/60" : "bg-danger/60")}
                    style={{ width: (pnlPct * 100).toFixed(1) + "%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
