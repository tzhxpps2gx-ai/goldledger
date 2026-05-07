"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp, Check, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  current_balance: number;
};

export default function AccountSwitcher({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAccounts() {
      const { data } = await supabase
        .from("accounts")
        .select("id, name, account_type, currency, current_balance")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (data) {
        setAccounts(data as Account[]);
        // Active aus localStorage oder erstes Konto
        const stored = typeof window !== "undefined"
          ? localStorage.getItem("activeAccountId")
          : null;
        const valid = stored && data.some((a) => a.id === stored);
        setActiveId(valid ? stored : data[0]?.id ?? null);
      }
    }
    loadAccounts();
  }, []);

  // Klick außerhalb → schließen
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectAccount(id: string) {
    setActiveId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeAccountId", id);
    }
    setOpen(false);
    router.refresh();
  }

  const active = accounts.find((a) => a.id === activeId);

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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-bg-card transition group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-xs font-bold text-bg shadow-md shadow-gold-500/20">
          {active.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs text-white font-medium truncate leading-tight">
            {active.name}
          </div>
          <div className="text-[10px] text-zinc-500 leading-tight">
            {formatCurrency(Number(active.current_balance), active.currency)}
          </div>
        </div>
        <ChevronUp
          className={cn(
            "w-4 h-4 text-zinc-500 transition-transform",
            !open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-elevated border border-bg-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="p-2 max-h-80 overflow-y-auto">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium px-2 py-1.5">
              Konto wechseln
            </div>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAccount(a.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition",
                  a.id === activeId
                    ? "bg-gold-500/10"
                    : "hover:bg-bg-card"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    a.id === activeId
                      ? "bg-gradient-to-br from-gold-500 to-gold-600 text-bg"
                      : "bg-bg-card border border-bg-border text-gold-400"
                  )}
                >
                  {a.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-xs font-medium truncate",
                      a.id === activeId ? "text-gold-400" : "text-white"
                    )}
                  >
                    {a.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 capitalize">
                    {a.account_type} · {formatCurrency(Number(a.current_balance), a.currency)}
                  </div>
                </div>
                {a.id === activeId && (
                  <Check className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-bg-border p-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-400 hover:text-white hover:bg-bg-card rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Neues Konto anlegen
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
