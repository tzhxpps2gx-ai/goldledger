import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/reviewTemplates";
import {
  calculateReviewStats,
  parseTradeReferences,
  renderTextWithTradeLinks,
  getPeriodLabel,
} from "@/lib/reviews";
import type { Review, ReviewTrade } from "@/lib/reviews";
import { getUserPreferences } from "@/lib/getUserPreferences";
import ReviewEditorClient from "@/components/ReviewEditorClient";
import ReviewReopenButton from "@/components/ReviewReopenButton";
import ReviewDeleteButton from "@/components/ReviewDeleteButton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateTime(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleString("de-DE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: review, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !review) notFound();

  const r = review as Review;

  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase.from("accounts").select("id, currency").eq("is_archived", false);
  const account = accounts?.find((a) => a.id === userPreferences.active_account_id) ?? accounts?.[0];

  let trades: ReviewTrade[] = [];
  let currency = account?.currency ?? "EUR";

  if (account) {
    const { data } = await supabase
      .from("trades")
      .select("id, symbol, direction, pnl_currency, r_multiple, entry_time, exit_time, status, checklist_used")
      .eq("account_id", account.id)
      .gte("exit_time", r.period_start + "T00:00:00")
      .lte("exit_time", r.period_end + "T23:59:59")
      .eq("status", "closed");
    trades = (data ?? []) as ReviewTrade[];
  }

  // Disziplin-Score für den Zeitraum berechnen
  const eligibleIds = trades.filter((t) => t.checklist_used).map((t) => t.id);
  let disciplineScore: number | null = null;
  let disciplineTradeCount = 0;
  if (eligibleIds.length > 0) {
    const { data: completions } = await supabase
      .from("trade_checklist_completions")
      .select("is_checked")
      .in("trade_id", eligibleIds);
    if (completions && completions.length > 0) {
      const checkedCount = completions.filter((c) => c.is_checked).length;
      disciplineScore = Math.round((checkedCount / completions.length) * 100);
      disciplineTradeCount = eligibleIds.length;
    }
  }

  if (r.status === "draft") {
    const template = TEMPLATES[r.period_type] ?? TEMPLATES.weekly;
    const stats = calculateReviewStats(trades, r.period_start, r.period_end);
    return (
      <ReviewEditorClient
        review={r}
        periodType={r.period_type as "weekly" | "monthly"}
        periodStart={r.period_start}
        periodEnd={r.period_end}
        template={template}
        stats={stats}
        trades={trades}
        currency={currency}
        disciplineScore={disciplineScore}
        disciplineTradeCount={disciplineTradeCount}
      />
    );
  }

  const template = TEMPLATES[r.period_type] ?? TEMPLATES.weekly;
  const stats = calculateReviewStats(trades, r.period_start, r.period_end);

  const allText = Object.values(r.answers ?? {}).join(" ");
  const refIds = parseTradeReferences(allText);
  const tradeMap = new Map<string, { symbol: string }>();
  if (refIds.length > 0) {
    const { data: refTrades } = await supabase
      .from("trades").select("id, symbol").in("id", refIds);
    for (const t of refTrades ?? []) {
      tradeMap.set(t.id as string, { symbol: t.symbol as string });
    }
  }

  const periodLabel = getPeriodLabel(r.period_type, r.period_end);
  const createdStr = formatDateTime(r.created_at);
  const submittedStr = formatDateTime(r.submitted_at);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/reviews" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition mb-2">
            <ArrowLeft className="w-3 h-3" />
            Alle Reviews
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-full">
              {periodLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success">
              Abgeschlossen
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">{template.title}</h1>
          <p className="text-zinc-500 text-sm">{formatDate(r.period_start)} &#8211; {formatDate(r.period_end)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <ReviewReopenButton reviewId={r.id} />
          <ReviewDeleteButton reviewId={r.id} />
        </div>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Zeitraum-Performance</div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <div className="text-[10px] text-zinc-500">Total P/L</div>
            <div className={cn("text-lg font-bold", stats.totalPnl >= 0 ? "text-success" : "text-danger")}>
              {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl, currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Trades</div>
            <div className="text-lg font-bold text-white">{stats.tradeCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Win Rate</div>
            <div className="text-lg font-bold text-white">{Math.round(stats.winRate)} %</div>
          </div>
          {stats.avgRMultiple != null && (
            <div>
              <div className="text-[10px] text-zinc-500">&#216; R</div>
              <div className="text-lg font-bold text-white">{stats.avgRMultiple.toFixed(2)}R</div>
            </div>
          )}
          {disciplineScore != null && (
            <div>
              <div className="text-[10px] text-zinc-500">Disziplin</div>
              <div className={cn(
                "text-lg font-bold",
                disciplineScore >= 80 ? "text-success" : disciplineScore >= 50 ? "text-gold-400" : "text-danger"
              )}>
                {disciplineScore} %
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {template.questions.map((q) => {
          const answer = (r.answers ?? {})[q.key]?.trim();
          if (!answer) return null;
          const parts = renderTextWithTradeLinks(answer, tradeMap);
          return (
            <div key={q.key} className="bg-bg-card border border-bg-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-gold-400 mb-2">{q.label}</div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {parts.map((part, i) =>
                  part.type === "link" && part.tradeId ? (
                    <Link key={i} href={"/trades/" + part.tradeId}
                      className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition">
                      {part.label ?? part.content}
                    </Link>
                  ) : (
                    <span key={i}>{part.content}</span>
                  )
                )}
              </p>
            </div>
          );
        })}
      </div>

      {(createdStr || submittedStr) && (
        <div className="text-[11px] text-zinc-600 text-center pb-4">
          {createdStr && "Erstellt " + createdStr}
          {submittedStr && " · Abgeschlossen " + submittedStr}
        </div>
      )}
    </div>
  );
}


