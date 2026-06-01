"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNewsStatus, formatTimeUntil } from "@/lib/news/newsStatus";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";
import { Newspaper, Loader2 } from "lucide-react";

const IMPACT_COLOR: Record<string, string> = {
  high:   "bg-danger/20 text-danger border-danger/40",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  low:    "bg-zinc-700/40 text-zinc-500 border-zinc-600",
};

export default function NextNewsWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [minImpact, setMinImpact] = useState<"low"|"medium"|"high">("medium");
  const [warningMinutes, setWarningMinutes] = useState(30);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const to = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({ from: now.toISOString(), to });
      const [newsRes, prefsResp] = await Promise.all([
        fetch("/api/news?" + params.toString()),
        fetch("/api/news?" + params.toString()), // same cache
      ]);
      if (newsRes.ok) {
        const data = await newsRes.json();
        setEvents(data.events ?? []);
      }
      // Lade Prefs via supabase client
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("news_currencies, news_min_impact, news_warning_minutes")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setCurrencies((profile.news_currencies as string[]) ?? ["USD"]);
          setMinImpact((profile.news_min_impact as "low"|"medium"|"high") ?? "medium");
          setWarningMinutes((profile.news_warning_minutes as number) ?? 30);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const status = useMemo(
    () => getNewsStatus(events, currencies, minImpact, new Date(), warningMinutes),
    [events, currencies, minImpact, warningMinutes]
  );

  if (loading) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-bg-elevated rounded w-1/2 mb-3" />
        <div className="h-8 bg-bg-elevated rounded" />
      </div>
    );
  }

  const next = status.nextEvent;
  const mins = status.minutesUntilNext;
  const isUrgent = mins !== null && mins <= warningMinutes;

  return (
    <div
      className={cn(
        "bg-bg-card border rounded-2xl p-5 cursor-pointer transition hover:border-zinc-600",
        isUrgent ? "border-danger/40" : "border-bg-border"
      )}
      onClick={() => router.push("/news")}
    >
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className={cn("w-4 h-4", isUrgent ? "text-danger" : "text-gold-400")} />
        <h2 className="text-sm font-semibold text-white">N&#228;chste relevante News</h2>
      </div>

      {!next ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="text-success">&#9679;</span>
          Keine relevanten News in den n&#228;chsten 24 Stunden
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", IMPACT_COLOR[next.impact])}>
                {next.impact.toUpperCase()}
              </span>
              <span className="text-xs text-zinc-400 font-bold">{next.currency}</span>
            </div>
            <div className="text-sm font-medium text-white leading-snug truncate">{next.event_name}</div>
            <div className="text-[11px] text-zinc-500">
              {new Date(next.event_datetime).toLocaleTimeString("de-DE", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
              })} Uhr
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className={cn(
              "text-lg font-bold tabular-nums",
              isUrgent ? "text-danger animate-pulse" : "text-white"
            )}>
              {mins !== null ? formatTimeUntil(mins) : "–"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
