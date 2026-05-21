"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { calculateSetupStats } from "@/lib/setupStats";
import type { SetupStat } from "@/lib/setupStats";

type SortKey = "count" | "totalPnl" | "avgPnl" | "winRate";

const SORT_LABELS: Record<SortKey, string> = {
  count: "Trades",
  totalPnl: "Total P/L",
  avgPnl: "Ø P/L",
  winRate: "Win Rate",
};

type AnalyticsTrade = {
  setup?: string | null;
  pnl_currency: number | null;
};

export default function SetupStatsTable({
  trades,
  currency,
}: {
  trades: AnalyticsTrade[];
  currency: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("totalPnl");

  const stats = useMemo(() => calculateSetupStats(trades), [trades]);

  const sorted = useMemo(
    () => [...stats].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)),
    [stats, sortKey]
  );

  if (stats.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
          Setup-Performance
        </h2>
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <p className="text-zinc-400 text-sm">
            Noch keine Trades mit Setup-Eintrag.
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Trag beim nächsten Trade dein Setup ein (z. B. &#8222;FVG Long&#8220;) — dann siehst du hier, was wirklich funktioniert.
          </p>
        </div>
      </section>
    );
  }

  const maxAbsPnl = Math.max(...stats.map((s) => Math.abs(s.totalPnl)), 1);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Setup-Performance
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Welches Setup ist dein Geld-Maker?
          </p>
        </div>
      </div>

      {/* Sortier-Leiste */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3" />
          Sortieren
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

      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-bg-border">
          {sorted.map((s) => {
            const pnlPct = Math.min(Math.abs(s.totalPnl) / maxAbsPnl, 1);
            return (
              <div key={s.setup} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{s.setup}</span>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">
                        {s.count} {s.count === 1 ? "Trade" : "Trades"}
                      </span>
                    </div>
                    {/* Win Rate Bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: s.winRate + "%",
                            backgroundColor: s.winRate >= 50 ? "rgb(34,197,94)" : "rgb(239,68,68)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 flex-shrink-0 w-8 text-right">
                        {Math.round(s.winRate)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        s.totalPnl >= 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {s.totalPnl >= 0 ? "+" : ""}{formatCurrency(s.totalPnl, currency)}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Ø {s.avgPnl >= 0 ? "+" : ""}{formatCurrency(s.avgPnl, currency)}
                    </div>
                  </div>
                </div>

                {/* P/L Balken */}
                <div className="mt-2 h-0.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: pnlPct * 100 + "%",
                      backgroundColor: s.totalPnl >= 0 ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
