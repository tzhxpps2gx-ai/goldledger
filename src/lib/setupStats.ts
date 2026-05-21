export type SetupStat = {
  setup: string;
  count: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
  winCount: number;
  lossCount: number;
};

export type SetupTrade = {
  setup?: string | null;
  pnl_currency: number | null;
};

export function calculateSetupStats(trades: SetupTrade[]): SetupStat[] {
  const acc = new Map<string, { totalPnl: number; winCount: number; lossCount: number; count: number }>();

  for (const trade of trades) {
    if (!trade.setup || trade.pnl_currency == null) continue;
    const key = trade.setup;
    if (!acc.has(key)) acc.set(key, { totalPnl: 0, winCount: 0, lossCount: 0, count: 0 });
    const entry = acc.get(key)!;
    entry.totalPnl += trade.pnl_currency;
    entry.count++;
    if (trade.pnl_currency > 0) entry.winCount++;
    else if (trade.pnl_currency < 0) entry.lossCount++;
  }

  return Array.from(acc.entries()).map(([setup, data]) => ({
    setup,
    count: data.count,
    totalPnl: data.totalPnl,
    avgPnl: data.count > 0 ? data.totalPnl / data.count : 0,
    winRate: data.count > 0 ? (data.winCount / data.count) * 100 : 0,
    winCount: data.winCount,
    lossCount: data.lossCount,
  }));
}
