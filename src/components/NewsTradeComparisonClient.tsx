"use client";

import { formatCurrency } from "@/lib/utils";

export type NewsComparisonData = {
  flaggedCount: number;
  flaggedWinRate: number;
  flaggedAvgPnl: number;
  normalCount: number;
  normalWinRate: number;
  normalAvgPnl: number;
  currency: string;
};

export default function NewsTradeComparisonClient({ data }: { data: NewsComparisonData }) {
  if (data.flaggedCount === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-5 text-center">
        <p className="text-sm text-zinc-400">Noch kein Trade trotz News-Warnung angelegt.</p>
        <p className="text-xs text-zinc-600 mt-1">Gut so — hier erscheint ein Vergleich, sobald du im NewsWarningModal auf "Trotzdem anlegen" klickst.</p>
      </div>
    );
  }

  const diff = data.flaggedAvgPnl - data.normalAvgPnl;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <CompareCard
          title="Trotz Warnung"
          subtitle={data.flaggedCount + (data.flaggedCount === 1 ? " Trade" : " Trades")}
          winRate={data.flaggedWinRate}
          avgPnl={data.flaggedAvgPnl}
          currency={data.currency}
          highlight="danger"
        />
        <CompareCard
          title="Normal"
          subtitle={data.normalCount + (data.normalCount === 1 ? " Trade" : " Trades")}
          winRate={data.normalWinRate}
          avgPnl={data.normalAvgPnl}
          currency={data.currency}
          highlight="neutral"
        />
      </div>
      {data.flaggedCount >= 3 && (
        <div className={"rounded-lg px-4 py-3 text-xs border " + (diff < 0 ? "bg-danger/10 border-danger/30 text-danger" : "bg-success/10 border-success/30 text-success")}>
          {diff < 0
            ? "Trades trotz Warnung performen im Schnitt " + formatCurrency(Math.abs(diff), data.currency) + " schlechter pro Trade."
            : "Trades trotz Warnung performen im Schnitt " + formatCurrency(diff, data.currency) + " besser pro Trade — interessant!"}
        </div>
      )}
    </div>
  );
}

function CompareCard({
  title,
  subtitle,
  winRate,
  avgPnl,
  currency,
  highlight,
}: {
  title: string;
  subtitle: string;
  winRate: number;
  avgPnl: number;
  currency: string;
  highlight: "danger" | "neutral";
}) {
  return (
    <div className={"rounded-xl border p-4 space-y-3 " + (highlight === "danger" ? "border-danger/30 bg-danger/5" : "border-zinc-800 bg-zinc-900/50")}>
      <div>
        <p className={"text-xs font-semibold uppercase tracking-wider " + (highlight === "danger" ? "text-danger" : "text-zinc-400")}>{title}</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Win-Rate" value={winRate.toFixed(1) + " %"} colorClass={winRate >= 50 ? "text-success" : "text-red-400"} />
        <StatCell label="Ø P/L" value={formatCurrency(avgPnl, currency)} colorClass={avgPnl >= 0 ? "text-success" : "text-red-400"} />
      </div>
    </div>
  );
}

function StatCell({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={"text-sm font-semibold " + colorClass}>{value}</p>
    </div>
  );
}
