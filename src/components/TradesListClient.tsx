"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type Trade } from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import { Plus, Search, X, Filter as FilterIcon } from "lucide-react";

type FilterType = "all" | "wins" | "losses" | "open";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "Alle",
  wins: "Wins",
  losses: "Losses",
  open: "Offen",
};

export default function TradesListClient({
  trades,
  currency,
}: {
  trades: Trade[];
  currency: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    let result = trades;

    // Filter
    if (filter === "wins") {
      result = result.filter(
        (t) => t.status === "closed" && (t.pnl_currency ?? 0) > 0
      );
    } else if (filter === "losses") {
      result = result.filter(
        (t) => t.status === "closed" && (t.pnl_currency ?? 0) < 0
      );
    } else if (filter === "open") {
      result = result.filter(
        (t) => t.status === "planned" || t.status === "open"
      );
    }

    // Suche
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t: any) => {
        return (
          t.symbol?.toLowerCase().includes(q) ||
          t.setup?.toLowerCase().includes(q) ||
          t.reasoning?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.direction?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [trades, filter, search]);

  // Stats für die aktuelle Anzeige
  const totalPnl = filtered.reduce(
    (sum, t) => sum + (t.pnl_currency ?? 0),
    0
  );
  const closed = filtered.filter((t) => t.status === "closed").length;
  const wins = filtered.filter(
    (t) => t.status === "closed" && (t.pnl_currency ?? 0) > 0
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Trades
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {filtered.length}{" "}
            {filtered.length === 1 ? "Trade" : "Trades"}
            {(search || filter !== "all") && (
              <> · gefiltert aus {trades.length}</>
            )}
            {closed > 0 && (
              <>
                {" · "}
                <span
                  className={cn(
                    "font-medium",
                    totalPnl >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(totalPnl, currency)}
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/trades/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Neuer Trade
        </Link>
      </div>

      {/* Such-Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach Setup, Notizen, Symbol..."
          className="w-full pl-10 pr-10 py-3 bg-bg-card border border-bg-border rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 rounded transition active:scale-95"
            aria-label="Suche löschen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter-Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
        {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => {
          const isActive = filter === f;
          const count =
            f === "all"
              ? trades.length
              : f === "wins"
                ? trades.filter(
                    (t) => t.status === "closed" && (t.pnl_currency ?? 0) > 0
                  ).length
                : f === "losses"
                  ? trades.filter(
                      (t) =>
                        t.status === "closed" && (t.pnl_currency ?? 0) < 0
                    ).length
                  : trades.filter(
                      (t) => t.status === "planned" || t.status === "open"
                    ).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0",
                isActive
                  ? "bg-gradient-to-r from-gold-500 to-gold-600 text-bg shadow-md shadow-gold-500/20"
                  : "bg-bg-card border border-bg-border text-zinc-400 hover:text-white"
              )}
            >
              {FILTER_LABELS[f]}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-bg/30" : "bg-bg-elevated"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            {trades.length === 0 ? (
              <>
                <p className="text-zinc-400 mb-4">Noch keine Trades vorhanden.</p>
                <Link
                  href="/trades/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  Ersten Trade anlegen
                </Link>
              </>
            ) : (
              <>
                <FilterIcon className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">
                  Keine Trades entsprechen deinen Filtern.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-3 text-xs text-gold-400 hover:text-gold-300 font-medium"
                >
                  Filter zurücksetzen
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0",
                      t.direction === "long"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    )}
                  >
                    {t.direction === "long" ? "Long" : "Short"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {t.symbol}{" "}
                      {(t as any).setup && (
                        <span className="text-zinc-500 font-normal">
                          · {(t as any).setup}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {t.entry_time ? formatDateTime(t.entry_time) : "Geplant"}
                      {" · "}
                      <span className="capitalize">{t.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div
                    className={cn(
                      "text-sm font-semibold transition-transform group-hover:scale-105",
                      pnlColor(t.pnl_currency)
                    )}
                  >
                    {t.pnl_currency != null
                      ? (t.pnl_currency >= 0 ? "+" : "") +
                        formatCurrency(t.pnl_currency, currency)
                      : "—"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.r_multiple != null ? `${t.r_multiple}R` : "—"}
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
