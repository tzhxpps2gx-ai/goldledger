"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { calculateHourlyHeatmap, DAY_LABELS } from "@/lib/timeStats";
import type { HeatmapCell } from "@/lib/timeStats";

type AnalyticsTrade = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  pnl_currency: number | null;
  entry_time: string | null;
  setup?: string | null;
};

type Metric = "pnl" | "winrate" | "count";

const METRIC_LABELS: Record<Metric, string> = {
  pnl: "Total P/L",
  winrate: "Win Rate",
  count: "Anzahl",
};

function getCellBg(cell: HeatmapCell, metric: Metric, maxAbsPnl: number, maxCount: number): string {
  if (cell.count === 0) return "rgba(39,39,42,0.4)";
  if (metric === "pnl") {
    if (maxAbsPnl === 0) return "rgba(113,113,122,0.15)";
    const intensity = Math.min(Math.abs(cell.pnl) / maxAbsPnl, 1);
    const alpha = 0.15 + intensity * 0.55;
    return cell.pnl >= 0
      ? "rgba(34,197,94," + alpha + ")"
      : "rgba(239,68,68," + alpha + ")";
  }
  if (metric === "winrate") {
    const wr = cell.winCount / cell.count;
    if (wr <= 0.5) {
      const h = wr * 2 * 55;
      return "hsl(" + h + ",65%,28%)";
    }
    const h = 55 + (wr - 0.5) * 2 * 65;
    return "hsl(" + h + ",65%,28%)";
  }
  if (maxCount === 0) return "rgba(212,175,55,0.1)";
  const intensity = cell.count / maxCount;
  return "rgba(212,175,55," + (0.1 + intensity * 0.65) + ")";
}

function getCellLabel(cell: HeatmapCell, metric: Metric): string {
  if (cell.count === 0) return "";
  if (metric === "pnl") {
    const v = Math.round(cell.pnl);
    return (v >= 0 ? "+" : "") + v;
  }
  if (metric === "winrate") return Math.round((cell.winCount / cell.count) * 100) + "%";
  return String(cell.count);
}

