import { MONTH_NAMES } from "./reviewTemplates";

export type Review = {
  id: string;
  user_id: string;
  period_type: "weekly" | "monthly";
  period_start: string;
  period_end: string;
  status: "draft" | "submitted";
  answers: Record<string, string>;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewTrade = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  pnl_currency: number | null;
  r_multiple: number | null;
  entry_time: string | null;
  exit_time: string | null;
  status: string;
};

export type ReviewStats = {
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgRMultiple: number | null;
  bestTrade: ReviewTrade | null;
  worstTrade: ReviewTrade | null;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
};

function getTodayBerlin(): Date {
  const s = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
  return new Date(s.split(" ")[0] + "T00:00:00");
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

export function getPeriodLabel(periodType: "weekly" | "monthly", periodEnd: string): string {
  const d = new Date(periodEnd + "T12:00:00");
  if (periodType === "weekly") {
    return "KW " + getISOWeek(d) + " · " + d.getFullYear();
  }
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

export function getCurrentPeriodBounds(
  periodType: "weekly" | "monthly"
): { start: string; end: string } {
  const today = getTodayBerlin();
  if (periodType === "weekly") {
    const day = today.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = addDays(today, offset);
    return { start: toISO(monday), end: toISO(addDays(monday, 6)) };
  }
  const y = today.getFullYear();
  const m = today.getMonth();
  return {
    start: toISO(new Date(y, m, 1)),
    end: toISO(new Date(y, m + 1, 0)),
  };
}

export function getPreviousPeriodBounds(
  periodType: "weekly" | "monthly"
): { start: string; end: string } {
  const today = getTodayBerlin();
  if (periodType === "weekly") {
    const day = today.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    const thisMonday = addDays(today, offset);
    const lastMonday = addDays(thisMonday, -7);
    return { start: toISO(lastMonday), end: toISO(addDays(lastMonday, 6)) };
  }
  const y = today.getFullYear();
  const m = today.getMonth();
  const prevMonth = m === 0 ? 11 : m - 1;
  const prevYear = m === 0 ? y - 1 : y;
  return {
    start: toISO(new Date(prevYear, prevMonth, 1)),
    end: toISO(new Date(prevYear, prevMonth + 1, 0)),
  };
}

export function calculateReviewStats(
  trades: ReviewTrade[],
  periodStart: string,
  periodEnd: string
): ReviewStats {
  const start = new Date(periodStart + "T00:00:00");
  const end = new Date(periodEnd + "T23:59:59");

  const filtered = trades.filter((t) => {
    if (t.status !== "closed" || !t.exit_time || t.pnl_currency == null) return false;
    const dt = new Date(t.exit_time);
    return dt >= start && dt <= end;
  });

  const totalPnl = filtered.reduce((s, t) => s + (t.pnl_currency ?? 0), 0);
  const winCount = filtered.filter((t) => (t.pnl_currency ?? 0) > 0).length;
  const lossCount = filtered.filter((t) => (t.pnl_currency ?? 0) < 0).length;
  const winRate = filtered.length > 0 ? (winCount / filtered.length) * 100 : 0;

  const rValues = filtered
    .map((t) => t.r_multiple)
    .filter((r): r is number => r !== null);
  const avgRMultiple =
    rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null;

  const sorted = [...filtered].sort(
    (a, b) => (b.pnl_currency ?? 0) - (a.pnl_currency ?? 0)
  );
  const bestTrade = sorted[0] ?? null;
  const worstTrade = sorted[sorted.length - 1] ?? null;

  const dayMap = new Map<string, number>();
  for (const t of filtered) {
    if (!t.exit_time) continue;
    const berlinStr = new Date(t.exit_time).toLocaleString("sv-SE", {
      timeZone: "Europe/Berlin",
    });
    const dateKey = berlinStr.split(" ")[0];
    dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + (t.pnl_currency ?? 0));
  }
  let bestDay: { date: string; pnl: number } | null = null;
  let worstDay: { date: string; pnl: number } | null = null;
  for (const [date, pnl] of dayMap) {
    if (!bestDay || pnl > bestDay.pnl) bestDay = { date, pnl };
    if (!worstDay || pnl < worstDay.pnl) worstDay = { date, pnl };
  }

  return {
    totalPnl,
    tradeCount: filtered.length,
    winCount,
    lossCount,
    winRate,
    avgRMultiple,
    bestTrade,
    worstTrade,
    bestDay,
    worstDay,
  };
}

export function isReviewDue(
  lastReviewDate: string | null,
  periodType: "weekly" | "monthly"
): boolean {
  const today = getTodayBerlin();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  if (periodType === "weekly") {
    if (dayOfWeek !== 0 && dayOfWeek !== 1) return false;
  } else {
    if (dayOfMonth > 3) return false;
  }

  if (!lastReviewDate) return true;
  const last = new Date(lastReviewDate);
  const diffDays = (today.getTime() - last.getTime()) / 86400000;
  return periodType === "weekly" ? diffDays > 7 : diffDays > 28;
}

const UUID_PATTERN = /#([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function parseTradeReferences(text: string): string[] {
  const ids: string[] = [];
  let match;
  UUID_PATTERN.lastIndex = 0;
  while ((match = UUID_PATTERN.exec(text)) !== null) {
    ids.push(match[1]);
  }
  return [...new Set(ids)];
}

export function renderTextWithTradeLinks(
  text: string,
  tradeMap: Map<string, { symbol: string }>
): Array<{ type: "text" | "link"; content: string; tradeId?: string; label?: string }> {
  const parts: Array<{ type: "text" | "link"; content: string; tradeId?: string; label?: string }> = [];
  let lastIndex = 0;
  UUID_PATTERN.lastIndex = 0;
  let match;
  while ((match = UUID_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const id = match[1];
    const trade = tradeMap.get(id);
    parts.push({
      type: "link",
      content: match[0],
      tradeId: id,
      label: trade ? trade.symbol : match[0],
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
}
