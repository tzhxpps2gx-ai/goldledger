"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateStreaks } from "@/lib/streaks";
import type { StreakMode } from "@/lib/userPreferences";

type TradeLike = {
  pnl_currency: number | null;
  exit_time: string | null;
  status: string;
};

export default function StreakWidget({
  trades,
  mode,
}: {
  trades: TradeLike[];
  mode: StreakMode;
}) {
  const streaks = useMemo(
    () => calculateStreaks(trades, { mode }),
    [trades, mode]
  );

  const [newBest, setNewBest] = useState({
    win: false,
    day: false,
    lossFree: false,
  });

  useEffect(() => {
    const nb = {
      win:
        streaks.currentWinStreak > 0 &&
        streaks.currentWinStreak === streaks.bestWinStreak,
      day:
        streaks.currentWinDayStreak > 0 &&
        streaks.currentWinDayStreak === streaks.bestWinDayStreak,
      lossFree:
        streaks.currentLossFreeDayStreak > 0 &&
        streaks.currentLossFreeDayStreak === streaks.bestLossFreeDayStreak,
    };
    setNewBest(nb);
    if (nb.win || nb.day || nb.lossFree) {
      const t = setTimeout(
        () => setNewBest({ win: false, day: false, lossFree: false }),
        3000
      );
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const modeLabel =
    mode === "trading_only" ? "Nur Trading-Tage" : "Alle Werktage";

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Streaks</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Aktuelle Serien</p>
        </div>
        <Link
          href="/settings"
          className="text-[10px] text-zinc-500 hover:text-gold-400 transition"
        >
          {modeLabel} · ändern →
        </Link>
      </div>

      <div className="grid grid-cols-3 divide-x divide-bg-border">
        <StreakCard
          label="Gewinn-Serie"
          icon={Flame}
          current={streaks.currentWinStreak}
          best={streaks.bestWinStreak}
          unit="Trades"
          isNewBest={newBest.win}
        />
        <StreakCard
          label="Gewinn-Tage"
          icon={TrendingUp}
          current={streaks.currentWinDayStreak}
          best={streaks.bestWinDayStreak}
          unit="Tage"
          isNewBest={newBest.day}
        />
        <StreakCard
          label="Verlust-frei"
          icon={Shield}
          current={streaks.currentLossFreeDayStreak}
          best={streaks.bestLossFreeDayStreak}
          unit="Tage"
          isNewBest={newBest.lossFree}
        />
      </div>
    </div>
  );
}

function StreakCard({
  label,
  icon: Icon,
  current,
  best,
  unit,
  isNewBest,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  current: number;
  best: number;
  unit: string;
  isNewBest: boolean;
}) {
  const active = current > 0;

  return (
    <div className={cn("px-4 py-4 relative", active && "bg-gold-500/[0.03]")}>
      {isNewBest && (
        <div className="absolute top-2 right-2 text-[8px] font-bold text-gold-400 bg-gold-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
          New Best!
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-2">
        <Icon
          className={cn(
            "w-3.5 h-3.5",
            active ? "text-gold-400 animate-pulse" : "text-zinc-600"
          )}
          style={
            active
              ? { filter: "drop-shadow(0 0 6px rgba(212,175,55,0.7))" }
              : undefined
          }
        />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>

      <div
        className={cn(
          "text-2xl font-bold",
          active ? "text-gold-400" : "text-zinc-600"
        )}
      >
        {current}
      </div>
      <div className="text-[10px] text-zinc-600 mt-0.5">
        Beste: {best} {unit}
      </div>
    </div>
  );
}
