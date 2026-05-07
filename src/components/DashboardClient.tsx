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
  type Stats,
} from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import EquityChart from "@/components/EquityChart";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ChevronDown,
} from "lucide-react";

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
  const allTimeStats = useMemo(() => calculateStats(trades), [trades]);
  const equityCurve = useMemo(
    () => buildEquityCurve(filtered, Number(account.starting_balance)),
    [filtered, account.starting_balance]
  );

  const recentTrades = useMemo(() => trades.slice(0, 5), [trades]);

  return (
    <div className="space-y-5">
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

      {/* All-Time Stats (Klapp-Leiste) */}
      <AllTimeStatsBar stats={allTimeStats} currency={account.currency} />

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

      {/* KPI Cards (Zeitraum-spezifisch) */}
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
          subtext={
            stats.closedTrades === 0
              ? "Keine Trades"
              : `${stats.winningTrades} von ${stats.closedTrades} ${stats.closedTrades === 1 ? "Trade" : "Trades"}`
          }
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

      {/* Letzte Trades */}
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

/* ===========================================================
   AllTime Stats Bar — kompakt + ausklappbar
   =========================================================== */
function AllTimeStatsBar({
  stats,
  currency,
}: {
  stats: Stats;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (stats.totalTrades === 0) return null;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden transition-all">
      {/* Compact Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 md:gap-4 px-3 md:px-5 py-3 hover:bg-bg-elevated/30 transition"
      >
        <div className="text-[9px] md:text-[10px] font-semibold text-gold-400 uppercase tracking-wider whitespace-nowrap">
          All Time
        </div>

        <div className="flex items-center gap-2.5 md:gap-4 flex-1 min-w-0">
          <CompactStat
            label="Win"
            value={`${stats.winRate}%`}
            accent={stats.winRate >= 50 ? "success" : stats.winRate > 0 ? "danger" : undefined}
          />
          <Divider />
          <CompactStat
            label="P/L"
            value={
              (stats.totalPnl >= 0 ? "+" : "") +
              formatCurrencyCompact(stats.totalPnl, currency)
            }
            accent={stats.totalPnl >= 0 ? "success" : stats.totalPnl < 0 ? "danger" : undefined}
          />
          <Divider />
          <CompactStat
            label="Ø R"
            value={stats.avgR.toFixed(2) + "R"}
            accent={stats.avgR > 0 ? "success" : stats.avgR < 0 ? "danger" : undefined}
          />
          <Divider />
          <CompactStat
            label="Trades"
            value={stats.totalTrades.toString()}
          />
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-zinc-500 transition-transform flex-shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-bg-border p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in">
          <DetailStat
            label="Total Trades"
            value={stats.totalTrades.toString()}
            subtext={`${stats.closedTrades} geschlossen`}
          />
          <DetailStat
            label="Win Rate"
            value={`${stats.winRate}%`}
            subtext={`${stats.winningTrades} W · ${stats.losingTrades} L`}
            accent={stats.winRate >= 50 ? "success" : stats.winRate > 0 ? "danger" : undefined}
          />
          <DetailStat
            label="Total P/L"
            value={
              (stats.totalPnl >= 0 ? "+" : "") +
              formatCurrency(stats.totalPnl, currency)
            }
            accent={stats.totalPnl >= 0 ? "success" : stats.totalPnl < 0 ? "danger" : undefined}
          />
          <DetailStat
            label="Profit Factor"
            value={stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2)}
            accent={stats.profitFactor >= 1 ? "success" : stats.profitFactor > 0 ? "danger" : undefined}
          />
          <DetailStat
            label="Ø R-Multiple"
            value={stats.avgR.toFixed(2) + "R"}
            accent={stats.avgR > 0 ? "success" : stats.avgR < 0 ? "danger" : undefined}
          />
          <DetailStat
            label="Wins / Losses"
            value={`${stats.winningTrades} / ${stats.losingTrades}`}
          />
          <DetailStat
            label="Bester Trade"
            value={
              "+" + formatCurrency(stats.bestTrade, currency)
            }
            accent="success"
          />
          <DetailStat
            label="Schlechtester Trade"
            value={formatCurrency(stats.worstTrade, currency)}
            accent={stats.worstTrade < 0 ? "danger" : undefined}
          />
        </div>
      )}
    </div>
  );
}

function CompactStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "danger";
}) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-wider font-medium leading-tight">
        {label}
      </div>
      <div
        className={cn(
          "text-xs md:text-sm font-bold tracking-tight leading-tight truncate",
          accent === "success" && "text-success",
          accent === "danger" && "text-danger",
          !accent && "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-7 bg-bg-border flex-shrink-0" />;
}

function DetailStat({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: "success" | "danger";
}) {
  return (
    <div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-base md:text-lg font-bold tracking-tight",
          accent === "success" && "text-success",
          accent === "danger" && "text-danger",
          !accent && "text-white"
        )}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-[10px] text-zinc-500 mt-0.5">{subtext}</div>
      )}
    </div>
  );
}

/* ===========================================================
   Helper: kompakte Currency-Anzeige für die Stats-Bar
   "+1.234,56 €" → "+1,2k €" für Werte > 1000
   =========================================================== */
function formatCurrencyCompact(value: number, currency: string): string {
  const abs = Math.abs(value);
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  if (abs >= 10000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")}k ${symbol}`;
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(2).replace(".", ",")}k ${symbol}`;
  }
  return `${value.toFixed(0)} ${symbol}`;
}

/* ===========================================================
   Original KpiCard für die Tab-spezifischen KPIs
   =========================================================== */
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
