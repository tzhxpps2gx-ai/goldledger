import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type Trade } from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    redirect("/onboarding");
  }
  const account = accounts[0];

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("account_id", account.id)
    .order("entry_time", { ascending: false, nullsFirst: false });

  const allTrades = (trades ?? []) as Trade[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Trades
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {allTrades.length} {allTrades.length === 1 ? "Trade" : "Trades"} insgesamt
          </p>
        </div>
        <Link
          href="/trades/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition shadow-md shadow-gold-500/20"
        >
          <Plus className="w-4 h-4" />
          Neuer Trade
        </Link>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        {allTrades.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-zinc-400 mb-4">Noch keine Trades vorhanden.</p>
            <Link
              href="/trades/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Ersten Trade anlegen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {allTrades.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0",
                      t.direction === "long"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    )}
                  >
                    {t.direction === "long" ? "Long" : "Short"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {t.symbol}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {t.entry_time ? formatDateTime(t.entry_time) : "Geplant"}
                      {" · "}
                      <span className="capitalize">{t.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={cn("text-sm font-semibold", pnlColor(t.pnl_currency))}
                  >
                    {t.pnl_currency != null
                      ? (t.pnl_currency >= 0 ? "+" : "") +
                        formatCurrency(t.pnl_currency, account.currency)
                      : "—"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.r_multiple != null ? `${t.r_multiple}R` : "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
