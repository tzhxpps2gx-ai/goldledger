import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TEMPLATES } from "@/lib/reviewTemplates";
import {
  getPreviousPeriodBounds,
  calculateReviewStats,
} from "@/lib/reviews";
import type { Review, ReviewTrade } from "@/lib/reviews";
import ReviewEditorClient from "@/components/ReviewEditorClient";
import { getUserPreferences } from "@/lib/getUserPreferences";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const periodType = searchParams.type === "monthly" ? "monthly" : "weekly";
  const template = TEMPLATES[periodType];

  const prev = getPreviousPeriodBounds(periodType);
  const periodStart = prev.start;
  const periodEnd = prev.end;

  const { data: newReview, error: insertError } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      answers: {},
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newReview) {
    console.error("Review insert error:", insertError?.message);
    redirect("/reviews?error=create_failed");
  }

  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, currency")
    .eq("is_archived", false);
  const account =
    accounts?.find((a) => a.id === userPreferences.active_account_id) ??
    accounts?.[0];

  let trades: ReviewTrade[] = [];
  let currency = account?.currency ?? "EUR";

  if (account) {
    const { data } = await supabase
      .from("trades")
      .select("id, symbol, direction, pnl_currency, r_multiple, entry_time, exit_time, status, checklist_used")
      .eq("account_id", account.id)
      .gte("exit_time", periodStart + "T00:00:00")
      .lte("exit_time", periodEnd + "T23:59:59")
      .eq("status", "closed");
    trades = (data ?? []) as ReviewTrade[];
  }

  const stats = calculateReviewStats(trades, periodStart, periodEnd);

  // Disziplin-Score für den Zeitraum berechnen
  const eligibleIds = trades.filter((t) => t.checklist_used).map((t) => t.id);
  let disciplineScore: number | null = null;
  let disciplineTradeCount = 0;
  if (eligibleIds.length > 0) {
    const [{ count: itemsCount }, { count: checkedCount }] = await Promise.all([
      supabase.from("checklist_items").select("*", { count: "exact", head: true }),
      supabase.from("trade_checklist_completions")
        .select("*", { count: "exact", head: true })
        .in("trade_id", eligibleIds)
        .eq("is_checked", true),
    ]);
    const total = (itemsCount ?? 0) * eligibleIds.length;
    if (total > 0) {
      disciplineScore = Math.round(((checkedCount ?? 0) / total) * 100);
      disciplineTradeCount = eligibleIds.length;
    }
  }

  return (
    <ReviewEditorClient
      review={newReview as Review}
      periodType={periodType}
      periodStart={periodStart}
      periodEnd={periodEnd}
      template={template}
      stats={stats}
      trades={trades}
      currency={currency}
      disciplineScore={disciplineScore}
      disciplineTradeCount={disciplineTradeCount}
    />
  );
}

