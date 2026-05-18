"use client";

import { useEffect, useRef, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { cn } from "@/lib/utils";
import TradeChart from "@/components/TradeChart";

// Nur die Felder die der Chart braucht — Subset der Supabase-Trades-Tabelle
export type TradeForChart = {
  entry_time: string | null;
  exit_time: string | null;
  planned_entry: number | null;
  planned_stop: number | null;
  planned_target: number | null;
  actual_entry: number | null;
  actual_exit: number | null;
  direction: "long" | "short";
  pnl_currency: number | null;
  r_multiple: number | null;
  lot_size: number | null;
};

type Props = {
  trade: TradeForChart;
  currency: string;
};

// Mögliche Lade- und Fehlerzustände
type Status = "loading" | "ok" | "no-key" | "no-data" | "no-time" | "error";

export default function TradeChartLive({ trade, currency }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  const {
    entry_time,
    exit_time,
    planned_entry,
    planned_stop,
    planned_target,
    actual_entry,
    actual_exit,
    direction,
    pnl_currency,
    r_multiple,
    lot_size,
  } = trade;

  useEffect(() => {
    if (!entry_time) {
      setStatus("no-time");
      return;
    }

    let cancelled = false;
    let chartCleanup: (() => void) | null = null;

    async function run() {
      // Kerzen von unserer sicheren API-Route laden
      const params = new URLSearchParams({ entryTime: entry_time! });
      if (exit_time) params.set("exitTime", exit_time);

      let candles: {
        time: UTCTimestamp;
        open: number;
        high: number;
        low: number;
        close: number;
      }[] = [];

      try {
        const res = await fetch("/api/gold-candles?" + params.toString());
        const json = await res.json();

        if (res.status === 503) {
          if (!cancelled) setStatus("no-key");
          return;
        }
        if (!res.ok || json.error) {
          if (!cancelled) setStatus("error");
          return;
        }

        candles = (json.candles ?? []).map(
          (c: { time: number; open: number; high: number; low: number; close: number }) => ({
            ...c,
            time: c.time as UTCTimestamp,
          })
        );
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      if (candles.length === 0) {
        if (!cancelled) setStatus("no-data");
        return;
      }

      if (cancelled || !containerRef.current) return;

      // lightweight-charts dynamisch importieren — läuft nur im Browser
      const { createChart, CandlestickSeries, LineStyle } = await import(
        "lightweight-charts"
      );

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
        // Gold-Akzent für Crosshair passend zum Design
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

      // Candlestick-Serie mit Dark-Mode-Farben
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });

      series.setData(candles);

      // Preis-Linien — Entry, Stop, Target, Exit
      const entryPrice = actual_entry ?? planned_entry;
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

      if (planned_stop != null) {
        series.createPriceLine({
          price: planned_stop,
          color: "#EF4444",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "SL",
        });
      }

      if (planned_target != null) {
        series.createPriceLine({
          price: planned_target,
          color: "#10B981",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "TP",
        });
      }

      if (actual_exit != null) {
        // Exit-Linie: grün bei Gewinn, rot bei Verlust
        const exitColor =
          pnl_currency != null && pnl_currency >= 0 ? "#10B981" : "#EF4444";
        series.createPriceLine({
          price: actual_exit,
          color: exitColor,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "Exit",
        });
      }

      chart.timeScale().fitContent();

      // Bei Größenänderung des Containers neu zeichnen
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
  }, [
    entry_time,
    exit_time,
    planned_entry,
    planned_stop,
    planned_target,
    actual_entry,
    actual_exit,
    pnl_currency,
  ]);

  // Fallback: bei Fehler oder fehlenden Daten auf TradeChart zurückfallen
  const showFallback =
    status === "error" ||
    status === "no-key" ||
    status === "no-data" ||
    status === "no-time";

  if (showFallback) {
    return (
      <div className="space-y-3">
        {/* Hinweis warum der Live-Chart nicht lädt */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-xs text-zinc-500">
          <span className="text-base">
            {status === "no-key" ? "🔑" : "📊"}
          </span>
          {status === "no-key" && (
            <span>
              Live-Chart: <code className="text-gold-400">TWELVEDATA_API_KEY</code> in Vercel fehlt.
              Schematische Darstellung als Fallback:
            </span>
          )}
          {status === "no-data" && (
            <span>Keine TwelveData-Kerzen für diesen Zeitraum — schematische Darstellung:</span>
          )}
          {status === "no-time" && (
            <span>Keine Entry-Zeit gesetzt — schematische Darstellung:</span>
          )}
          {status === "error" && (
            <span>Live-Chart konnte nicht geladen werden — schematische Darstellung:</span>
          )}
        </div>
        <TradeChart
          direction={direction}
          plannedEntry={planned_entry}
          plannedStop={planned_stop}
          plannedTarget={planned_target}
          actualEntry={actual_entry}
          actualExit={actual_exit}
          pnlCurrency={pnl_currency}
          rMultiple={r_multiple}
          lotSize={lot_size}
          currency={currency}
        />
      </div>
    );
  }

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

      {/* Ladeanimation */}
      {status === "loading" && (
        <div className="py-14 flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <div className="text-zinc-500 text-xs">Lade Kerzen-Daten…</div>
        </div>
      )}

      {/* Chart-Container — immer im DOM damit der Ref sofort verfügbar ist */}
      <div
        className={cn(
          "px-3 pt-3 transition-opacity duration-300",
          status === "ok" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
        )}
      >
        <div ref={containerRef} />
      </div>

      {/* Legende unter dem Chart */}
      {status === "ok" && (
        <div className="px-5 py-3 border-t border-bg-border flex flex-wrap gap-x-4 gap-y-1">
          {(actual_entry ?? planned_entry) != null && (
            <LegendLine color="#D4AF37" label="Entry" />
          )}
          {planned_stop != null && (
            <LegendLine color="#EF4444" label="Stop Loss" dashed />
          )}
          {planned_target != null && (
            <LegendLine color="#10B981" label="Take Profit" dashed />
          )}
          {actual_exit != null && (
            <LegendLine
              color={pnl_currency != null && pnl_currency >= 0 ? "#10B981" : "#EF4444"}
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
  const gradientStyle = dashed
    ? {
        background:
          "repeating-linear-gradient(to right, " +
          color +
          " 0, " +
          color +
          " 3px, transparent 3px, transparent 6px)",
      }
    : { background: color };

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-0.5" style={gradientStyle} />
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}
