import type { ChecklistItem } from "./checklist";

export type TradeCompletion = {
  trade_id: string;
  item_id: string;
  is_checked: boolean;
};

export type ScoreVsPnlBucket = {
  tradeCount: number;
  totalPnl: number;
  winRate: number;
  avgPnl: number;
};

export type ScoreVsPnlResult = {
  high: ScoreVsPnlBucket;   // >80%
  mid: ScoreVsPnlBucket;    // 50-80%
  low: ScoreVsPnlBucket;    // <50%
};

export type ItemCompliance = {
  item: ChecklistItem;
  checkedCount: number;
  uncheckedCount: number;
  complianceRate: number;
};

export type PeriodScoreResult = {
  avgScore: number;
  tradeCount: number;
} | null;

function emptyBucket(): ScoreVsPnlBucket {
  return { tradeCount: 0, totalPnl: 0, winRate: 0, avgPnl: 0 };
}

export function calculateTradeScore(
  checklistUsed: boolean,
  completions: TradeCompletion[]
): number | null {
  if (!checklistUsed) return null;
  if (completions.length === 0) return 0;
  const checked = completions.filter((c) => c.is_checked).length;
  return Math.round((checked / completions.length) * 100);
}

export function calculatePeriodScore(
  trades: Array<{ id: string; checklist_used?: boolean; exit_time?: string | null }>,
  completionsMap: Map<string, TradeCompletion[]>,
  periodStart: string,
  periodEnd: string
): PeriodScoreResult {
  const startMs = new Date(periodStart + "T00:00:00").getTime();
  const endMs   = new Date(periodEnd   + "T23:59:59").getTime();

  const relevant = trades.filter((t) => {
    if (!t.checklist_used) return false;
    if (!t.exit_time) return false;
    const ms = new Date(t.exit_time).getTime();
    return ms >= startMs && ms <= endMs;
  });

  if (relevant.length === 0) return null;

  let total = 0;
  for (const t of relevant) {
    const comps = completionsMap.get(t.id) ?? [];
    const score = calculateTradeScore(true, comps) ?? 0;
    total += score;
  }
  return { avgScore: Math.round(total / relevant.length), tradeCount: relevant.length };
}

export function calculatePerItemCompliance(
  trades: Array<{ id: string; checklist_used?: boolean; exit_time?: string | null }>,
  completionsMap: Map<string, TradeCompletion[]>,
  items: ChecklistItem[],
  periodStart: string,
  periodEnd: string
): ItemCompliance[] {
  const startMs = new Date(periodStart + "T00:00:00").getTime();
  const endMs   = new Date(periodEnd   + "T23:59:59").getTime();

  const relevant = trades.filter((t) => {
    if (!t.checklist_used) return false;
    if (!t.exit_time) return false;
    const ms = new Date(t.exit_time).getTime();
    return ms >= startMs && ms <= endMs;
  });

  return items
    .map((item) => {
      let checkedCount = 0;
      let uncheckedCount = 0;
      for (const t of relevant) {
        const comp = (completionsMap.get(t.id) ?? []).find((c) => c.item_id === item.id);
        if (comp) {
          if (comp.is_checked) checkedCount++;
          else uncheckedCount++;
        }
      }
      const total = checkedCount + uncheckedCount;
      return {
        item,
        checkedCount,
        uncheckedCount,
        complianceRate: total > 0 ? Math.round((checkedCount / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.complianceRate - b.complianceRate);
}

export function calculateScoreVsPnlCorrelation(
  trades: Array<{ id: string; checklist_used?: boolean; pnl_currency?: number | null }>,
  completionsMap: Map<string, TradeCompletion[]>
): ScoreVsPnlResult {
  const buckets = { high: emptyBucket(), mid: emptyBucket(), low: emptyBucket() };
  const wins    = { high: 0, mid: 0, low: 0 };

  for (const t of trades) {
    if (!t.checklist_used) continue;
    const comps = completionsMap.get(t.id) ?? [];
    const score = calculateTradeScore(true, comps) ?? 0;
    const pnl   = t.pnl_currency ?? 0;

    const key: "high" | "mid" | "low" =
      score > 80 ? "high" : score >= 50 ? "mid" : "low";

    buckets[key].tradeCount++;
    buckets[key].totalPnl += pnl;
    if (pnl > 0) wins[key]++;
  }

  for (const k of ["high", "mid", "low"] as const) {
    const b = buckets[k];
    b.winRate = b.tradeCount > 0 ? Math.round((wins[k] / b.tradeCount) * 100) : 0;
    b.avgPnl  = b.tradeCount > 0 ? b.totalPnl / b.tradeCount : 0;
  }

  return buckets;
}
