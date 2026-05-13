"use client";

import { useMemo } from "react";
import { cn, formatCurrency } from "@/lib/utils";

type TradeChartProps = {
  direction: "long" | "short";
  plannedEntry: number | null;
  plannedStop: number | null;
  plannedTarget: number | null;
  actualEntry: number | null;
  actualExit: number | null;
  pnlCurrency: number | null;
  rMultiple: number | null;
  lotSize: number | null;
  currency: string;
};

export default function TradeChart({
  direction,
  plannedEntry,
  plannedStop,
  plannedTarget,
  actualEntry,
  actualExit,
  pnlCurrency,
  rMultiple,
  lotSize,
  currency,
}: TradeChartProps) {
  const data = useMemo(() => {
    const entry = actualEntry ?? plannedEntry;
    if (!entry) return null;

    const isLong = direction === "long";

    // Alle vorhandenen Preise sammeln
    const prices: number[] = [entry];
    if (plannedStop != null) prices.push(plannedStop);
    if (plannedTarget != null) prices.push(plannedTarget);
    if (actualExit != null) prices.push(actualExit);

    // Wenn nur Entry → künstliche Range
    if (prices.length === 1) {
      const padding = Math.max(entry * 0.003, 1);
      prices.push(entry + padding);
      prices.push(entry - padding);
    }

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;
    const padding = Math.max(range * 0.2, 0.5);

    const displayMax = maxPrice + padding;
    const displayMin = minPrice - padding;
    const displayRange = displayMax - displayMin;

    const yPercent = (price: number) =>
      ((price - displayMin) / displayRange) * 100;

    return {
      entry,
      isLong,
      yEntry: yPercent(entry),
      ySl: plannedStop != null ? yPercent(plannedStop) : null,
      yTp: plannedTarget != null ? yPercent(plannedTarget) : null,
      yExit: actualExit != null ? yPercent(actualExit) : null,
    };
  }, [direction, plannedEntry, plannedStop, plannedTarget, actualEntry, actualExit]);

  if (!data) return null;

  const { entry, isLong, yEntry, ySl, yTp, yExit } = data;

  const chartHeight = 280;
  const px = (percent: number) => chartHeight - (percent / 100) * chartHeight;

  // Zonen-Berechnungen (nur wenn entsprechende Linien existieren)
  const tpZone =
    yTp !== null
      ? {
          top: px(Math.max(yEntry, yTp)),
          bottom: px(Math.min(yEntry, yTp)),
        }
      : null;
  const slZone =
    ySl !== null
      ? {
          top: px(Math.max(yEntry, ySl)),
          bottom: px(Math.min(yEntry, ySl)),
        }
      : null;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
              isLong ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}
          >
            {isLong ? "▲ LONG" : "▼ SHORT"}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Trade-Visualisierung</div>
            <div className="text-[10px] text-zinc-500">
              XAUUSD · {lotSize ?? 0.01} Lot
            </div>
          </div>
        </div>
        {rMultiple != null && (
          <div className="text-right">
            <div
              className={cn(
                "text-base font-bold",
                rMultiple >= 0 ? "text-success" : "text-danger"
              )}
            >
              {rMultiple >= 0 ? "+" : ""}
              {rMultiple}R
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Ergebnis
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative p-5">
        <div
          className="relative bg-bg-elevated rounded-xl overflow-hidden"
          style={{ height: chartHeight + "px" }}
        >
          {/* TP-Zone (grün, nur wenn TP vorhanden) */}
          {tpZone && (
            <div
              className="absolute left-0 right-0 bg-success/10 animate-fade-in"
              style={{
                top: tpZone.top + "px",
                height: tpZone.bottom - tpZone.top + "px",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-success/20 to-transparent opacity-60" />
            </div>
          )}

          {/* SL-Zone (rot, nur wenn SL vorhanden) */}
          {slZone && (
            <div
              className="absolute left-0 right-0 bg-danger/10 animate-fade-in"
              style={{
                top: slZone.top + "px",
                height: slZone.bottom - slZone.top + "px",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-danger/20 to-transparent opacity-60" />
            </div>
          )}

          {/* TP-Linie */}
          {yTp !== null && plannedTarget != null && (
            <PriceLine
              y={px(yTp)}
              label="TP"
              price={plannedTarget}
              color="success"
              style="dashed"
            />
          )}

          {/* Entry-Linie (immer) */}
          <PriceLine
            y={px(yEntry)}
            label="ENTRY"
            price={entry}
            color="gold"
            style="solid"
            prominent
          />

          {/* SL-Linie */}
          {ySl !== null && plannedStop != null && (
            <PriceLine
              y={px(ySl)}
              label="SL"
              price={plannedStop}
              color="danger"
              style="dashed"
            />
          )}

          {/* Exit-Linie */}
          {yExit !== null && actualExit != null && (
            <PriceLine
              y={px(yExit)}
              label="EXIT"
              price={actualExit}
              color={pnlCurrency != null && pnlCurrency >= 0 ? "success" : "danger"}
              style="solid"
              prominent
            />
          )}

          {/* Hinweis falls wenig Daten */}
          {ySl === null && yTp === null && (
            <div className="absolute bottom-3 left-3 right-3 bg-bg-card/80 backdrop-blur border border-bg-border rounded-lg px-3 py-2 text-[10px] text-zinc-400 text-center">
              💡 Trag Stop und Target ein für die volle Visualisierung
            </div>
          )}
        </div>

        {/* Stats unter Chart */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatBox
            label="Risk"
            value={
              plannedStop != null
                ? Math.abs(entry - plannedStop).toFixed(2)
                : "—"
            }
            sublabel="Punkte"
            color="danger"
          />
          <StatBox
            label="Reward"
            value={
              plannedTarget != null
                ? Math.abs(plannedTarget - entry).toFixed(2)
                : "—"
            }
            sublabel="Punkte"
            color="success"
          />
          <StatBox
            label="P/L"
            value={
              pnlCurrency != null
                ? (pnlCurrency >= 0 ? "+" : "") +
                  formatCurrency(pnlCurrency, currency)
                : "—"
            }
            sublabel={lotSize ? `${lotSize} Lot` : ""}
            color={
              pnlCurrency != null
                ? pnlCurrency >= 0
                  ? "success"
                  : "danger"
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

function PriceLine({
  y,
  label,
  price,
  color,
  style,
  prominent,
}: {
  y: number;
  label: string;
  price: number;
  color: "success" | "danger" | "gold";
  style: "solid" | "dashed";
  prominent?: boolean;
}) {
  const colorClasses = {
    success: { line: "bg-success", text: "text-success", bg: "bg-success/20 border-success/40" },
    danger: { line: "bg-danger", text: "text-danger", bg: "bg-danger/20 border-danger/40" },
    gold: { line: "bg-gold-400", text: "text-gold-400", bg: "bg-gold-500/20 border-gold-500/40" },
  };
  const c = colorClasses[color];

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none animate-fade-in"
      style={{ top: y + "px", transform: "translateY(-50%)" }}
    >
      <div
        className={cn(
          "ml-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap",
          c.bg,
          c.text,
          prominent && "shadow-lg"
        )}
      >
        {label}
      </div>
      <div className="flex-1 mx-2 relative h-[2px]">
        {style === "solid" ? (
          <div
            className={cn(
              "absolute inset-0 rounded",
              c.line,
              prominent && color === "gold" && "shadow-[0_0_8px_rgba(212,175,55,0.6)]"
            )}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${
                color === "success" ? "#10B981" : color === "danger" ? "#EF4444" : "#DEBF44"
              } 0, ${
                color === "success" ? "#10B981" : color === "danger" ? "#EF4444" : "#DEBF44"
              } 5px, transparent 5px, transparent 10px)`,
            }}
          />
        )}
      </div>
      <div
        className={cn(
          "mr-3 px-2 py-0.5 rounded font-mono text-[11px] font-bold border whitespace-nowrap",
          c.bg,
          c.text
        )}
      >
        {price.toFixed(2)}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string;
  sublabel?: string;
  color?: "success" | "danger";
}) {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5">
      <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-bold tracking-tight mt-0.5",
          color === "success" && "text-success",
          color === "danger" && "text-danger",
          !color && "text-white"
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
