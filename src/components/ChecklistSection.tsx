"use client";

import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/checklist";
import { getNewsStatus, formatTimeUntil } from "@/lib/news/newsStatus";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";

type Props = {
  items: ChecklistItem[];
  checked: Record<string, boolean>;
  onChange: (itemId: string, value: boolean) => void;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-yellow-400";
  return "text-danger";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-yellow-400";
  return "bg-danger";
}

function useNewsStatus(hasNewsItem: boolean) {
  const [status, setStatus] = useState<{
    loading: boolean;
    text: string;
    color: "green" | "red" | "gray";
  }>({ loading: hasNewsItem, text: "", color: "gray" });

  useEffect(() => {
    if (!hasNewsItem) return;
    async function load() {
      try {
        const now = new Date();
        const to = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        const params = new URLSearchParams({ from: now.toISOString(), to, minImpact: "low" });
        const [newsRes, { createClient }] = await Promise.all([
          fetch("/api/news?" + params.toString()),
          import("@/lib/supabase/client"),
        ]);
        const supabase = createClient();
        const [newsData, { data: profile }] = await Promise.all([
          newsRes.ok ? newsRes.json() : Promise.resolve({ events: [] }),
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return { data: null };
            return supabase.from("profiles").select("news_currencies,news_min_impact,news_warning_minutes").eq("id", user.id).maybeSingle();
          }),
        ]);
        const currencies: string[] = (profile as any)?.news_currencies ?? ["USD"];
        const minImpact: "low"|"medium"|"high" = (profile as any)?.news_min_impact ?? "medium";
        const warnMins: number = (profile as any)?.news_warning_minutes ?? 30;
        const events: NewsEvent[] = newsData.events ?? [];
        const st = getNewsStatus(events, currencies, minImpact, now, warnMins);

        const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

        if (!newsRes.ok || events.length === 0 && newsData.stale) {
          setStatus({ loading: false, text: "News-Status nicht verfügbar — manuell prüfen auf forexfactory.com", color: "gray" });
        } else if (st.currentlyInWindow && st.windowEvents.length > 0) {
          const e = st.windowEvents[0];
          const mins = Math.round((new Date(e.event_datetime).getTime() - now.getTime()) / 60_000);
          const countdown = formatTimeUntil(mins);
          setStatus({
            loading: false,
            text: e.event_name + " um " + new Date(e.event_datetime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }) + " — " + countdown + " · Bitte vorsichtig",
            color: "red",
          });
        } else {
          setStatus({
            loading: false,
            text: "Keine relevante News in den nächsten " + warnMins + " Min (Stand: " + timeStr + ")",
            color: "green",
          });
        }
      } catch {
        setStatus({ loading: false, text: "News-Status nicht verfügbar", color: "gray" });
      }
    }
    load();
  }, [hasNewsItem]);

  return status;
}

function NewsStatusLine({ item }: { item: ChecklistItem }) {
  const isNewsItem = item.label.toLowerCase().includes("news");
  const status = useNewsStatus(isNewsItem);
  if (!isNewsItem) return null;
  if (status.loading) {
    return <p className="text-[11px] text-zinc-600 mt-1 animate-pulse">News-Status wird geladen&#8230;</p>;
  }
  return (
    <p className={cn(
      "text-[11px] mt-1 px-2 py-1 rounded-lg",
      status.color === "green" && "bg-success/10 text-success",
      status.color === "red"   && "bg-danger/10 text-danger font-medium",
      status.color === "gray"  && "text-zinc-500",
    )}>
      {status.color === "green" && "&#9679; "}
      {status.color === "red"   && "&#9679; "}
      {status.text}
    </p>
  );
}

export default function ChecklistSection({ items, checked, onChange }: Props) {
  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const score = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  if (items.length === 0) return null;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
          Pre-Trading-Checklist
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Hak ab, was du vor diesem Trade gepr&#252;ft hast
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checked[item.id] ?? false}
                  onChange={(e) => onChange(item.id, e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  checked[item.id]
                    ? "bg-gold-500 border-gold-500"
                    : "bg-bg-elevated border-bg-border group-hover:border-zinc-500"
                )}>
                  {checked[item.id] && (
                    <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm transition-colors",
                  checked[item.id] ? "text-white" : "text-zinc-300"
                )}>
                  {item.label}
                </span>
                {item.description && (
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </label>
            <NewsStatusLine item={item} />
          </div>
        ))}
      </div>

      {/* Score-Footer */}
      <div className="pt-2 border-t border-bg-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {checkedCount} von {items.length} abgehakt
          </span>
          <span className={cn("text-sm font-bold tabular-nums", scoreColor(score))}>
            Score: {score}%
          </span>
        </div>
        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", scoreBarColor(score))}
            style={{ width: score + "%" }}
          />
        </div>
      </div>
    </div>
  );
}
