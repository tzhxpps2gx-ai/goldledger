"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const monthlyPnl = trades.reduce((s, t) => s + (t.pnl_currency ?? 0), 0);
  const monthlyTrades = trades.length;
  const winningDays = Array.from(grouped.values()).filter((d) => d.pnl > 0).length;
  const losingDays = Array.from(grouped.values()).filter((d) => d.pnl < 0).length;

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

  const prevMonthNum = month === 0 ? 12 : month;
  const prevYearNum = month === 0 ? year - 1 : year;
  const nextMonthNum = month === 11 ? 1 : month + 2;
  const nextYearNum = month === 11 ? year + 1 : year;

  const prevUrl = "/calendar?month=" + prevMonthNum + "&year=" + prevYearNum;
  const nextUrl = "/calendar?month=" + nextMonthNum + "&year=" + nextYearNum;

  const selectedDayData =
    selectedDay !== null
      ? {
          iso: selectedDay,
          trades: grouped.get(selectedDay)?.trades ?? [],
          pnl: grouped.get(selectedDay)?.pnl ?? 0,
          count: grouped.get(selectedDay)?.count ?? 0,
        }
      : null;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight capitalize">
              {monthName}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {monthlyTrades} {monthlyTrades === 1 ? "Trade" : "Trades"}
              {" · "}
              <span className={cn(monthlyPnl >= 0 ? "text-success" : "text-danger")}>
                {monthlyPnl >= 0 ? "+" : ""}
                {formatCurrency(monthlyPnl, currency)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={prevUrl}
              className="p-2 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href={nextUrl}
              className="p-2 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Gewinn-Tage" value={winningDays.toString()} accent="success" />
          <MiniStat label="Verlust-Tage" value={losingDays.toString()} accent="danger" />
          <MiniStat label="Trades gesamt" value={monthlyTrades.toString()} />
        </div>

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
              if (!cell) {
                return <div key={i} className="aspect-square" />;
              }
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
                  style={{ opacity: hasData ? 0.5 + intensity * 0.5 : 1 }}
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
                        {Math.round(cell.pnl)}
                        {"€"}
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

      {selectedDayData && (
        <DayModal
          data={selectedDayData}
          currenc
