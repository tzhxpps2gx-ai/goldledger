import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TagPerformanceClient from "@/components/TagPerformanceClient";
import AnalyticsInsights from "@/components/AnalyticsInsights";
import HourlyHeatmap from "@/components/HourlyHeatmap";
import SetupStatsTable from "@/components/SetupStatsTable";
import type { TagStat } from "@/lib/tags";
import { getUserPreferences } from "@/lib/getUserPreferences";
import { calculateHourlyHeatmap, findBestWorstHour } from "@/lib/timeStats";
import { calculateSetupStats } from "@/lib/setupStats";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();

  const [{ data: accounts }, userPreferences] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true),
    getUserPreferences(),
  ]);

  if (!accounts || accounts.length === 0) {
    redirect("/onboarding");
  }

  const account =
    accounts.find((a) => a.id === userPreferences.active_account_id) ??
    accounts[0];

  const { data: trades } = await supabase
    .from("trades")
    .select("id, symbol, direction, pnl_currency, r_multiple, entry_time, setup")
    .eq("account_id", account.id)
    .eq("status", "closed");

  const closedTrades = trades ?? [];
  const tradeIds = closedTrades.map((t) => t.id as string);

  // Tag-Stats (unveraendert)
  const { data: allTags } = await supabase
    .from("tags")
    .select("id, name, category, color");

  const { data: tradeTags } = tradeIds.length > 0
    ? await supabase
        .from("trade_tags")
        .select("trade_id, tag_id")
        .in("trade_id", tradeIds)
    : { data: [] };

  const tagMap = new Map<string, { name: string; category: string; color: string }>();
  for (const tag of allTags ?? []) {
    tagMap.set(tag.id, { name: tag.name, category: tag.category, color: tag.color });
  }

  const tradeDataMap = new Map<string, { pnl: number; r: number | null }>();
  for (const t of closedTrades) {
    tradeDataMap.set(t.id as string, {
      pnl: (t.pnl_currency as number) ?? 0,
      r: t.r_multiple as number | null,
    });
  }

  const statAcc = new Map<
    string,
    { tradeIds: Set<string>; totalPnl: number; wins: number; rValues: number[] }
  >();

  for (const tt of tradeTags ?? []) {
    const tagId = tt.tag_id as string;
    const tradeId = tt.trade_id as string;
    const tData = tradeDataMap.get(tradeId);
    if (!tData) continue;
    if (!statAcc.has(tagId)) {
      statAcc.set(tagId, { tradeIds: new Set(), totalPnl: 0, wins: 0, rValues: [] });
    }
    const acc = statAcc.get(tagId)!;
    if (!acc.tradeIds.has(tradeId)) {
      acc.tradeIds.add(tradeId);
      acc.totalPnl += tData.pnl;
      if (tData.pnl > 0) acc.wins++;
      if (tData.r != null) acc.rValues.push(tData.r);
    }
  }

  const tagStats: TagStat[] = [];
  for (const [tagId, acc] of statAcc) {
    const meta = tagMap.get(tagId);
    if (!meta) continue;
    const tradeCount = acc.tradeIds.size;
    const avgR =
      acc.rValues.length > 0
        ? acc.rValues.reduce((s, r) => s + r, 0) / acc.rValues.length
        : null;
    tagStats.push({
      id: tagId,
      name: meta.name,
      category: meta.category,
      color: meta.color,
      tradeCount,
      totalPnl: acc.totalPnl,
      winRate: tradeCount > 0 ? (acc.wins / tradeCount) * 100 : 0,
      avgR: avgR != null ? Math.round(avgR * 100) / 100 : null,
    });
  }

  // Neue Analytics: Heatmap-Insights + Setup
  const typedTrades = closedTrades as Array<{
    id: string;
    symbol: string;
    direction: "long" | "short";
    pnl_currency: number | null;
    r_multiple: number | null;
    entry_time: string | null;
    setup: string | null;
  }>;

  const { grid } = calculateHourlyHeatmap(typedTrades);
  const { best: bestHour, worst: worstHour } = findBestWorstHour(grid);
  const setupStats = calculateSetupStats(typedTrades);
  const bestSetup = [...setupStats].sort((a, b) => b.totalPnl - a.totalPnl)[0] ?? null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Analyse
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {closedTrades.length}{" "}
          {closedTrades.length === 1 ? "geschlossener Trade" : "geschlossene Trades"}
        </p>
      </div>

      <AnalyticsInsights
        bestHour={bestHour}
        worstHour={worstHour}
        bestSetup={bestSetup}
        currency={account.currency}
      />

      <div>
        <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
          Tag-Performance
        </h2>
        <TagPerformanceClient stats={tagStats} currency={account.currency} />
      </div>

      <HourlyHeatmap trades={typedTrades} currency={account.currency} />

      <SetupStatsTable trades={typedTrades} currency={account.currency} />

      <p className="text-center text-xs text-zinc-600 pb-4">
        Weitere Auswertungen folgen&#8230;
      </p>
    </div>
  );
}
