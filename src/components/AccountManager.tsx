"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Archive, RotateCcw, Trash2, ChevronDown, Plus } from "lucide-react";
import AccountDialog from "@/components/AccountDialog";

type AccountWithCount = {
  id: string;
  name: string;
  account_type: string;
  broker: string | null;
  currency: string;
  starting_balance: number;
  current_balance: number;
  is_archived: boolean;
  archived_at: string | null;
  trade_count: number;
};

export const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  live: { label: "LIVE", cls: "bg-success/15 text-success border-success/30" },
  demo: { label: "DEMO", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  prop: { label: "PROP", cls: "bg-gold-500/15 text-gold-400 border-gold-500/30" },
};

export function TypeBadge({ type, dim = false }: { type: string; dim?: boolean }) {
  const badge = TYPE_BADGE[type] ?? TYPE_BADGE.live;
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-[10px] font-bold border leading-none",
      dim ? "opacity-40 " + badge.cls : badge.cls
    )}>
      {badge.label}
    </span>
  );
}

export default function AccountManager() {
  const [accounts,        setAccounts]        = useState<AccountWithCount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [dialogAccount,   setDialogAccount]   = useState<AccountWithCount | "new" | null>(null);
  const [confirmArchive,  setConfirmArchive]  = useState<AccountWithCount | null>(null);
  const [inlineError,     setInlineError]     = useState<Record<string, string>>({});
  const [confirmDelete,   setConfirmDelete]   = useState<AccountWithCount | null>(null);
  const [archivedOpen,    setArchivedOpen]    = useState(false);
  const [toast,           setToast]           = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: accs },
      { data: profile },
    ] = await Promise.all([
      supabase.from("accounts").select("*, trades(count)").order("created_at"),
      supabase.from("profiles").select("active_account_id").maybeSingle(),
    ]);
    if (accs) {
      setAccounts(accs.map((a: any) => ({
        ...a,
        trade_count: (a.trades as any)?.[0]?.count ?? 0,
      })));
    }
    setActiveAccountId((profile as any)?.active_account_id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleArchiveClick(acc: AccountWithCount) {
    setInlineError({});
    const active = accounts.filter((a) => !a.is_archived);
    if (acc.id === activeAccountId) {
      setInlineError({ [acc.id]: "active" });
      return;
    }
    if (active.length <= 1) {
      setInlineError({ [acc.id]: "last" });
      return;
    }
    setConfirmArchive(acc);
  }

  async function handleConfirmArchive() {
    if (!confirmArchive) return;
    const supabase = createClient();
    await supabase.from("accounts").update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    }).eq("id", confirmArchive.id);
    setConfirmArchive(null);
    showToast("Konto archiviert");
    load();
  }

  async function handleReactivate(acc: AccountWithCount) {
    const supabase = createClient();
    await supabase.from("accounts").update({
      is_archived: false,
      archived_at: null,
    }).eq("id", acc.id);
    showToast("Konto reaktiviert");
    load();
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const supabase = createClient();
    await supabase.from("accounts").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showToast("Konto gel\u00f6scht");
    load();
  }

  const active   = accounts.filter((a) => !a.is_archived);
  const archived = accounts.filter((a) => a.is_archived);

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] bg-bg-elevated border border-success/40 text-success text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Deine Trading-Konten</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Verwalte Live-, Demo- und archivierte Konten.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogAccount("new")}
          className="flex items-center gap-1.5 px-3 py-2 bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-semibold rounded-xl hover:bg-gold-500/25 transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Neues Konto
        </button>
      </div>

      {/* Aktive Konten */}
      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((acc) => {
          const isActive = acc.id === activeAccountId;
          const err = inlineError[acc.id];
          return (
            <div key={acc.id} className={cn(
              "bg-bg-elevated border rounded-2xl p-4 space-y-3 transition",
              isActive ? "border-gold-500/40" : "border-bg-border"
            )}>
              {/* Obere Zeile: Badge + Buttons */}
              <div className="flex items-start justify-between gap-2">
                <TypeBadge type={acc.account_type} />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setInlineError({}); setDialogAccount(acc); }}
                    title="Bearbeiten"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-bg-card transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveClick(acc)}
                    title="Archivieren"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-orange-400 hover:bg-bg-card transition"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Name + Broker */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{acc.name}</span>
                  {isActive && (
                    <span className="text-[10px] text-gold-400 font-medium">&#9679; Aktiv</span>
                  )}
                </div>
                {acc.broker && (
                  <div className="text-[11px] text-zinc-500 italic mt-0.5">{acc.broker}</div>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
                <span>Start: <span className="text-zinc-300">{formatCurrency(acc.starting_balance, acc.currency)}</span></span>
                <span>Stand: <span className="text-zinc-300">{formatCurrency(acc.current_balance, acc.currency)}</span></span>
                <span>Trades: <span className="text-zinc-300">{acc.trade_count}</span></span>
              </div>

              {/* Inline-Fehler */}
              {err === "active" && (
                <p className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5">
                  Wechsel zuerst zu einem anderen Konto, bevor du dieses archivierst.
                </p>
              )}
              {err === "last" && (
                <p className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5">
                  Du musst mindestens 1 aktives Konto behalten. Lege erst ein neues Konto an.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Archivierte Konten */}
      {archived.length > 0 && (
        <div className="border border-bg-border rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setArchivedOpen(!archivedOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-bg-card/50 transition"
          >
            <span>Archivierte Konten ({archived.length})</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", archivedOpen && "rotate-180")} />
          </button>

          {archivedOpen && (
            <div className="border-t border-bg-border divide-y divide-bg-border">
              {archived.map((acc) => (
                <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                  <TypeBadge type={acc.account_type} dim />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-400 font-medium truncate">{acc.name}</div>
                    <div className="text-[11px] text-zinc-600">{acc.trade_count} Trades</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReactivate(acc)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-bg-border text-[11px] text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reaktivieren
                    </button>
                    {acc.trade_count === 0 ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(acc)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-danger/30 text-[11px] text-danger hover:bg-danger/10 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        L&#246;schen
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-600 italic">Hat noch Trades</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bestätigung Archivieren */}
      {confirmArchive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4" onClick={() => setConfirmArchive(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-bg-elevated border border-bg-border rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Konto archivieren?</h3>
            <div>
              <p className="text-sm text-zinc-300">
                Konto <strong>"{confirmArchive.name}"</strong> archivieren?
              </p>
              <p className="text-xs text-zinc-500 mt-1.5">
                {confirmArchive.trade_count > 0
                  ? confirmArchive.trade_count + " Trades bleiben einsehbar. Du kannst das Konto jederzeit reaktivieren."
                  : "Keine Trades auf diesem Konto. Du kannst es sp\u00e4ter reaktivieren oder permanent l\u00f6schen."}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmArchive(null)}
                className="flex-1 py-2.5 rounded-xl border border-bg-border text-sm text-zinc-400 hover:text-white transition">
                Abbrechen
              </button>
              <button type="button" onClick={handleConfirmArchive}
                className="flex-1 py-2.5 rounded-xl border border-orange-500/40 bg-orange-500/10 text-sm text-orange-400 hover:bg-orange-500/20 transition">
                Archivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigung Löschen */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4" onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-bg-elevated border border-bg-border rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Konto endg&#252;ltig l&#246;schen?</h3>
            <p className="text-sm text-zinc-400">
              Konto <strong className="text-white">"{confirmDelete.name}"</strong> wird permanent gel&#246;scht. Das kann nicht r&#252;ckg&#228;ngig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-bg-border text-sm text-zinc-400 hover:text-white transition">
                Abbrechen
              </button>
              <button type="button" onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl border border-danger/40 bg-danger/10 text-sm text-danger hover:bg-danger/20 transition">
                Endg&#252;ltig l&#246;schen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AccountDialog */}
      {dialogAccount !== null && (
        <AccountDialog
          account={dialogAccount === "new" ? null : dialogAccount}
          onSave={load}
          onClose={() => setDialogAccount(null)}
        />
      )}
    </div>
  );
}
