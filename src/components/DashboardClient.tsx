"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TIME_RANGE_LABELS,
  filterTradesByRange,
  type TimeRange,
} from "@/lib/timeRanges";
import {
  calculateStats,
  buildEquityCurve,
  type Trade,
} from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import EquityChart from "@/components/EquityChart";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

const TABS: TimeRange[] = ["today", "week", "month", "year", "all"];

export default function DashboardClient({
  trades,
  account,
}: {
  trades: Trade[];
  account: {
    name: string;
    broker: string;
    currency: string;
    starting_balance: number;
    current_balance: number;
  };
}) {
  const [range, setRange] = useState<TimeRange>("today");

  const filtered = useMemo(
    () => filterTradesByRange(trades, range),
    [trades, range]
  );

  const stats = useMemo(() => calculateStats(filtered), [filtered]);
  const equityCurve = useMemo(
    () => buildEquityCurve(filtered, Number(account.starting_balance)),
    [filtered, account.starting_balance]
  );

  const recentTrades = useMemo(() => trades.slice(0, 5), [trades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {account.name} · {account.broker} ·{" "}
            <span className="text-gold-400">
              {formatCurrency(Number(account.current_balance), account.currency)}
            </span>
          </p>
        </div>
      </div>

      {/* Zeitraum-Tabs */}
      <div className="flex gap-1 p-1 bg-bg-card border border-bg-border rounded-xl overflow-x-auto scrollbar-hidden">
        {TABS.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "flex-1 min-w-[70px] px-3 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap",
              range === r
                ? "bg-gradient-to-r from-gold-500 to-gold-600 text-bg shadow-md shadow-gold-500/20"
                : "text-zinc-400 hover:text-white"
            )}
          >
            {TIME_RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="P/L"
          value={
            (stats.totalPnl >= 0 ? "+" : "") +
            formatCurrency(stats.totalPnl, account.currency)
          }
          accent={stats.totalPnl >= 0 ? "success" : stats.totalPnl < 0 ? "danger" : undefined}
          icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          subtext={`${stats.winningTrades}/${stats.closedTrades}`}
          icon={Target}
        />
        <KpiCard
          label="Ø R-Multiple"
          value={stats.avgR.toFixed(2) + "R"}
          accent={stats.avgR > 0 ? "success" : stats.avgR < 0 ? "danger" : undefined}
          icon={Activity}
        />
        <KpiCard
          label="Profit Factor"
          value={stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2)}
          accent={stats.profitFactor >= 1 ? "success" : stats.profitFactor > 0 ? "danger" : undefined}
          icon={Activity}
        />
      </div>

      {/* Equity Curve */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Equity-Kurve</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kapital im Zeitraum „{TIME_RANGE_LABELS[range]}"
            </p>
          </div>
        </div>
        {equityCurve.length > 1 ? (
          <EquityChart data={equityCurve} />
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
            Noch keine geschlossenen Trades in diesem Zeitraum.
          </div>
        )}
      </div>

      {/* Letzte Trades (immer alle, nicht gefiltert) */}
      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        <div className="p-5 md:p-6 border-b border-bg-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Letzte Trades</h2>
          <Link
            href="/trades"
            className="text-xs text-gold-400 hover:text-gold-300 font-medium"
          >
            Alle ansehen →
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Noch keine Trades.{" "}
            <Link href="/trades/new" className="text-gold-400 hover:text-gold-300">
              Ersten Trade anlegen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {recentTrades.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide",
                      t.direction === "long"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    )}
                  >
                    {t.direction === "long" ? "Long" : "Short"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {t.symbol}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {t.entry_time ? formatDateTime(t.entry_time) : "Geplant"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      pnlColor(t.pnl_currency)
                    )}
                  >
                    {t.pnl_currency != null
                      ? (t.pnl_currency >= 0 ? "+" : "") +
                        formatCurrency(t.pnl_currency, account.currency)
                      : "—"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.r_multiple != null ? `${t.r_multiple}R` : t.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: "success" | "danger";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-4 md:p-5 transition hover:border-bg-border/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={cn(
            "w-3.5 h-3.5",
            accent === "success"
              ? "text-success"
              : accent === "danger"
              ? "text-danger"
              : "text-zinc-500"
          )}
        />
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-bold tracking-tight",
          accent === "success"
            ? "text-success"
            : accent === "danger"
            ? "text-danger"
            : "text-white"
        )}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-zinc-500 mt-1">{subtext}</div>
      )}
    </div>
  );
}
