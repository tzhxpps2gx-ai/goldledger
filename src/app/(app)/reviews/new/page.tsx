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
    })
    .select()
    .single();

  if (insertError || !newReview) {
    // Fehler direkt anzeigen statt silent redirect
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-bg-card border border-danger/40 rounded-2xl">
        <h2 className="text-lg font-bold text-danger mb-3">Fehler beim Anlegen des Reviews</h2>
        <p className="text-sm text-zinc-300 mb-2">
          {insertError?.message ?? "Unbekannter Fehler – kein Review-Objekt zurückgegeben"}
        </p>
        <pre className="text-[11px] text-zinc-500 bg-bg-elevated rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(insertError, null, 2)}
        </pre>
        <a href="/reviews" className="mt-4 inline-block text-sm text-gold-400 hover:underline">
          ← Zurück zu Reviews
        </a>
      </div>
    );
  }

  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, currency")
    .eq("is_active", true);
  const account =
    accounts?.find((a) => a.id === userPreferences.active_account_id) ??
    accounts?.[0];

  let trades: ReviewTrade[] = [];
  let currency = account?.currency ?? "EUR";

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
      review={newReview as Review}
      periodType={periodType}
      periodStart={periodStart}
      periodEnd={periodEnd}
      template={template}
      stats={stats}
      trades={trades}
      currency={currency}
    />
  );
}
