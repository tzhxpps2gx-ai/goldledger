import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import StarRating from "@/components/StarRating";
import DeleteTradeButton from "@/components/DeleteTradeButton";
import TradeChartLive from "@/components/TradeChartLive";
import TagChips from "@/components/TagChips";
import { loadTagsForTrade } from "@/lib/tags";
import { calculateTradeScore } from "@/lib/disciplineScore";
import type { TradeCompletion } from "@/lib/disciplineScore";
import type { ChecklistItem } from "@/lib/checklist";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: trade } = await supabase
    .from("trades")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!trade) notFound();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", trade.account_id)
    .single();

  if (!account) redirect("/dashboard");

  // Tags + Checklist laden
  const tradeTags = await loadTagsForTrade(supabase, trade.id);

  let checklistItems: ChecklistItem[] = [];
  let checklistCompletions: TradeCompletion[] = [];
  if (trade.checklist_used) {
    const [{ data: items }, { data: comps }] = await Promise.all([
      supabase
        .from("checklist_items")
        .select("*")
        .eq("user_id", trade.user_id)
        .order("sort_order"),
      supabase
        .from("trade_checklist_completions")
        .select("trade_id, item_id, is_checked")
        .eq("trade_id", trade.id),
    ]);
    checklistItems = (items ?? []) as ChecklistItem[];
    checklistCompletions = (comps ?? []) as TradeCompletion[];
  }
  const checklistScore = calculateTradeScore(
    Boolean(trade.checklist_used),
    checklistCompletions
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/trades"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Zurück
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/trades/${trade.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 text-gold-400 text-xs font-medium rounded-lg transition active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5" />
            Bearbeiten
          </Link>
          <DeleteTradeButton
            tradeId={trade.id}
            pnl={trade.pnl_currency}
            accountId={trade.account_id}
            accountBalance={Number(account.current_balance)}
          />
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide",
                trade.direction === "long"
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              )}
            >
              {trade.direction === "long" ? "▲ Long" : "▼ Short"}
            </div>
            <div>
              <div className="text-lg font-bold text-white">{trade.symbol}</div>
              <div className="text-xs text-zinc-500 capitalize">{trade.status}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", pnlColor(trade.pnl_currency))}>
              {trade.pnl_currency != null
                ? (trade.pnl_currency >= 0 ? "+" : "") +
                  formatCurrency(trade.pnl_currency, account.currency)
                : "—"}
            </div>
            {trade.r_multiple != null && (
              <div className={cn("text-sm font-medium", pnlColor(trade.r_multiple))}>
                {trade.r_multiple >= 0 ? "+" : ""}
                {trade.r_multiple}R
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-bg-border">
          <Field label="Lot Size" value={trade.lot_size?.toString() ?? "—"} />
          <Field
            label="Entry"
            value={trade.actual_entry?.toString() ?? trade.planned_entry?.toString() ?? "—"}
          />
          <Field label="Exit" value={trade.actual_exit?.toString() ?? "—"} />
        </div>
      </div>

      {/* Tags des Trades */}
      {tradeTags.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-2xl px-5 py-4">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
            Tags
          </h3>
          <TagChips
            tags={tradeTags}
            selectedIds={tradeTags.map((t) => t.id)}
            mode="display"
          />
        </div>
      )}

      {/* Etappe 12: Echter Candlestick-Chart, Fallback auf schematische Darstellung */}
      <TradeChartLive trade={trade} currency={account.currency} />

      {/* Pre-Trade Plan */}
      {(trade.setup || trade.reasoning) && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Pre-Trade Plan
          </h3>
          {trade.setup && <Field label="Setup" value={trade.setup} />}
          {trade.reasoning && <Field label="Begründung" value={trade.reasoning} />}
          {trade.planned_rr != null && (
            <Field label="Geplantes R:R" value={`1 : ${trade.planned_rr}`} />
          )}
        </div>
      )}

      {/* Zeiten */}
      {(trade.entry_time || trade.exit_time || trade.imported_at) && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6 space-y-3">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Zeiten
          </h3>
          {trade.entry_time && (
            <Field label="Entry" value={formatDateTime(trade.entry_time)} />
          )}
          {trade.exit_time && (
            <Field label="Exit" value={formatDateTime(trade.exit_time)} />
          )}
          {trade.imported_at && (
            <Field label="Importiert am" value={formatDateTime(trade.imported_at)} />
          )}
          {trade.broker_ticket_id && (
            <Field label="MT5-Ticket" value={String(trade.broker_ticket_id)} />
          )}
        </div>
      )}

      {/* Notizen */}
      {/* Pre-Trading-Checklist */}
      {trade.checklist_used && checklistItems.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
              Pre-Trading-Checklist
            </h3>
            {checklistScore !== null && (
              <span className={
                checklistScore >= 80 ? "text-sm font-bold text-success" :
                checklistScore >= 50 ? "text-sm font-bold text-yellow-400" :
                "text-sm font-bold text-danger"
              }>
                Score: {checklistScore}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const comp = checklistCompletions.find((c) => c.item_id === item.id);
              const isChecked = comp?.is_checked ?? false;
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={
                    "mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center " +
                    (isChecked ? "bg-gold-500 border-gold-500" : "bg-bg-elevated border-bg-border")
                  }>
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={isChecked ? "text-sm text-white" : "text-sm text-zinc-500 line-through decoration-zinc-600"}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          {checklistScore !== null && (
            <div className="pt-2 border-t border-bg-border">
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className={
                    "h-full rounded-full transition-all " +
                    (checklistScore >= 80 ? "bg-success" : checklistScore >= 50 ? "bg-yellow-400" : "bg-danger")
                  }
                  style={{ width: checklistScore + "%" }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {!trade.checklist_used && !trade.imported_at && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">Keine Checklist f&#252;r diesen Trade genutzt.</p>
          <Link href={"/trades/" + trade.id + "/edit"}
            className="text-xs text-gold-400 hover:underline flex-shrink-0">
            Jetzt nachpflegen
          </Link>
        </div>
      )}
      {trade.imported_at && !trade.checklist_used && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-4">
          <p className="text-xs text-zinc-600">Importierter Trade &#8212; Checklist nicht verf&#252;gbar.</p>
        </div>
      )}

      {trade.notes && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2">
            Notizen
          </h3>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {trade.quality_score != null && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
            Ausf&#252;hrungsqualit&#228;t
          </h3>
          <div className="flex items-center justify-center gap-4">
            <StarRating value={trade.quality_score as number} readOnly size="lg" />
            <span className="text-sm text-zinc-400">
              {["", "Schlecht", "Schwach", "OK", "Gut", "Perfekt"][trade.quality_score as number]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className="text-sm text-white mt-0.5">{value}</div>
    </div>
  );
}
