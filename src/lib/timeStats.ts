export type HeatmapCell = {
  pnl: number;
  count: number;
  winCount: number;
  lossCount: number;
};

// Grid[day 0-4 = Mo-Fr][hour 0-23]
export type HeatmapGrid = HeatmapCell[][];

export type BestWorstHour = {
  day: number;
  hour: number;
  pnl: number;
  count: number;
  winRate: number;
};

export const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr"];

export type TradeLite = {
  id: string;
  entry_time: string | null;
  pnl_currency: number | null;
};

function getBerlinParts(dt: Date): { weekday: number; hour: number } | null {
  try {
    const s = dt.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
    const [datePart, timePart] = s.split(" ");
    if (!datePart || !timePart) return null;
    const local = new Date(datePart + "T" + timePart);
    if (isNaN(local.getTime())) return null;
    return { weekday: local.getDay(), hour: local.getHours() };
  } catch {
    return null;
  }
}

export function calculateHourlyHeatmap<T extends TradeLite>(trades: T[]): {
  grid: HeatmapGrid;
  tradeMap: Map<string, T[]>;
} {
  const grid: HeatmapGrid = Array.from({ length: 5 }, () =>
    Array.from({ length: 24 }, () => ({ pnl: 0, count: 0, winCount: 0, lossCount: 0 }))
  );
  const tradeMap = new Map<string, T[]>();

  for (const trade of trades) {
    if (!trade.entry_time || trade.pnl_currency == null) continue;
    const dt = new Date(trade.entry_time);
    if (isNaN(dt.getTime())) continue;
    const parts = getBerlinParts(dt);
    if (!parts) continue;
    const { weekday, hour } = parts;
    if (weekday === 0 || weekday === 6) continue;
    const dayIdx = weekday - 1;
    const cell = grid[dayIdx][hour];
    cell.pnl += trade.pnl_currency;
    cell.count++;
    if (trade.pnl_currency > 0) cell.winCount++;
    else if (trade.pnl_currency < 0) cell.lossCount++;
    const key = `${dayIdx}-${hour}`;
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key)!.push(trade);
  }

  return { grid, tradeMap };
}

export function findBestWorstHour(grid: HeatmapGrid): {
  best: BestWorstHour | null;
  worst: BestWorstHour | null;
} {
  let best: BestWorstHour | null = null;
  let worst: BestWorstHour | null = null;

  for (let day = 0; day < 5; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = grid[day][hour];
      if (cell.count === 0) continue;
      const winRate = (cell.winCount / cell.count) * 100;
      const c: BestWorstHour = { day, hour, pnl: cell.pnl, count: cell.count, winRate };
      if (!best || cell.pnl > best.pnl) best = c;
      if (!worst || cell.pnl < worst.pnl) worst = c;
    }
  }

  return { best, worst };
}
