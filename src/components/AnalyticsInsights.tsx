"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { BestWorstHour, SetupStat } from "@/lib/timeStats";
import type { SetupStat as SS } from "@/lib/setupStats";
import { DAY_LABELS } from "@/lib/timeStats";

type Props = {
  bestHour: BestWorstHour | null;
  worstHour: BestWorstHour | null;
  bestSetup: SS | null;
  currency: string;
};

function InsightCard({
  title,
  main,
  value,
  sub,
  color,
  empty,
}: {
  title: string;
  main: string;
  value: string;
  sub: string;
  color: "gold" | "success" | "danger";
  empty?: string;
}) {
  const borderCls =
    color === "gold"
      ? "border-gold-500/25"
      : color === "success"
      ? "border-success/25"
      : "border-danger/25";
  const bgCls =
    color === "gold"
      ? "bg-gold-500/5"
      : color === "success"
      ? "bg-success/5"
      : "bg-danger/5";
  const valueCls =
    color === "gold"
      ? "text-gold-400"
      : color === "success"
      ? "text-success"
      : "text-danger";

  if (empty) {
    return (
      <div className={cn("rounded-2xl border p-4", bgCls, borderCls)}>
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          {title}
        </div>
        <p className="text-xs text-zinc-600">{empty}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-4", bgCls, borderCls)}>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-sm text-zinc-300 font-medium truncate">{main}</div>
      <div className={cn("text-xl font-bold mt-1", valueCls)}>{value}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
    </div>
  );
}

export default function AnalyticsInsights({ bestHour, worstHour, bestSetup, currency }: Props) {
  const formatHour = (h: BestWorstHour) =>
    `${String(h.hour).padStart(2, "0")}:00 Uhr · ${DAY_LABELS[h.day]}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <InsightCard
        title="Beste Stunde"
        color="success"
        main={bestHour ? formatHour(bestHour) : ""}
        value={bestHour ? (bestHour.pnl >= 0 ? "+" : "") + formatCurrency(bestHour.pnl, currency) : ""}
        sub={
          bestHour
            ? `${bestHour.count} ${bestHour.count === 1 ? "Trade" : "Trades"} · ${Math.round(bestHour.winRate)}% Win`
            : ""
        }
        empty={!bestHour ? "Noch zu wenig Daten — trade mehr, um Muster zu sehen." : undefined}
      />
      <InsightCard
        title="Schwächste Stunde"
        color="danger"
        main={worstHour ? formatHour(worstHour) : ""}
        value={
          worstHour
            ? (worstHour.pnl >= 0 ? "+" : "") + formatCurrency(worstHour.pnl, currency)
            : ""
        }
        sub={
          worstHour
            ? `${worstHour.count} ${worstHour.count === 1 ? "Trade" : "Trades"} · ${Math.round(worstHour.winRate)}% Win`
            : ""
        }
        empty={!worstHour ? "Noch zu wenig Daten." : undefined}
      />
      <InsightCard
        title="Bestes Setup"
        color="gold"
        main={bestSetup ? bestSetup.setup : ""}
        value={
          bestSetup
            ? (bestSetup.totalPnl >= 0 ? "+" : "") + formatCurrency(bestSetup.totalPnl, currency)
            : ""
        }
        sub={
          bestSetup
            ? `${bestSetup.count} ${bestSetup.count === 1 ? "Trade" : "Trades"} · ${Math.round(bestSetup.winRate)}% Win`
            : ""
        }
        empty={
          !bestSetup
            ? "Noch keine Trades mit Setup-Eintrag. Trag beim nächsten Trade dein Setup ein."
            : undefined
        }
      />
    </div>
  );
}
