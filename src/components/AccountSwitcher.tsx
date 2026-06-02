"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp, Check, Plus, Archive } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { updateUserPreference } from "@/lib/userPreferences";
import { TYPE_BADGE } from "@/components/AccountManager";

type Account = {
  id: string;
  name: string;
  account_type: string;
  broker: string | null;
  currency: string;
  current_balance: number;
  is_archived: boolean;
};

export default function AccountSwitcher({
  userEmail,
  activeAccountIdProp,
}: {
  userEmail: string;
  activeAccountIdProp: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(activeAccountIdProp);
  const [open, setOpen]         = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("accounts")
      .select("id, name, account_type, broker, currency, current_balance, is_archived")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        setAccounts(data as Account[]);
        const valid = activeAccountIdProp && data.some((a) => a.id === activeAccountIdProp);
        if (!valid) {
          const first = data.find((a) => !a.is_archived);
          if (first) setActiveId(first.id);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function selectAccount(id: string) {
    setActiveId(id);
    setOpen(false);
    await updateUserPreference("active_account_id", id);
    router.refresh();
  }

  const active   = accounts.find((a) => a.id === activeId);
  const activeAccounts   = accounts.filter((a) => !a.is_archived);
  const archivedAccounts = accounts.filter((a) => a.is_archived);

  if (!active) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-500">
        <div className="w-8 h-8 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-xs font-semibold text-gold-400">
          {userEmail?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-zinc-500 leading-tight">Kein Konto</div>
        </div>
      </div>
    );
  }

  const activeBadge = TYPE_BADGE[active.account_type] ?? TYPE_BADGE.live;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-bg-card transition group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-xs font-bold text-bg shadow-md shadow-gold-500/20 flex-shrink-0">
          {active.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white font-medium truncate leading-tight">{active.name}</span>
            <span className={cn("px-1 py-0.5 rounded text-[9px] font-bold border leading-none flex-shrink-0", activeBadge.cls)}>
              {activeBadge.label}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 leading-tight">
            {formatCurrency(Number(active.current_balance), active.currency)}
          </div>
        </div>
        <ChevronUp className={cn("w-4 h-4 text-zinc-500 transition-transform flex-shrink-0", !open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-elevated border border-bg-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="p-2 max-h-80 overflow-y-auto">
            {/* Aktive Konten */}
            {activeAccounts.length > 0 && (
              <>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium px-2 py-1.5">
                  Konto wechseln
                </div>
                {activeAccounts.map((a) => {
                  const badge = TYPE_BADGE[a.account_type] ?? TYPE_BADGE.live;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAccount(a.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition",
                        a.id === activeId ? "bg-gold-500/10" : "hover:bg-bg-card"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        a.id === activeId
                          ? "bg-gradient-to-br from-gold-500 to-gold-600 text-bg"
                          : "bg-bg-card border border-bg-border text-gold-400"
                      )}>
                        {a.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-xs font-medium truncate", a.id === activeId ? "text-gold-400" : "text-white")}>
                            {a.name}
                          </span>
                          <span className={cn("px-1 py-0.5 rounded text-[9px] font-bold border leading-none flex-shrink-0", badge.cls)}>
                            {badge.label}
                          </span>
                        </div>
                        {a.broker && (
                          <div className="text-[10px] text-zinc-500 italic truncate">{a.broker}</div>
                        )}
                        <div className="text-[10px] text-zinc-500">
                          {formatCurrency(Number(a.current_balance), a.currency)}
                        </div>
                      </div>
                      {a.id === activeId && <Check className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </>
            )}

            {/* Archivierte Konten */}
            {archivedAccounts.length > 0 && (
              <>
                <div className="my-1 border-t border-bg-border" />
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Archive className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Archiv</span>
                </div>
                {archivedAccounts.map((a) => {
                  const badge = TYPE_BADGE[a.account_type] ?? TYPE_BADGE.live;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAccount(a.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-bg-card transition opacity-50"
                    >
                      <div className="w-7 h-7 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0">
                        {a.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-400 truncate">{a.name}</span>
                          <span className={cn("px-1 py-0.5 rounded text-[9px] font-bold border leading-none flex-shrink-0 opacity-60", badge.cls)}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-600 italic">Archiviert</div>
                      </div>
                    </button>
                  );
                })}
                <p className="text-[10px] text-zinc-600 px-2 pb-1 mt-0.5 italic">
                  Archivierte Konten: nur Lesen empfohlen
                </p>
              </>
            )}
          </div>

          <div className="border-t border-bg-border p-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-400 hover:text-white hover:bg-bg-card rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Konten verwalten
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
