export type NewsEvent = {
  id?: string;
  external_id: string | null;
  event_datetime: string;   // ISO UTC
  currency: string;
  impact: "low" | "medium" | "high";
  event_name: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};

const FF_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  USD: "USD", EUR: "EUR", GBP: "GBP", JPY: "JPY",
  AUD: "AUD", NZD: "NZD", CHF: "CHF", CAD: "CAD",
  CNY: "CNY", CNH: "CNH",
};

function normalizeImpact(raw: string): "low" | "medium" | "high" {
  const s = raw.toLowerCase();
  if (s === "high")   return "high";
  if (s === "medium" || s === "moderate") return "medium";
  return "low";
}

export async function fetchForexFactoryNews(): Promise<NewsEvent[]> {
  const results: NewsEvent[] = [];
  const seen = new Set<string>();

  await Promise.all(
    FF_URLS.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(url, {
          signal: controller.signal,
          next: { revalidate: 0 },
        });
        clearTimeout(timeout);
        if (!res.ok) {
          console.warn("[ForexFactory] Fetch failed:", url, res.status);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) return;

        for (const raw of data) {
          try {
            const currency = COUNTRY_TO_CURRENCY[raw.country] ?? raw.country;
            const dt = new Date(raw.date);
            if (isNaN(dt.getTime())) continue;
            const isoDate = dt.toISOString();
            const key = isoDate + "|" + currency + "|" + raw.title;
            if (seen.has(key)) continue;
            seen.add(key);

            results.push({
              external_id: null,
              event_datetime: isoDate,
              currency,
              impact: normalizeImpact(raw.impact ?? "low"),
              event_name: String(raw.title ?? "").trim(),
              forecast: raw.forecast ? String(raw.forecast) : null,
              previous: raw.previous ? String(raw.previous) : null,
              actual:   raw.actual   ? String(raw.actual)   : null,
            });
          } catch {
            // defektes Event überspringen
          }
        }
      } catch (err) {
        console.warn("[ForexFactory] Error fetching", url, err);
      }
    })
  );

  return results.sort(
    (a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime()
  );
}
