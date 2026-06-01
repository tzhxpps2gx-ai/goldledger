import type { NewsEvent } from "./forexFactoryFetcher";

export type NewsStatus = {
  hasUpcomingHighImpact: boolean;
  nextEvent: NewsEvent | null;
  minutesUntilNext: number | null;
  currentlyInWindow: boolean;
  windowEvents: NewsEvent[];
};

const IMPACT_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

export function getNewsStatus(
  events: NewsEvent[],
  currencies: string[],
  minImpact: "low" | "medium" | "high",
  atTime: Date,
  windowMinutes: number
): NewsStatus {
  if (currencies.length === 0) {
    return {
      hasUpcomingHighImpact: false,
      nextEvent: null,
      minutesUntilNext: null,
      currentlyInWindow: false,
      windowEvents: [],
    };
  }

  const minRank = IMPACT_RANK[minImpact] ?? 1;
  const windowMs = windowMinutes * 60 * 1000;
  const atMs = atTime.getTime();

  const relevant = events.filter((e) => {
    if (!currencies.includes(e.currency)) return false;
    if ((IMPACT_RANK[e.impact] ?? 0) < minRank) return false;
    return true;
  });

  const windowEvents = relevant.filter((e) => {
    const eMs = new Date(e.event_datetime).getTime();
    return Math.abs(eMs - atMs) <= windowMs;
  });

  const upcoming = relevant.filter(
    (e) => new Date(e.event_datetime).getTime() >= atMs
  );
  const nextEvent = upcoming[0] ?? null;
  const minutesUntilNext = nextEvent
    ? Math.round((new Date(nextEvent.event_datetime).getTime() - atMs) / 60_000)
    : null;

  const hasUpcomingHighImpact = upcoming.some((e) => e.impact === "high");

  return {
    hasUpcomingHighImpact,
    nextEvent,
    minutesUntilNext,
    currentlyInWindow: windowEvents.length > 0,
    windowEvents,
  };
}

export function formatTimeUntil(minutes: number): string {
  if (minutes <= 0) return "JETZT";
  if (minutes < 0) {
    const abs = Math.abs(minutes);
    if (abs < 60) return "vor " + abs + "min";
    return "vor " + Math.floor(abs / 60) + "h " + (abs % 60) + "min";
  }
  if (minutes < 60) return "in " + minutes + "min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return "in " + h + "h" + (m > 0 ? " " + m + "min" : "");
}
