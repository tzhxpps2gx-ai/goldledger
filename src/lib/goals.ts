export type GoalType = "net_pnl" | "trade_count" | "win_rate";
export type PeriodType = "daily" | "weekly" | "monthly" | "custom";
export type GoalStatus = "active" | "achieved" | "missed" | "upcoming";

export type Goal = {
  id: string;
  user_id: string;
  account_id: string | null;
  goal_type: GoalType;
  target_value: number;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
};

export type GoalProgress = {
  current: number;
  target: number;
  percent: number;
  achieved: boolean;
};

export type TradeLike = {
  account_id: string;
  pnl_currency: number | null;
  status: string;
  exit_time: string | null;
};

export const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: "T\u00e4glich",
  weekly: "W\u00f6chentlich",
  monthly: "Monatlich",
  custom: "Individuell",
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  net_pnl: "Netto P/L",
  trade_count: "Anzahl Trades",
  win_rate: "Win Rate",
};

export const GOAL_TYPE_UNITS: Record<GoalType, string> = {
  net_pnl: "\u20ac",
  trade_count: "Trades",
  win_rate: "%",
};

export const PERIOD_SORT_ORDER: Record<PeriodType, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  custom: 3,
};

function toIsoDate(date: Date, tz = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(date);
}

export function getTodayBerlin(): string {
  return toIsoDate(new Date());
}

export function getCurrentPeriodBounds(
  periodType: Exclude<PeriodType, "custom">
): { start: string; end: string } {
  const now = new Date();
  const today = toIsoDate(now);

  if (periodType === "daily") {
    return { start: today, end: today };
  }

  if (periodType === "weekly") {
    const dow = new Date(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(now)
    ).getDay();
    const diffToMon = (dow + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: toIsoDate(mon), end: toIsoDate(sun) };
  }

  if (periodType === "monthly") {
    const [y, m] = today.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const mm = String(m).padStart(2, "0");
    return {
      start: y + "-" + mm + "-01",
      end: y + "-" + mm + "-" + String(lastDay).padStart(2, "0"),
    };
  }

  return { start: today, end: today };
}

export function isGoalActive(goal: Goal): boolean {
  const today = getTodayBerlin();
  return goal.is_active && goal.period_start <= today && goal.period_end >= today;
}

export function calculateGoalProgress(
  goal: Goal,
  allTrades: TradeLike[]
): GoalProgress {
  const trades = allTrades.filter((t) => {
    if (goal.account_id && t.account_id !== goal.account_id) return false;
    const dateStr = t.exit_time ? t.exit_time.slice(0, 10) : null;
    if (!dateStr) return false;
    return dateStr >= goal.period_start && dateStr <= goal.period_end;
  });

  const closed = trades.filter((t) => t.status === "closed");
  let current = 0;

  if (goal.goal_type === "net_pnl") {
    current = closed.reduce((sum, t) => sum + (t.pnl_currency ?? 0), 0);
  } else if (goal.goal_type === "trade_count") {
    current = closed.length;
  } else if (goal.goal_type === "win_rate") {
    const wins = closed.filter((t) => (t.pnl_currency ?? 0) > 0).length;
    current = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  }

  const target = goal.target_value;
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return { current, target, percent, achieved: current >= target };
}

export function getGoalStatus(goal: Goal, trades: TradeLike[]): GoalStatus {
  const today = getTodayBerlin();
  if (goal.period_start > today) return "upcoming";
  const progress = calculateGoalProgress(goal, trades);
  if (progress.achieved) return "achieved";
  if (goal.period_end < today) return "missed";
  return "active";
}
