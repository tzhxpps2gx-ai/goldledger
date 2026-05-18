"use client";

import { useEffect, useRef, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { cn } from "@/lib/utils";

type Props = {
  entryTime: string | null;
  exitTime: string | null;
  plannedEntry: number | null;
  plannedStop: number | null;
  plannedTarget: number | null;
  actualEntry: number | null;
  actualExit: number | null;
  direction: "long" | "short";
  pnlCurrency: number | null;
};

type Status = "loading" | "ok" | "no-key" | "no-data" | "no-time" | "error";

function pickInterval(durationMs: number): string {
  if (durationMs < 30 * 60 * 1000) return "1min";
  if (durationMs < 4 * 60 * 60 * 1000) return "5min";
  return "15min";
}

export default function TradingViewChart({
  entryTime,
  exitTime,
  plannedEntry,
  plannedStop,
  plannedTarget,
  actualEntry,
  actualExit,
  direction,
  pnlCurrency,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!entryTime) {
      setStatus("no-time");
      return;
    }

    let cancelled = false;
    let chartCleanup: (() => void) | null = null;

    async function run() {
      const entry = new Date(entryTime!);
      const exit = exitTime
        ? new Date(exitTime)
        : new Date(entry.getTime() + 2 * 60 * 60 * 1000);

      const startDate = new Date(entry.getTime() - 30 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      const endDate = new Date(exit.getTime() + 30 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      const interval = pickInterval(exit.getTime() - entry.getTime());

      // Kerzen von unserer API-Route holen (API-Key bleibt serverseitig)
      let candles: { time: UTCTimestamp; open: number; high: number; low: number; close: number }[] = [];
      try {
        const res = await fetch(
          `/api/chart-data?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&interval=${interval}`
        );
        const json = await res.json();

        if (res.status === 503) {
          if (!cancelled) setStatus("no-key");
          return;
        }
        if (!res.ok || json.error) {
          if (!cancelled) setStatus("error");
          return;
        }
        candles = (json.candles ?? []).map((c: { time: number; open: number; high: number; low: number; close: number }) => ({
          ...c,
          time: c.time as UTCTimestamp,
        }));
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      if (candles.length === 0) {
        if (!cancelled) setStatus("no-data");
        return;
      }

      if (cancelled || !containerRef.current) return;

      const { createChart, CandlestickSeries, LineStyle } = await import("lightweight-charts");

      if (cancelled || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#71717a",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        crosshair: {
          vertLine: { color: "#D4AF37", labelBackgroundColor: "#D4AF37" },
          horzLine: { color: "#D4AF37", labelBackgroundColor: "#D4AF37" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
        timeScale: {
          borderColor: "rgba(255,255,255,0.08)",
          timeVisible: true,
          secondsVisible: false,
        },
        width: containerRef.current.clientWidth,
        height: 320,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });

      series.setData(candles);

      // Preis-Linien
      const entryPrice = actualEntry ?? plannedEntry;
      if (entryPrice != null) {
        series.createPriceLine({
          price: entryPrice,
          color: "#D4AF37",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "Entry",
        });
      }

      if (plannedStop != null) {
        series.createPriceLine({
          price: plannedStop,
          color: "#EF4444",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "SL",
        });
      }

      if (plannedTarget != null) {
        series.createPriceLine({
          price: plannedTarget,
          color: "#10B981",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "TP",
        });
      }

      if (actualExit != null) {
        series.createPriceLine({
          price: actualExit,
          color: pnlCurrency != null && pnlCurrency >= 0 ? "#10B981" : "#EF4444",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "Exit",
        });
      }

      chart.timeScale().fitContent();

      const observer = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      observer.observe(containerRef.current);

      if (!cancelled) setStatus("ok");

      chartCleanup = () => {
        observer.disconnect();
        chart.remove();
      };
    }

    run();

    return () => {
      cancelled = true;
      chartCleanup?.();
    };
  }, [entryTime, exitTime, plannedEntry, plannedStop, plannedTarget, actualEntry, actualExit, pnlCurrency]);

  const entryPrice = actualEntry ?? plannedEntry;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">XAUUSD · Candlestick-Chart</div>
          <div className="text-[10px] text-zinc-500">
            Powered by TradingView · Daten via TwelveData
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
            direction === "long"
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          )}
        >
          {direction === "long" ? "▲ LONG" : "▼ SHORT"}
        </div>
      </div>

      {/* Chart oder Status */}
      <div className="relative">
        {/* Chart-Container — immer im DOM, damit der Ref funktioniert */}
        <div
          className={cn(
            "px-3 pt-3 transition-opacity duration-300",
            status === "ok" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
          )}
        >
          <div ref={containerRef} />
        </div>

        {status === "loading" && (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            <div className="text-zinc-500 text-xs">Lade Kerzen-Daten…</div>
          </div>
        )}

        {status === "no-key" && (
          <div className="py-12 px-6 text-center space-y-2">
            <div className="text-2xl">🔑</div>
            <div className="text-sm font-medium text-white">API-Key fehlt</div>
            <div className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Trage{" "}
              <code className="text-gold-400 font-mono">TWELVEDATA_API_KEY</code> in Vercel
              unter <em>Settings → Environment Variables</em> ein und redeploye.
            </div>
          </div>
        )}

        {status === "no-data" && (
          <div className="py-12 px-6 text-center space-y-1">
            <div className="text-sm font-medium text-zinc-300">Keine Kerzen verfügbar</div>
            <div className="text-xs text-zinc-500">
              Markt evtl. geschlossen oder Datenlücke bei TwelveData
            </div>
          </div>
        )}

        {status === "no-time" && (
          <div className="py-12 text-center text-zinc-500 text-sm">
            Keine Entry-Zeit — Chart nicht möglich
          </div>
        )}

        {status === "error" && (
          <div className="py-12 px-6 text-center space-y-1">
            <div className="text-sm text-zinc-400">Chart konnte nicht geladen werden</div>
            <div className="text-xs text-zinc-500">Seite neu laden oder API-Key prüfen</div>
          </div>
        )}
      </div>

      {/* Legende */}
      {status === "ok" && (
        <div className="px-5 py-3 border-t border-bg-border flex flex-wrap gap-x-4 gap-y-1">
          {entryPrice != null && <LegendLine color="#D4AF37" label="Entry" />}
          {plannedStop != null && <LegendLine color="#EF4444" label="Stop Loss" dashed />}
          {plannedTarget != null && <LegendLine color="#10B981" label="Take Profit" dashed />}
          {actualExit != null && (
            <LegendLine
              color={pnlCurrency != null && pnlCurrency >= 0 ? "#10B981" : "#EF4444"}
              label="Exit"
            />
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-3 h-3 rounded-sm bg-success/80" />
            <span className="text-[10px] text-zinc-500">Bull</span>
            <div className="w-3 h-3 rounded-sm bg-danger/80 ml-1.5" />
            <span className="text-[10px] text-zinc-500">Bear</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendLine({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-0.5"
        style={{
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0, ${color} 3px, transparent 3px, transparent 6px)`
            : color,
        }}
      />
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}
