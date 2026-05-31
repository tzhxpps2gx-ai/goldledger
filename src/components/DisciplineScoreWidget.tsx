"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { calculatePeriodScore } from "@/lib/disciplineScore";
import type { TradeCompletion } from "@/lib/disciplineScore";
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-yellow-400";
  return "text-danger";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "stroke-success";
  if (score >= 50) return "stroke-yellow-400";
  return "stroke-danger";
}

function getBerlinWeekBounds(offset: 0 | -1 = 0): { start: string; end: string } {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }).slice(0, 10);
  return { start: fmt(mon), end: fmt(sun) };
}

export default function DisciplineScoreWidget() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<any[]>([]);
  const [completionsMap, setCompletionsMap] = useState<Map<string, TradeCompletion[]>>(new Map());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const twoWeeksAgo = getBerlinWeekBounds(-1).start;

      const [{ data: accs }] = await Promise.all([
        supabase.from("accounts").select("id").eq("is_active", true).limit(1),
      ]);
      const accountId = accs?.[0]?.id;
      if (!accountId) { setLoading(false); return; }

      const { data: tradesData } = await supabase
        .from("trades")
        .select("id, checklist_used, exit_time, pnl_currency")
        .eq("account_id", accountId)
        .eq("status", "closed")
        .gte("exit_time", twoWeeksAgo + "T00:00:00");

      const tradesList = tradesData ?? [];
      const tradeIds = tradesList.map((t: any) => t.id);

      let cMap = new Map<string, TradeCompletion[]>();
      if (tradeIds.length > 0) {
        const { data: comps } = await supabase
          .from("trade_checklist_completions")
          .select("trade_id, item_id, is_checked")
          .in("trade_id", tradeIds);
        for (const c of comps ?? []) {
          const arr = cMap.get(c.trade_id) ?? [];
          arr.push(c as TradeCompletion);
          cMap.set(c.trade_id, arr);
        }
      }

      setTrades(tradesList);
      setCompletionsMap(cMap);
      setLoading(false);
    }
    load();
  }, []);

  const thisWeek = getBerlinWeekBounds(0);
  const lastWeek = getBerlinWeekBounds(-1);

  const thisScore = useMemo(
    () => calculatePeriodScore(trades, completionsMap, thisWeek.start, thisWeek.end),
    [trades, completionsMap, thisWeek.start, thisWeek.end]
  );
  const lastScore = useMemo(
    () => calculatePeriodScore(trades, completionsMap, lastWeek.start, lastWeek.end),
    [trades, completionsMap, lastWeek.start, lastWeek.end]
  );

  // All-Time
  const allTimeScore = useMemo(() => {
    const withChecklist = trades.filter((t) => t.checklist_used);
    if (withChecklist.length === 0) return null;
    let total = 0;
    for (const t of withChecklist) {
      const comps = completionsMap.get(t.id) ?? [];
      const checked = comps.filter((c) => c.is_checked).length;
      total += comps.length > 0 ? (checked / comps.length) * 100 : 0;
    }
    return Math.round(total / withChecklist.length);
  }, [trades, completionsMap]);

  if (loading) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-bg-elevated rounded w-1/3 mb-3" />
        <div className="h-12 bg-bg-elevated rounded" />
      </div>
    );
  }

  const hasData = thisScore !== null || lastScore !== null;

  return (
    <div
      className="bg-bg-card border border-bg-border rounded-2xl p-5 cursor-pointer hover:border-zinc-600 transition"
      onClick={() => router.push("/analytics#discipline")}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-gold-400" />
        <h2 className="text-base font-semibold text-white">Disziplin-Score</h2>
      </div>

      {!hasData ? (
        <p className="text-sm text-zinc-500 leading-relaxed">
          Trag einen neuen Trade ein und nutze die Checklist, um deinen Disziplin-Score zu starten.
        </p>
      ) : (
        <div className="flex items-center gap-5">
          {/* Score-Ring */}
          <div className="relative flex-shrink-0 w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" className="text-bg-elevated" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                className={scoreRingColor(thisScore?.avgScore ?? 0)}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - (thisScore?.avgScore ?? 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-sm font-bold tabular-nums", scoreColor(thisScore?.avgScore ?? 0))}>
                {thisScore?.avgScore ?? 0}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Diese Woche</span>
              <span className={cn("text-sm font-semibold", scoreColor(thisScore?.avgScore ?? 0))}>
                {thisScore ? thisScore.avgScore + "%" : "–"}
                {thisScore && <span className="text-[10px] text-zinc-600 ml-1">({thisScore.tradeCount} Trades)</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Letzte Woche</span>
              <div className="flex items-center gap-1">
                {thisScore && lastScore && (
                  thisScore.avgScore > lastScore.avgScore
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : thisScore.avgScore < lastScore.avgScore
                    ? <TrendingDown className="w-3 h-3 text-danger" />
                    : <Minus className="w-3 h-3 text-zinc-500" />
                )}
                <span className="text-sm text-zinc-400">
                  {lastScore ? lastScore.avgScore + "%" : "–"}
                </span>
              </div>
            </div>
            {allTimeScore !== null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">All-Time</span>
                <span className="text-xs text-zinc-400">{allTimeScore}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
