"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";
import { RefreshCw, Loader2 } from "lucide-react";

const IMPACT_LABEL: Record<string, string> = { high: "HIGH", medium: "MED", low: "LOW" };
const IMPACT_COLOR: Record<string, string> = {
  high:   "bg-danger/20 text-danger border-danger/40",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  low:    "bg-zinc-700/40 text-zinc-500 border-zinc-600",
};

const ALL_CURRENCIES = ["USD","EUR","GBP","JPY","AUD","NZD","CHF","CAD"];
const IMPACT_OPTS: Array<{ value: "low"|"medium"|"high"; label: string }> = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
];

type DateRange = "today" | "week" | "nextweek" | "twoweeks";

function getRange(mode: DateRange): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const add = (d: Date, days: number) => {
    const r = new Date(d); r.setDate(r.getDate() + days); return r;
  };
  const dow = (now.getDay() + 6) % 7;
  const monThis = add(now, -dow);
  const sunThis = add(monThis, 6);
  const monNext = add(monThis, 7);
  const sunNext = add(monNext, 6);
  if (mode === "today")    return { from: fmt(now),     to: fmt(now) };
  if (mode === "week")     return { from: fmt(monThis), to: fmt(sunThis) };
  if (mode === "nextweek") return { from: fmt(monNext), to: fmt(sunNext) };
  return { from: fmt(now), to: fmt(add(now, 14)) };
}

function groupByDay(events: NewsEvent[]): Array<{ date: string; events: NewsEvent[] }> {
  const map = new Map<string, NewsEvent[]>();
  for (const e of events) {
    const day = e.event_datetime.slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(e);
    map.set(day, arr);
  }
  return Array.from(map.entries()).map(([date, evs]) => ({ date, events: evs }));
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

function formatLastFetched(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return "vor " + mins + " Min";
  return "vor " + Math.floor(mins / 60) + "h";
}

type Props = {
  initialCurrencies: string[];
  initialMinImpact: "low" | "medium" | "high";
};

export default function NewsClient({ initialCurrencies, initialMinImpact }: Props) {
  const [range, setRange] = useState<DateRange>("twoweeks");
  const [currencies, setCurrencies] = useState<string[]>(initialCurrencies);
  const [minImpact, setMinImpact] = useState<"low"|"medium"|"high">(initialMinImpact);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange(range);
    const params = new URLSearchParams({ from, to, minImpact });
    if (currencies.length > 0) params.set("currencies", currencies.join(","));
    const res = await fetch("/api/news?" + params.toString());
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events ?? []);
      setStale(data.stale ?? false);
      setLastFetched(data.lastFetched);
    }
    setLoading(false);
  }, [range, currencies, minImpact]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => groupByDay(events), [events]);
  const now = new Date().toISOString().slice(0, 10);

  function toggleCurrency(c: string) {
    setCurrencies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter-Bar */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-4 space-y-4">
        {/* Datum */}
        <div className="flex flex-wrap gap-1.5">
          {([
            { v: "today",    l: "Heute" },
            { v: "week",     l: "Diese Woche" },
            { v: "nextweek", l: "N&#228;chste Woche" },
            { v: "twoweeks", l: "14 Tage" },
          ] as const).map(({ v, l }) => (
            <button key={v} type="button" onClick={() => setRange(v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                range === v
                  ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                  : "bg-bg-elevated border border-bg-border text-zinc-400 hover:text-white"
              )}
              dangerouslySetInnerHTML={{ __html: l }}
            />
          ))}
        </div>

        {/* Impact */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider w-16">Impact</span>
          {IMPACT_OPTS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setMinImpact(value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition",
                minImpact === value
                  ? IMPACT_COLOR[value]
                  : "bg-bg-elevated border-bg-border text-zinc-500 hover:text-white"
              )}>
              {label}+
            </button>
          ))}
        </div>

        {/* Währungen */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider w-16">W&#228;hrung</span>
          {ALL_CURRENCIES.map((c) => (
            <button key={c} type="button" onClick={() => toggleCurrency(c)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition",
                currencies.includes(c)
                  ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                  : "bg-bg-elevated border-bg-border text-zinc-500 hover:text-white"
              )}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Status-Bar */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500">
        <span>
          {lastFetched ? "Zuletzt aktualisiert: " + formatLastFetched(lastFetched) : ""}
          {stale && " · Daten m&#246;glicherweise veraltet"}
        </span>
        <button type="button" onClick={load} disabled={loading}
          className="inline-flex items-center gap-1 hover:text-white transition disabled:opacity-40">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Aktualisieren
        </button>
      </div>

      {/* News-Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm">Keine News im gew&#228;hlten Zeitraum.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ date, events: dayEvents }) => (
            <div key={date}>
              <h3 className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-3",
                date === now ? "text-gold-400" : "text-zinc-500"
              )}>
                {date === now ? "Heute — " : ""}{formatDay(date)}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((e, i) => {
                  const isPast = new Date(e.event_datetime) < new Date();
                  return (
                    <div key={i} className={cn(
                      "flex items-start gap-3 bg-bg-card border border-bg-border rounded-xl px-4 py-3 transition",
                      isPast && "opacity-50"
                    )}>
                      <div className="w-12 flex-shrink-0 text-xs text-zinc-500 pt-0.5 tabular-nums">
                        {formatTime(e.event_datetime)}
                      </div>
                      <div className={cn(
                        "flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                        IMPACT_COLOR[e.impact]
                      )}>
                        {IMPACT_LABEL[e.impact]}
                      </div>
                      <div className="w-10 flex-shrink-0 text-xs font-bold text-zinc-400 pt-0.5">
                        {e.currency}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white leading-snug">{e.event_name}</div>
                        {(e.forecast || e.previous || e.actual) && (
                          <div className="flex gap-3 mt-1 text-[11px] text-zinc-500">
                            {e.forecast && <span>Prognose: <span className="text-zinc-300">{e.forecast}</span></span>}
                            {e.previous && <span>Vorher: <span className="text-zinc-300">{e.previous}</span></span>}
                            {e.actual   && <span>Aktuell: <span className={cn("font-semibold", e.actual.startsWith("-") ? "text-danger" : "text-success")}>{e.actual}</span></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
