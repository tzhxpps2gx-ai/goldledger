import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import DeleteTradeButton from "@/components/DeleteTradeButton";
import TradeChart from "@/components/TradeChart";

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

      {/* Trade-Visualisierung */}
      <TradeChart
        direction={trade.direction}
        plannedEntry={trade.planned_entry}
        plannedStop={trade.planned_stop}
        plannedTarget={trade.planned_target}
        actualEntry={trade.actual_entry}
        actualExit={trade.actual_exit}
        pnlCurrency={trade.pnl_currency}
        rMultiple={trade.r_multiple}
        lotSize={trade.lot_size}
        currency={account.currency}
      />

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
      {(trade.entry_time || trade.exit_time) && (
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
        </div>
      )}

      {/* Notizen */}
      {trade.notes && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2">
            Notizen
          </h3>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.notes}</p>
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
