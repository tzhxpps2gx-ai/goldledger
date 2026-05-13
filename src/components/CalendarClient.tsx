"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Trade, groupTradesByDay } from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type CalendarClientProps = {
  trades: Trade[];
  currency: string;
  startBalance: number;
  month: number;
  year: number;
};

export default function CalendarClient({
  trades,
  currency,
  startBalance,
  month,
  year,
}: CalendarClientProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const router = useRouter();

  const grouped = groupTradesByDay(trades);

  // Statistiken
  const monthlyPnl = trades.reduce((s, t) => s + (t.pnl_currency ?? 0), 0);
  const monthlyTrades = trades.length;
  const winningDays = Array.from(grouped.values()).filter((d) => d.pnl > 0).length;
  const losingDays = Array.from(grouped.values()).filter((d) => d.pnl < 0).length;

  // Kalender-Gitter
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dayCells: ({
    day: number;
    iso: string;
    pnl: number;
    count: number;
  } | null)[] = [];

  const startWeekday = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startWeekday; i++) dayCells.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const iso = new Date(year, month, d).toISOString().split("T")[0];
    const data = grouped.get(iso);
    dayCells.push({
      day: d,
      iso,
      pnl: data?.pnl ?? 0,
      count: data?.count ?? 0,
    });
  }

  const monthName = new Date(year, month).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;

  // Trades des ausgewählten Tags
  const selectedDayData =
    selectedDay !== null
      ? {
          iso: selectedDay,
          trades: grouped.get(selectedDay)?.trades ?? [],
          pnl: grouped.get(selectedDay)?.pnl ?? 0,
          count: grouped.get(selectedDay)?.count ?? 0,
        }
      : null;

  // ESC zum Schließen
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedDay(null);
    }
    if (selectedDay) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [selectedDay]);

  return (
    <>
      <div className="space-y-6">
        {/* Header mit Monatsnavigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight capitalize">
              {monthName}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {monthlyTrades} {monthlyTrades === 1 ? "Trade" : "Trades"} ·{" "}
              <span className={cn(monthlyPnl >= 0 ? "text-success" : "text-danger")}>
                {monthlyPnl >= 0 ? "+" : ""}
                {formatCurrency(monthlyPnl, currency)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            
              href={`/calendar?month=${prevMonth}&year=${prevYear}`}
              className="p-2 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </a>
            
              href={`/calendar?month=${nextMonth}&year=${nextYear}`}
              className="p-2 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Mini-Stats */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Gewinn-Tage" value={winningDays.toString()} accent="success" />
          <MiniStat label="Verlust-Tage" value={losingDays.toString()} accent="danger" />
          <MiniStat label="Trades gesamt" value={monthlyTrades.toString()} />
        </div>

        {/* Kalender-Grid */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-3 md:p-5">
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] md:text-xs font-medium text-zinc-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {dayCells.map((cell, i) => {
              if (!cell) return <div key={i} className="aspect-square" />;
              const hasData = cell.count > 0;
              const isWin = cell.pnl > 0;
              const isLoss = cell.pnl < 0;
              const intensity = Math.min(Math.abs(cell.pnl) / 200, 1);

              return (
                <button
                  key={i}
                  onClick={() => hasData && setSelectedDay(cell.iso)}
                  disabled={!hasData}
                  className={cn(
                    "aspect-square rounded-lg p-1 md:p-2 flex flex-col items-center justify-center text-center transition-all",
                    !hasData && "bg-bg-elevated/50 border border-bg-border cursor-default",
                    isWin && "bg-success/15 border border-success/30 hover:bg-success/25 hover:scale-105 active:scale-95 cursor-pointer",
                    isLoss && "bg-danger/15 border border-danger/30 hover:bg-danger/25 hover:scale-105 active:scale-95 cursor-pointer"
                  )}
                  style={{
                    opacity: hasData ? 0.5 + intensity * 0.5 : 1,
                  }}
                >
                  <div className="text-[10px] md:text-xs text-zinc-400 font-medium">
                    {cell.day}
                  </div>
                  {hasData && (
                    <>
                      <div
                        className={cn(
                          "text-[9px] md:text-xs font-bold leading-tight",
                          isWin ? "text-success" : "text-danger"
                        )}
                      >
                        {isWin ? "+" : ""}
                        {Math.round(cell.pnl)}€
                      </div>
                      <div className="text-[8px] text-zinc-500 hidden md:block">
                        {cell.count} {cell.count === 1 ? "Trade" : "Trades"}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Trades des Tages */}
      {selectedDayData && (
        <DayModal
          data={selectedDayData}
          currency={currency}
          onClose={() => setSelectedDay(null)}
          onNavigate={(tradeId) => {
            setSelectedDay(null);
            router.push(`/trades/${tradeId}`);
          }}
        />
      )}
    </>
  );
}

function DayModal({
  data,
  currency,
  onClose,
  onNavigate,
}: {
  data: { iso: string; trades: Trade[]; pnl: number; count: number };
  currency: string;
  onClose: () => void;
  onNavigate: (tradeId: string) => void;
}) {
  const date = new Date(data.iso);
  const dateLabel = date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const wins = data.trades.filter((t) => (t.pnl_currency ?? 0) > 0).length;
  const losses = data.trades.filter((t) => (t.pnl_currency ?? 0) < 0).length;
  const winRate =
    data.count > 0 ? Math.round((wins / data.count) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 p-0 md:p-4 pointer-events-none">
        <div className="bg-bg-card border border-bg-border md:border md:rounded-2xl rounded-t-2xl shadow-2xl max-w-lg w-full max-h-[85vh] md:max-h-[80vh] flex flex-col pointer-events-auto animate-slide-up safe-area-bottom">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-bg-border">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">
                Trading-Tag
              </div>
              <div className="text-base font-semibold text-white capitalize">
                {dateLabel}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 -mr-2 rounded-lg hover:bg-bg-elevated transition active:scale-95"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Day Stats */}
          <div className="grid grid-cols-3 gap-2 p-5 border-b border-bg-border">
            <DayStatBox
              label="P/L"
              value={
                (data.pnl >= 0 ? "+" : "") + formatCurrency(data.pnl, currency)
              }
              accent={data.pnl >= 0 ? "success" : "danger"}
            />
            <DayStatBox
              label="Win Rate"
              value={`${winRate}%`}
              sublabel={`${wins} W · ${losses} L`}
            />
            <DayStatBox label="Trades" value={data.count.toString()} />
          </div>

          {/* Trades */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
                Trades an diesem Tag
              </div>
              <div className="space-y-2">
                {data.trades.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onNavigate(t.id)}
                    className="w-full flex items-center justify-between p-3 bg-bg-elevated border border-bg-border rounded-xl hover:border-gold-500/30 hover:bg-bg-elevated/70 transition-all text-left active:scale-[0.98]"
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
                          {t.symbol}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {t.exit_time
                            ? formatDateTime(t.exit_time)
                            : t.entry_time
                              ? formatDateTime(t.entry_time)
                              : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className={cn(
                          "text-sm font-semibold",
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
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "danger";
}) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 md:p-4">
      <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-lg md:text-xl font-bold mt-1",
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

function DayStatBox({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "success" | "danger";
}) {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl p-3 text-center">
      <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-base font-bold tracking-tight mt-0.5",
          accent === "success" && "text-success",
          accent === "danger" && "text-danger",
          !accent && "text-white"
        )}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-[9px] text-zinc-500 mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}
