export type TimeRange = "today" | "week" | "month" | "year" | "all";

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: "Heute",
  week: "Woche",
  month: "Monat",
  year: "Jahr",
  all: "All Time",
};

/**
 * Gibt das Start-Datum für einen Zeitraum zurück.
 * Bei "all" → null (kein Filter).
 */
export function getRangeStart(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "week": {
      // Montag dieser Woche
      const start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1; // Sonntag = 0 → 6 Tage zurück
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start;
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return start;
    }
    case "all":
      return null;
  }
}

/**
 * Filtert Trades nach Exit-Zeit innerhalb des Zeitraums.
 * Trades ohne exit_time werden bei nicht-"all" ausgeschlossen.
 */
export function filterTradesByRange<T extends { exit_time: string | null }>(
  trades: T[],
  range: TimeRange
): T[] {
  if (range === "all") return trades;
  const start = getRangeStart(range);
  if (!start) return trades;
  return trades.filter((t) => {
    if (!t.exit_time) return false;
    return new Date(t.exit_time) >= start;
  });
}