function formatEntryTime(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function HourlyHeatmap({
  trades,
  currency,
}: {
  trades: AnalyticsTrade[];
  currency: string;
}) {
  const [metric, setMetric] = useState<Metric>("pnl");
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null);
  const [tooltip, setTooltip] = useState<{
    day: number;
    hour: number;
    x: number;
    y: number;
  } | null>(null);

  const { grid, tradeMap } = useMemo(
    () => calculateHourlyHeatmap(trades),
    [trades]
  );

  const maxAbsPnl = useMemo(() => {
    let max = 0;
    for (const row of grid)
      for (const cell of row)
        if (Math.abs(cell.pnl) > max) max = Math.abs(cell.pnl);
    return max;
  }, [grid]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const row of grid)
      for (const cell of row)
        if (cell.count > max) max = cell.count;
    return max;
  }, [grid]);

  const modalTrades = useMemo(() => {
    if (!selectedCell) return [];
    return tradeMap.get(selectedCell.day + "-" + selectedCell.hour) ?? [];
  }, [selectedCell, tradeMap]);

  const tooltipCell =
    tooltip ? grid[tooltip.day]?.[tooltip.hour] : null;

  const hasData = trades.length > 0;

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Zeit-Performance
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Wann gewinnst du, wann verlierst du?
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap",
                metric === m
                  ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                  : "bg-bg-card border border-bg-border text-zinc-500 hover:text-zinc-300"
              )}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm">
            Noch keine geschlossenen Trades für die Heatmap.
          </p>
        </div>
      ) : (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-4 overflow-x-auto">
          <div style={{ minWidth: "680px" }}>
            {/* Stunden-Header */}
            <div className="flex mb-1">
              <div className="w-7 flex-shrink-0" />
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[8px] text-zinc-600 leading-none"
                  style={{ minWidth: "26px" }}
                >
                  {h % 2 === 0 ? h : ""}
                </div>
              ))}
            </div>

            {/* Zeilen Mo-Fr */}
            {DAY_LABELS.map((dayLabel, dayIdx) => (
              <div key={dayIdx} className="flex items-center mb-0.5">
                <div className="w-7 flex-shrink-0 text-[10px] text-zinc-500 text-right pr-1.5">
                  {dayLabel}
                </div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = grid[dayIdx][hour];
                  const isEmpty = cell.count === 0;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex-1 rounded flex items-center justify-center text-[8px] font-medium transition-all select-none",
                        isEmpty ? "cursor-default" : "cursor-pointer hover:opacity-80 hover:ring-1 hover:ring-white/20"
                      )}
                      style={{
                        minWidth: "26px",
                        height: "26px",
                        margin: "1px",
                        backgroundColor: getCellBg(cell, metric, maxAbsPnl, maxCount),
                        color: isEmpty ? "transparent" : "#e4e4e7",
                      }}
                      onClick={() => !isEmpty && setSelectedCell({ day: dayIdx, hour })}
                      onMouseEnter={(e) => {
                        if (isEmpty) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          day: dayIdx,
                          hour,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {getCellLabel(cell, metric)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltip && tooltipCell && tooltipCell.count > 0 && (
        <div
          className="fixed z-50 pointer-events-none bg-bg-elevated border border-bg-border rounded-xl px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-[10px] text-zinc-400 mb-1">
            {DAY_LABELS[tooltip.day]}, {String(tooltip.hour).padStart(2, "0")}:00 Uhr
          </div>
          <div className={cn("text-sm font-bold", tooltipCell.pnl >= 0 ? "text-success" : "text-danger")}>
            {tooltipCell.pnl >= 0 ? "+" : ""}{formatCurrency(tooltipCell.pnl, currency)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {tooltipCell.count} {tooltipCell.count === 1 ? "Trade" : "Trades"}
            {" · "}
            {Math.round((tooltipCell.winCount / tooltipCell.count) * 100)}% Win
            {" · "}
            {tooltipCell.winCount}W / {tooltipCell.lossCount}L
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedCell && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setSelectedCell(null)}
          />
          <div className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50">
            <div className="bg-bg-card border border-bg-border rounded-t-2xl md:rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                    Zeitfenster
                  </div>
                  <div className="text-lg font-bold text-white">
                    {DAY_LABELS[selectedCell.day]}, {String(selectedCell.hour).padStart(2, "0")}:00{"–"}{String(selectedCell.hour).padStart(2, "0")}:59 Uhr
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-2 rounded-lg bg-bg-elevated border border-bg-border text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const cell = grid[selectedCell.day][selectedCell.hour];
                return (
                  <div className="flex items-center gap-4 mb-4 p-3 bg-bg-elevated border border-bg-border rounded-xl">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">P/L</div>
                      <div className={cn("text-base font-bold", cell.pnl >= 0 ? "text-success" : "text-danger")}>
                        {cell.pnl >= 0 ? "+" : ""}{formatCurrency(cell.pnl, currency)}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-bg-border" />
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Trades</div>
                      <div className="text-base font-bold text-white">{cell.count}</div>
                    </div>
                    <div className="w-px h-8 bg-bg-border" />
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Win Rate</div>
                      <div className="text-base font-bold text-white">
                        {Math.round((cell.winCount / cell.count) * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                {modalTrades.map((t) => (
                  <Link
                    key={t.id}
                    href={"/trades/" + t.id}
                    onClick={() => setSelectedCell(null)}
                    className="flex items-center justify-between p-3 bg-bg-elevated border border-bg-border rounded-xl hover:border-gold-500/30 transition group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0",
                          t.direction === "long"
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        )}
                      >
                        {t.direction === "long" ? "L" : "S"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white">{t.symbol}</div>
                        {t.entry_time && (
                          <div className="text-[10px] text-zinc-500">
                            {formatEntryTime(t.entry_time)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold flex-shrink-0 ml-3",
                        t.pnl_currency == null
                          ? "text-zinc-500"
                          : t.pnl_currency >= 0
                          ? "text-success"
                          : "text-danger"
                      )}
                    >
                      {t.pnl_currency != null
                        ? (t.pnl_currency >= 0 ? "+" : "") + formatCurrency(t.pnl_currency, currency)
                        : "—"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
