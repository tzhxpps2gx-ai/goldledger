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
    if (!entry || !plannedStop || !plannedTarget) return null;

    const isLong = direction === "long";

    // Bei Long: TP oben, SL unten. Bei Short: umgekehrt
    const top = isLong ? plannedTarget : plannedStop;
    const bottom = isLong ? plannedStop : plannedTarget;
    const range = top - bottom;
    if (range <= 0) return null;

    // Position der Elemente in % (0 = unten, 100 = oben)
    const yPercent = (price: number) => ((price - bottom) / range) * 100;

    return {
      entry,
      isLong,
      top,
      bottom,
      yEntry: yPercent(entry),
      ySl: yPercent(plannedStop),
      yTp: yPercent(plannedTarget),
      yExit: actualExit ? yPercent(actualExit) : null,
      plannedStop,
      plannedTarget,
    };
  }, [direction, plannedEntry, plannedStop, plannedTarget, actualEntry, actualExit]);

  if (!data) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center text-zinc-500 text-sm">
        Trade-Visualisierung benötigt Entry, Stop und Target.
      </div>
    );
  }

  const { entry, isLong, yEntry, ySl, yTp, yExit, plannedStop, plannedTarget } = data;

  // Berechne Höhen der Zonen (relativ zum Chart)
  const chartHeight = 280;
  const px = (percent: number) => chartHeight - (percent / 100) * chartHeight;

  // SL und TP Zonen
  const tpZoneTop = px(Math.max(yEntry, yTp));
  const tpZoneBottom = px(Math.min(yEntry, yTp));
  const slZoneTop = px(Math.max(yEntry, ySl));
  const slZoneBottom = px(Math.min(yEntry, ySl));

  // Welche Zone ist Gewinn / Verlust?
  // Long: TP-Zone (oben) ist Gewinn, SL-Zone (unten) ist Verlust
  // Short: TP-Zone (unten) ist Gewinn, SL-Zone (oben) ist Verlust
  const tpIsWinZone = isLong ? yTp > yEntry : yTp < yEntry;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
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
          {/* TP-Zone */}
          <div
            className={cn(
              "absolute left-0 right-0 transition-all",
              tpIsWinZone ? "bg-success/10" : "bg-danger/10"
            )}
            style={{
              top: tpZoneTop + "px",
              height: tpZoneBottom - tpZoneTop + "px",
            }}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-50",
                tpIsWinZone
                  ? "bg-gradient-to-b from-success/20 to-transparent"
                  : "bg-gradient-to-b from-danger/20 to-transparent"
              )}
            />
          </div>

          {/* SL-Zone */}
          <div
            className={cn(
              "absolute left-0 right-0 transition-all",
              tpIsWinZone ? "bg-danger/10" : "bg-success/10"
            )}
            style={{
              top: slZoneTop + "px",
              height: slZoneBottom - slZoneTop + "px",
            }}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-50",
                tpIsWinZone
                  ? "bg-gradient-to-t from-danger/20 to-transparent"
                  : "bg-gradient-to-t from-success/20 to-transparent"
              )}
            />
          </div>

          {/* TP-Linie */}
          <PriceLine
            y={px(yTp)}
            label="TP"
            price={plannedTarget}
            color={tpIsWinZone ? "success" : "danger"}
            style="dashed"
          />

          {/* Entry-Linie */}
          <PriceLine
            y={px(yEntry)}
            label="ENTRY"
            price={entry}
            color="gold"
            style="solid"
            prominent
          />

          {/* SL-Linie */}
          <PriceLine
            y={px(ySl)}
            label="SL"
            price={plannedStop}
            color={tpIsWinZone ? "danger" : "success"}
            style="dashed"
          />

          {/* Exit-Linie (falls vorhanden) */}
          {yExit !== null && actualExit !== null && (
            <PriceLine
              y={px(yExit)}
              label="EXIT"
              price={actualExit}
              color={pnlCurrency && pnlCurrency >= 0 ? "success" : "danger"}
              style="solid"
              prominent
            />
          )}
        </div>

        {/* Stats unter Chart */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatBox
            label="Risk"
            value={formatPriceDiff(entry, plannedStop)}
            sublabel="Pips"
            color="danger"
          />
          <StatBox
            label="Reward"
            value={formatPriceDiff(plannedTarget, entry)}
            sublabel="Pips"
            color="success"
          />
          <StatBox
            label="P/L"
            value={
              pnlCurrency != null
                ? (pnlCurrency >= 0 ? "+" : "") + formatCurrency(pnlCurrency, currency)
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
      className="absolute left-0 right-0 flex items-center pointer-events-none"
      style={{ top: y + "px", transform: "translateY(-50%)" }}
    >
      {/* Label links */}
      <div
        className={cn(
          "ml-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
          c.bg,
          c.text,
          prominent && "shadow-lg"
        )}
      >
        {label}
      </div>

      {/* Linie */}
      <div
        className={cn(
          "flex-1 mx-2",
          c.line,
          style === "dashed" ? "h-[1px]" : "h-[2px]",
          style === "dashed" &&
            "opacity-50 [background-image:repeating-linear-gradient(to_right,currentColor_0,currentColor_4px,transparent_4px,transparent_8px)] !bg-transparent",
          prominent && style === "solid" && "shadow-[0_0_8px_currentColor]"
        )}
        style={
          style === "dashed"
            ? {
                color: color === "success" ? "#10B981" : color === "danger" ? "#EF4444" : "#DEBF44",
                backgroundColor: "transparent",
              }
            : undefined
        }
      />

      {/* Preis rechts */}
      <div
        className={cn(
          "mr-3 px-2 py-0.5 rounded font-mono text-[11px] font-bold border",
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

function formatPriceDiff(a: number, b: number): string {
  const diff = Math.abs(a - b);
  // XAUUSD: 1 Punkt = 10 Pips, also wenn Diff 5.50 → 55 Pips
  // Bzw. einfacher: zeige direkt die Punkte-Differenz
  return diff.toFixed(2);
}
