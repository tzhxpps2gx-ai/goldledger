"use client";

import { TYPE_BADGE } from "@/components/AccountManager";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export type ComparisonAccount = {
  id: string;
  name: string;
  broker: string | null;
  account_type: string;
  currency: string;
  tradeCount: number;
  totalPnl: number;
  winRate: number;
  avgPnl: number;
};

export default function AccountComparisonClient({
  accounts,
  activeAccountId,
}: {
  accounts: ComparisonAccount[];
  activeAccountId: string;
}) {
  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      {accounts.length === 1 && (
        <p className="text-xs text-zinc-500">
          Du hast nur ein Konto.{" "}
          <Link href="/settings" className="text-gold-400 hover:underline">
            Weitere Konten anlegen →
          </Link>
        </p>
      )}
      <div className={"grid gap-3 " + (accounts.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {accounts.map((acc) => {
          const badge = TYPE_BADGE[acc.account_type] ?? TYPE_BADGE.live;
          const isActive = acc.id === activeAccountId;
          return (
            <div
              key={acc.id}
              className={"rounded-xl border p-4 space-y-3 " + (isActive ? "border-gold-500/30 bg-gold-500/5" : "border-zinc-800 bg-zinc-900/50")}
            >
              <div className="flex items-center gap-2">
                <span className={"px-1.5 py-0.5 rounded text-[10px] font-bold border leading-none " + badge.cls}>
                  {badge.label}
                </span>
                <span className="text-sm font-semibold text-white truncate">{acc.name}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] text-gold-400 font-medium shrink-0">aktiv</span>
                )}
              </div>
              {acc.broker && (
                <p className="text-xs text-zinc-500 -mt-1">{acc.broker}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Trades" value={String(acc.tradeCount)} />
                <StatCell
                  label="Win-Rate"
                  value={acc.tradeCount > 0 ? acc.winRate.toFixed(1) + " %" : "—"}
                  colorClass={acc.tradeCount > 0 ? (acc.winRate >= 50 ? "text-success" : "text-red-400") : "text-white"}
                />
                <StatCell
                  label="Gesamt P/L"
                  value={acc.tradeCount > 0 ? formatCurrency(acc.totalPnl, acc.currency) : "—"}
                  colorClass={acc.tradeCount > 0 ? (acc.totalPnl >= 0 ? "text-success" : "text-red-400") : "text-white"}
                />
                <StatCell
                  label="Ø P/L / Trade"
                  value={acc.tradeCount > 0 ? formatCurrency(acc.avgPnl, acc.currency) : "—"}
                  colorClass={acc.tradeCount > 0 ? (acc.avgPnl >= 0 ? "text-success" : "text-red-400") : "text-white"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  colorClass = "text-white",
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={"text-sm font-semibold " + colorClass}>{value}</p>
    </div>
  );
}
