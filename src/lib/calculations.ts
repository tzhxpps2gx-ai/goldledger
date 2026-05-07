// XAUUSD-spezifische Berechnungen
// 1 Lot Gold = 100 Unzen
// 1$ Preis-Bewegung bei 1.00 Lot = $100 P/L
// Bei EUR-Konto: USD-P/L wird in EUR umgerechnet via Wechselkurs

const FALLBACK_EUR_USD = 0.92; // wenn API down

/**
 * Holt den aktuellen EUR/USD-Wechselkurs.
 * Nutzt exchangerate.host (kostenlos, kein API-Key nötig).
 * Bei API-Fehler → Fallback-Kurs.
 */
export async function fetchEurUsdRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=EUR",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("API not OK");
    const data = await res.json();
    const rate = data?.rates?.EUR;
    if (typeof rate === "number" && rate > 0 && rate < 2) {
      return rate;
    }
    throw new Error("Invalid rate");
  } catch {
    return FALLBACK_EUR_USD;
  }
}

/**
 * Berechnet P/L in USD für einen XAUUSD-Trade.
 * Formel: (Exit - Entry) × Lots × 100 für Long, umgekehrt für Short.
 */
export function calculateXauusdPnlUsd(
  entry: number,
  exit: number,
  lotSize: number,
  direction: "long" | "short"
): number {
  const points = direction === "long" ? exit - entry : entry - exit;
  return points * lotSize * 100;
}

/**
 * Berechnet P/L direkt in EUR — nutzt USD-P/L × EUR/USD-Rate.
 */
export function calculateXauusdPnlEur(
  entry: number,
  exit: number,
  lotSize: number,
  direction: "long" | "short",
  eurUsdRate: number
): number {
  const usdPnl = calculateXauusdPnlUsd(entry, exit, lotSize, direction);
  return Number((usdPnl * eurUsdRate).toFixed(2));
}

/**
 * Behält den alten Namen für Rückwärtskompatibilität — rechnet in EUR.
 */
export function calculateXauusdPnl(
  entry: number,
  exit: number,
  lotSize: number,
  direction: "long" | "short",
  eurUsdRate: number = FALLBACK_EUR_USD
): number {
  return calculateXauusdPnlEur(entry, exit, lotSize, direction, eurUsdRate);
}

export function calculateRMultiple(
  entry: number,
  stop: number,
  exit: number,
  direction: "long" | "short"
): number | null {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const reward = direction === "long" ? exit - entry : entry - exit;
  return Number((reward / risk).toFixed(2));
}

export function calculatePlannedRR(
  entry: number,
  stop: number,
  target: number,
  direction: "long" | "short"
): number | null {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const reward = direction === "long" ? target - entry : entry - target;
  return Number((reward / risk).toFixed(2));
}

export type Trade = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  pnl_currency: number | null;
  pnl_percent: number | null;
  r_multiple: number | null;
  status: string;
  entry_time: string | null;
  exit_time: string | null;
  exchange_rate?: number | null;
};

export type Stats = {
  totalPnl: number;
  totalTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgR: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
};

export function calculateStats(trades: Trade[]): Stats {
  const closed = trades.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => (t.pnl_currency ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl_currency ?? 0) < 0);

  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl_currency ?? 0), 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

  const rValues = closed
    .map((t) => t.r_multiple)
    .filter((r): r is number => r !== null);
  const avgR =
    rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;

  const grossWin = wins.reduce((sum, t) => sum + (t.pnl_currency ?? 0), 0);
  const grossLoss = Math.abs(
    losses.reduce((sum, t) => sum + (t.pnl_currency ?? 0), 0)
  );
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : wins.length > 0 ? 999 : 0;

  const pnls = closed.map((t) => t.pnl_currency ?? 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

  return {
    totalPnl,
    totalTrades: trades.length,
    closedTrades: closed.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: Number(winRate.toFixed(2)),
    avgR: Number(avgR.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    bestTrade,
    worstTrade,
  };
}

export function buildEquityCurve(
  trades: Trade[],
  startBalance: number
): { date: string; balance: number }[] {
  const closed = trades
    .filter((t) => t.status === "closed" && t.exit_time)
    .sort(
      (a, b) =>
        new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime()
    );

  let balance = startBalance;
  const curve: { date: string; balance: number }[] = [
    { date: "Start", balance },
  ];

  for (const trade of closed) {
    balance += trade.pnl_currency ?? 0;
    curve.push({
      date: new Date(trade.exit_time!).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      }),
      balance: Number(balance.toFixed(2)),
    });
  }

  return curve;
}

export function groupTradesByDay(
  trades: Trade[]
): Map<string, { pnl: number; count: number; trades: Trade[] }> {
  const map = new Map<string, { pnl: number; count: number; trades: Trade[] }>();

  for (const trade of trades) {
    if (trade.status !== "closed" || !trade.exit_time) continue;
    const day = new Date(trade.exit_time).toISOString().split("T")[0];
    const existing = map.get(day) ?? { pnl: 0, count: 0, trades: [] };
    existing.pnl += trade.pnl_currency ?? 0;
    existing.count += 1;
    existing.trades.push(trade);
    map.set(day, existing);
  }

  return map;
}
