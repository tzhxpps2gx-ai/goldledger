import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateStats, buildEquityCurve, type Trade } from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import EquityChart from "@/components/EquityChart";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

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
  const stats = calculateStats(allTrades);
  const equityCurve = buildEquityCurve(allTrades, Number(account.starting_balance));

  // Heutige Trades
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = allTrades.filter(
    (t) => t.exit_time?.startsWith(today) && t.status === "closed"
  );
  const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl_currency ?? 0), 0);

  // Letzte 5 Trades
  const recentTrades = allTrades.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {account.name} · {account.broker} ·{" "}
            <span className="text-gold-400">
              {formatCurrency(Number(account.current_balance), account.currency)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">Heute</div>
          <div className={cn("text-lg font-bold", pnlColor(todayPnl))}>
            {todayPnl >= 0 ? "+" : ""}
            {formatCurrency(todayPnl, account.currency)}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total P/L"
          value={formatCurrency(stats.totalPnl, account.currency)}
          accent={stats.totalPnl >= 0 ? "success" : "danger"}
          icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          subtext={`${stats.winningTrades}/${stats.closedTrades}`}
          icon={Target}
        />
        <KpiCard
          label="Ø R-Multiple"
          value={stats.avgR.toFixed(2) + "R"}
          accent={stats.avgR >= 0 ? "success" : "danger"}
          icon={Activity}
        />
        <KpiCard
          label="Profit Factor"
          value={
            stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2)
          }
          accent={stats.profitFactor >= 1 ? "success" : "danger"}
          icon={Activity}
        />
      </div>

      {/* Equity Curve */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Equity-Kurve</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kapitalentwicklung über alle geschlossenen Trades
            </p>
          </div>
        </div>
        {equityCurve.length > 1 ? (
          <EquityChart data={equityCurve} />
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
            Noch keine geschlossenen Trades — los geht's! 🚀
          </div>
        )}
      </div>

      {/* Letzte Trades */}
      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        <div className="p-5 md:p-6 border-b border-bg-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Letzte Trades</h2>
          <Link
            href="/trades"
            className="text-xs text-gold-400 hover:text-gold-300 font-medium"
          >
            Alle ansehen →
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Noch keine Trades.{" "}
            <Link href="/trades/new" className="text-gold-400 hover:text-gold-300">
              Ersten Trade anlegen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {recentTrades.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide",
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
                    <div className="text-[11px] text-zinc-500">
                      {t.entry_time ? formatDateTime(t.entry_time) : "Geplant"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-semibold", pnlColor(t.pnl_currency))}>
                    {t.pnl_currency != null
                      ? (t.pnl_currency >= 0 ? "+" : "") +
                        formatCurrency(t.pnl_currency, account.currency)
                      : "—"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.r_multiple != null ? `${t.r_multiple}R` : t.status}
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

function KpiCard({
  label,
  value,
  subtext,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: "success" | "danger";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={cn(
            "w-3.5 h-3.5",
            accent === "success"
              ? "text-success"
              : accent === "danger"
              ? "text-danger"
              : "text-zinc-500"
          )}
        />
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-bold tracking-tight",
          accent === "success"
            ? "text-success"
            : accent === "danger"
            ? "text-danger"
            : "text-white"
        )}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-zinc-500 mt-1">{subtext}</div>
      )}
    </div>
  );
}
