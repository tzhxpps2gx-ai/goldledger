import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TEMPLATES } from "@/lib/reviewTemplates";
import { getCurrentPeriodBounds, getPreviousPeriodBounds, calculateReviewStats } from "@/lib/reviews";
import type { ReviewTrade } from "@/lib/reviews";
import ReviewEditorClient from "@/components/ReviewEditorClient";
import { getUserPreferences } from "@/lib/getUserPreferences";

export const dynamic = "force-dynamic";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: { type?: string; period?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const periodType = searchParams.type === "monthly" ? "monthly" : "weekly";
  const template = TEMPLATES[periodType];

  // Zeitraum bestimmen: Vorperiode bevorzugen (Review wird meist nachträglich geschrieben)
  const prev = getPreviousPeriodBounds(periodType);
  const curr = getCurrentPeriodBounds(periodType);
  const bounds = searchParams.period
    ? { start: searchParams.period, end: searchParams.period }
    : prev;

  // Falls period-Override: korrekte End-Bound berechnen
  let periodStart = bounds.start;
  let periodEnd = bounds.end;
  if (searchParams.period && searchParams.period !== prev.start) {
    periodStart = curr.start;
    periodEnd = curr.end;
  }

  // Account für Trades
  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase.from("accounts").select("id, currency").eq("is_active", true);
  const account = accounts?.find((a) => a.id === userPreferences.active_account_id) ?? accounts?.[0];

  let trades: ReviewTrade[] = [];
  if (account) {
    const { data } = await supabase
      .from("trades")
      .select("id, symbol, direction, pnl_currency, r_multiple, entry_time, exit_time, status")
      .eq("account_id", account.id)
      .gte("exit_time", periodStart + "T00:00:00")
      .lte("exit_time", periodEnd + "T23:59:59")
      .eq("status", "closed");
    trades = (data ?? []) as ReviewTrade[];
  }

  const stats = calculateReviewStats(trades, periodStart, periodEnd);

  return (
    <ReviewEditorClient
      review={null}
      periodType={periodType}
      periodStart={periodStart}
      periodEnd={periodEnd}
      template={template}
      stats={stats}
      trades={trades}
      currency={account?.currency ?? "EUR"}
    />
  );
}
