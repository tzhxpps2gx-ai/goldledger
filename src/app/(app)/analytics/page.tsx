import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import StarRating from "@/components/StarRating";
import TagPerformanceClient from "@/components/TagPerformanceClient";
import AnalyticsInsights from "@/components/AnalyticsInsights";
import HourlyHeatmap from "@/components/HourlyHeatmap";
import SetupStatsTable from "@/components/SetupStatsTable";
import DisciplineCorrelation from "@/components/DisciplineCorrelation";
import ItemComplianceList from "@/components/ItemComplianceList";
import AccountComparisonClient, { type ComparisonAccount } from "@/components/AccountComparisonClient";
import NewsTradeComparisonClient, { type NewsComparisonData } from "@/components/NewsTradeComparisonClient";
import type { TagStat } from "@/lib/tags";
import { getUserPreferences } from "@/lib/getUserPreferences";
import { calculateHourlyHeatmap, findBestWorstHour } from "@/lib/timeStats";
import { calculateSetupStats } from "@/lib/setupStats";
import { calculatePerItemCompliance } from "@/lib/disciplineScore";
import type { TradeCompletion } from "@/lib/disciplineScore";
import type { ChecklistItem } from "@/lib/checklist";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();

  const [{ data: accounts }, userPreferences] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_archived", false),
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
    .select("id, symbol, direction, pnl_currency, r_multiple, entry_time, exit_time, setup, checklist_used, imported_at, traded_against_news, quality_score")
    .eq("account_id", account.id)
    .eq("status", "closed");

  const closedTrades = trades ?? [];
  const tradeIds = closedTrades.map((t) => t.id as string);

  // Tag-Stats
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

  // Heatmap + Setup-Stats
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

  // Discipline-Daten
  const { data: authUser } = await supabase.auth.getUser();
  const userId = authUser.user?.id ?? "";

  const { data: clItemsData } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");
  const clItems = (clItemsData ?? []) as ChecklistItem[];

  const trackedTradeIds = typedTrades
    .filter((t) => (t as any).checklist_used)
    .map((t) => t.id);

  let completionsMap = new Map<string, TradeCompletion[]>();
  if (trackedTradeIds.length > 0) {
    const { data: comps } = await supabase
      .from("trade_checklist_completions")
      .select("trade_id, item_id, is_checked")
      .in("trade_id", trackedTradeIds);
    for (const c of comps ?? []) {
      const arr = completionsMap.get(c.trade_id as string) ?? [];
      arr.push(c as TradeCompletion);
      completionsMap.set(c.trade_id as string, arr);
    }
  }

  const allStart = "2000-01-01";
  const allEnd   = "2099-12-31";
  const itemCompliance = calculatePerItemCompliance(
    typedTrades as any,
    completionsMap,
    clItems,
    allStart,
    allEnd
  );

  // Konto-Vergleich
  const allAccountIds = accounts.map((a) => a.id as string);
  const { data: compTrades } = allAccountIds.length > 0
    ? await supabase
        .from("trades")
        .select("account_id, pnl_currency")
        .in("account_id", allAccountIds)
        .eq("status", "closed")
    : { data: [] };

  const comparisonAccounts: ComparisonAccount[] = accounts.map((acc) => {
    const accTrades = (compTrades ?? []).filter((t) => t.account_id === acc.id);
    const tradeCount = accTrades.length;
    const totalPnl = accTrades.reduce((s, t) => s + ((t.pnl_currency as number) ?? 0), 0);
    const wins = accTrades.filter((t) => ((t.pnl_currency as number) ?? 0) > 0).length;
    return {
      id: acc.id as string,
      name: acc.name as string,
      broker: acc.broker as string | null,
      account_type: (acc.account_type as string) ?? "live",
      currency: acc.currency as string,
      tradeCount,
      totalPnl,
      winRate: tradeCount > 0 ? (wins / tradeCount) * 100 : 0,
      avgPnl: tradeCount > 0 ? totalPnl / tradeCount : 0,
    };
  });

  // News-Trade-Vergleich
  const flaggedTrades = closedTrades.filter((t) => (t as any).traded_against_news === true);
  const normalTrades  = closedTrades.filter((t) => !(t as any).traded_against_news);

  function calcStats(arr: typeof closedTrades) {
    const count = arr.length;
    const totalPnl = arr.reduce((s, t) => s + ((t.pnl_currency as number) ?? 0), 0);
    const wins = arr.filter((t) => ((t.pnl_currency as number) ?? 0) > 0).length;
    return {
      count,
      winRate: count > 0 ? (wins / count) * 100 : 0,
      avgPnl:  count > 0 ? totalPnl / count : 0,
    };
  }

  const flaggedStats = calcStats(flaggedTrades);
  const normalStats  = calcStats(normalTrades);

  const newsComparisonData: NewsComparisonData = {
    flaggedCount:   flaggedStats.count,
    flaggedWinRate: flaggedStats.winRate,
    flaggedAvgPnl:  flaggedStats.avgPnl,
    normalCount:    normalStats.count,
    normalWinRate:  normalStats.winRate,
    normalAvgPnl:   normalStats.avgPnl,
    currency: account.currency as string,
  };

  // Ausführungsqualität
  const qualityStats = [1, 2, 3, 4, 5].map((score) => {
    const group = closedTrades.filter((t) => (t as any).quality_score === score);
    const count = group.length;
    const totalPnl = group.reduce((s, t) => s + ((t.pnl_currency as number) ?? 0), 0);
    const wins = group.filter((t) => ((t.pnl_currency as number) ?? 0) > 0).length;
    return {
      score,
      count,
      avgPnl: count > 0 ? totalPnl / count : 0,
      winRate: count > 0 ? (wins / count) * 100 : 0,
    };
  }).filter((s) => s.count > 0);

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

      {/* Discipline-Sektion */}
      <div id="discipline" className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
            Disziplin &amp; Performance
          </h2>
          <p className="text-xs text-zinc-500">
            Wie korreliert deine Checklist-Disziplin mit dem Trading-Ergebnis?
          </p>
        </div>
        <DisciplineCorrelation
          trades={typedTrades as any}
          completionsMap={completionsMap}
          currency={account.currency}
        />
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Regel-Compliance (schlechteste zuerst)
          </h3>
          <ItemComplianceList items={itemCompliance} />
        </div>
      </div>

      {/* News-Trade-Vergleich */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
            Trades trotz News-Warnung
          </h2>
          <p className="text-xs text-zinc-500">
            Performen Trades, die du trotz Warnung angelegt hast, anders?
          </p>
        </div>
        <NewsTradeComparisonClient data={newsComparisonData} />
      </div>

      {/* Ausführungsqualität */}
      {qualityStats.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
              Ausf&#252;hrungsqualit&#228;t
            </h2>
            <p className="text-xs text-zinc-500">
              Wie gut bewertest du deine Ausf&#252;hrung — und was bringt es?
            </p>
          </div>
          <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 border-b border-bg-border text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Bewertung</span>
              <span className="text-center">Trades</span>
              <span className="text-center">Win Rate</span>
              <span className="text-right">&#216; P/L</span>
            </div>
            {qualityStats.map((s) => (
              <div key={s.score} className="grid grid-cols-4 items-center px-4 py-3 border-b border-bg-border/50 last:border-0">
                <StarRating value={s.score} readOnly size="sm" />
                <span className="text-sm text-white text-center">{s.count}</span>
                <span className="text-sm text-white text-center">{Math.round(s.winRate)} %</span>
                <span className={cn("text-sm font-semibold text-right", s.avgPnl >= 0 ? "text-success" : "text-danger")}>
                  {s.avgPnl >= 0 ? "+" : ""}{formatCurrency(s.avgPnl, account.currency as string)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Konto-Vergleich */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
            Konto-Vergleich
          </h2>
          <p className="text-xs text-zinc-500">
            Alle aktiven Konten im Überblick
          </p>
        </div>
        <AccountComparisonClient
          accounts={comparisonAccounts}
          activeAccountId={account.id as string}
        />
      </div>
    </div>
  );
}
