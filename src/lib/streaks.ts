import type { StreakMode } from "@/lib/userPreferences";

export type { StreakMode };

export type StreakResult = {
  currentWinStreak: number;
  bestWinStreak: number;
  currentWinDayStreak: number;
  bestWinDayStreak: number;
  currentLossFreeDayStreak: number;
  bestLossFreeDayStreak: number;
};

type TradeLike = {
  pnl_currency: number | null;
  exit_time: string | null;
  status: string;
};

function toBerlinDate(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(iso)
  );
}

function getTodayBerlin(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date()
  );
}

function isWeekday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow >= 1 && dow <= 5;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n, 12));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return yy + "-" + mm + "-" + dd;
}

export function calculateStreaks(
  trades: TradeLike[],
  options: { mode?: StreakMode } = {}
): StreakResult {
  const mode = options.mode ?? "trading_only";

  const closed = trades.filter(
    (t) =>
      t.status === "closed" &&
      t.exit_time != null &&
      t.pnl_currency != null
  );

  if (closed.length === 0) {
    return {
      currentWinStreak: 0,
      bestWinStreak: 0,
      currentWinDayStreak: 0,
      bestWinDayStreak: 0,
      currentLossFreeDayStreak: 0,
      bestLossFreeDayStreak: 0,
    };
  }

  const sorted = [...closed].sort((a, b) =>
    a.exit_time!.localeCompare(b.exit_time!)
  );

  // ── Trade-Win-Streak ─────────────────────────────────────────────────────
  let bestWinStreak = 0;
  let run = 0;
  for (const t of sorted) {
    if ((t.pnl_currency ?? 0) > 0) { run++; bestWinStreak = Math.max(bestWinStreak, run); }
    else run = 0;
  }
  let currentWinStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if ((sorted[i].pnl_currency ?? 0) > 0) currentWinStreak++;
    else break;
  }

  // ── Day-Aggregation ───────────────────────────────────────────────────────
  const dayPnl = new Map<string, number>();
  for (const t of sorted) {
    const d = toBerlinDate(t.exit_time!);
    dayPnl.set(d, (dayPnl.get(d) ?? 0) + (t.pnl_currency ?? 0));
  }
  const tradingDays = [...dayPnl.keys()].sort();
  const today = getTodayBerlin();
  const yesterday = addDays(today, -1);
  const firstDay = tradingDays[0];

  // ── Helper: run through sorted trading days ───────────────────────────────
  function calcDayStreakTradingOnly(winning: boolean): { current: number; best: number } {
    let best = 0; let r = 0;
    for (const d of tradingDays) {
      const pnl = dayPnl.get(d) ?? 0;
      if (winning ? pnl > 0 : pnl >= 0) { r++; best = Math.max(best, r); } else r = 0;
    }
    let current = 0;
    for (let i = tradingDays.length - 1; i >= 0; i--) {
      const pnl = dayPnl.get(tradingDays[i]) ?? 0;
      if (winning ? pnl > 0 : pnl >= 0) current++;
      else break;
    }
    return { current, best };
  }

  function calcDayStreakAllWeekdays(winning: boolean): { current: number; best: number } {
    let best = 0; let r = 0;
    let cur = firstDay;
    while (cur <= today) {
      if (isWeekday(cur)) {
        const pnl = dayPnl.get(cur);
        if (pnl !== undefined && (winning ? pnl > 0 : pnl >= 0)) {
          r++; best = Math.max(best, r);
        } else { r = 0; }
      }
      cur = addDays(cur, 1);
    }
    let current = 0;
    let check = yesterday;
    while (check >= firstDay) {
      if (!isWeekday(check)) { check = addDays(check, -1); continue; }
      const pnl = dayPnl.get(check);
      if (pnl !== undefined && (winning ? pnl > 0 : pnl >= 0)) {
        current++;
        check = addDays(check, -1);
      } else break;
    }
    return { current, best };
  }

  const winDay = mode === "trading_only"
    ? calcDayStreakTradingOnly(true)
    : calcDayStreakAllWeekdays(true);

  const lossFreeDay = mode === "trading_only"
    ? calcDayStreakTradingOnly(false)
    : calcDayStreakAllWeekdays(false);

  return {
    currentWinStreak,
    bestWinStreak,
    currentWinDayStreak: winDay.current,
    bestWinDayStreak: winDay.best,
    currentLossFreeDayStreak: lossFreeDay.current,
    bestLossFreeDayStreak: lossFreeDay.best,
  };
}
