"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { calculateScoreVsPnlCorrelation } from "@/lib/disciplineScore";
import type { TradeCompletion } from "@/lib/disciplineScore";

type Trade = {
  id: string;
  checklist_used?: boolean;
  pnl_currency?: number | null;
};

type Props = {
  trades: Trade[];
  completionsMap: Map<string, TradeCompletion[]>;
  currency: string;
};

type BucketConfig = {
  key: "high" | "mid" | "low";
  label: string;
  range: string;
  bg: string;
  border: string;
  accent: string;
};

const BUCKETS: BucketConfig[] = [
  { key: "high", label: "Hohe Disziplin",    range: ">80%",   bg: "bg-success/5",   border: "border-success/20",  accent: "text-success" },
  { key: "mid",  label: "Mittlere Disziplin", range: "50–80%", bg: "bg-yellow-500/5",border: "border-yellow-500/20",accent: "text-yellow-400" },
  { key: "low",  label: "Niedrige Disziplin", range: "<50%",   bg: "bg-danger/5",    border: "border-danger/20",   accent: "text-danger" },
];

export default function DisciplineCorrelation({ trades, completionsMap, currency }: Props) {
  const result = useMemo(
    () => calculateScoreVsPnlCorrelation(trades, completionsMap),
    [trades, completionsMap]
  );

  const highAvg = result.high.tradeCount > 0 ? result.high.avgPnl : null;
  const lowAvg  = result.low.tradeCount  > 0 ? result.low.avgPnl  : null;
  const insightDiff = highAvg !== null && lowAvg !== null ? highAvg - lowAvg : null;

  const totalTracked = result.high.tradeCount + result.mid.tradeCount + result.low.tradeCount;

  if (totalTracked === 0) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-6 text-center">
        <p className="text-sm text-zinc-500">
          Noch keine Trades mit Checklist. Lege einen neuen Trade an und nutze die Checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insightDiff !== null && Math.abs(insightDiff) > 5 && (
        <div className="bg-gold-500/8 border border-gold-500/20 rounded-xl p-3">
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="font-semibold text-gold-400">Insight: </span>
            Trades mit hoher Disziplin bringen im Schnitt{" "}
            <span className={insightDiff > 0 ? "text-success font-semibold" : "text-danger font-semibold"}>
              {insightDiff > 0 ? "+" : ""}{formatCurrency(insightDiff, currency)}
            </span>{" "}
            mehr P/L als Trades mit niedriger Disziplin.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BUCKETS.map(({ key, label, range, bg, border, accent }) => {
          const b = result[key];
          return (
            <div key={key} className={cn("rounded-2xl border p-4 space-y-3", bg, border)}>
              <div>
                <div className={cn("text-xs font-bold uppercase tracking-wider", accent)}>{label}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">Score {range}</div>
              </div>
              {b.tradeCount === 0 ? (
                <p className="text-xs text-zinc-600">Keine Trades</p>
              ) : (
                <>
                  <div>
                    <div className="text-[10px] text-zinc-500">Total P/L</div>
                    <div className={cn("text-lg font-bold", b.totalPnl >= 0 ? "text-success" : "text-danger")}>
                      {b.totalPnl >= 0 ? "+" : ""}{formatCurrency(b.totalPnl, currency)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[10px] text-zinc-500">Trades</div>
                      <div className="text-sm font-semibold text-white">{b.tradeCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Win Rate</div>
                      <div className="text-sm font-semibold text-white">{b.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">&#216; P/L</div>
                      <div className={cn("text-sm font-semibold", b.avgPnl >= 0 ? "text-success" : "text-danger")}>
                        {b.avgPnl >= 0 ? "+" : ""}{formatCurrency(b.avgPnl, currency)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
