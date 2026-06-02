"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { X, AlertTriangle } from "lucide-react";

type AccountType = "live" | "demo" | "prop";

type AccountData = {
  id: string;
  name: string;
  account_type: string;
  broker: string | null;
  currency: string;
  starting_balance: number;
};

type Props = {
  account: AccountData | null;
  onSave: () => void;
  onClose: () => void;
};

const TYPE_OPTIONS: { value: AccountType; label: string; desc: string; active: string }[] = [
  { value: "live", label: "Live",  desc: "Echtes Kapital",  active: "border-success/40 bg-success/10 text-success" },
  { value: "demo", label: "Demo",  desc: "&#220;bungskonto",       active: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  { value: "prop", label: "Prop",  desc: "Fremdes Kapital", active: "border-gold-500/40 bg-gold-500/10 text-gold-400" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

export default function AccountDialog({ account, onSave, onClose }: Props) {
  const isEdit = !!account;
  const [name,     setName]     = useState(account?.name ?? "");
  const [type,     setType]     = useState<AccountType>((account?.account_type as AccountType) ?? "live");
  const [broker,   setBroker]   = useState(account?.broker ?? "");
  const [currency, setCurrency] = useState(account?.currency ?? "EUR");
  const [balance,  setBalance]  = useState(String(account?.starting_balance ?? ""));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [warnBal,  setWarnBal]  = useState(false);

  useEffect(() => {
    if (isEdit && account) {
      setWarnBal(balance !== "" && parseFloat(balance) !== account.starting_balance);
    }
  }, [balance, isEdit, account]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const n = name.trim();
    const b = parseFloat(balance);
    if (!n)            { setError("Konto-Name ist erforderlich."); return; }
    if (isNaN(b) || b < 0) { setError("Startkapital muss \u2265 0 sein."); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Nicht eingeloggt."); setLoading(false); return; }

    if (isEdit && account) {
      const { error: err } = await supabase.from("accounts").update({
        name: n,
        account_type: type,
        broker: broker.trim() || null,
        currency,
        starting_balance: b,
      }).eq("id", account.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: n,
        account_type: type,
        broker: broker.trim() || null,
        currency,
        starting_balance: b,
        current_balance: b,
        is_active: true,
        is_archived: false,
      });
      if (err) { setError(err.message); setLoading(false); return; }
    }
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-elevated border border-bg-border rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Konto bearbeiten" : "Neues Konto anlegen"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Konto-Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Hauptkonto, Demo-Test"
              className="w-full bg-bg-card border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Typ */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Konto-Typ *</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "p-3 rounded-xl border text-center transition",
                    type === opt.value
                      ? opt.active
                      : "border-bg-border bg-bg-card text-zinc-500 hover:border-zinc-600"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: "<div class=\"text-xs font-bold\">" + opt.label + "</div><div class=\"text-[10px] mt-0.5 opacity-70\">" + opt.desc + "</div>"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Broker */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Broker (optional)</label>
            <input
              type="text"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="z.B. Vantage, IC Markets"
              className="w-full bg-bg-card border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Währung + Startkapital */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">W&#228;hrung</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-bg-card border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Startkapital *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="10000"
                className="w-full bg-bg-card border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Warnung Startkapital-Änderung */}
          {warnBal && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400">
                Achtung: Performance-Berechnungen &#228;ndern sich r&#252;ckwirkend wenn du das Startkapital &#228;nderst.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-bg-border text-sm text-zinc-400 hover:text-white transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 text-bg text-sm font-semibold hover:bg-gold-400 transition disabled:opacity-50"
            >
              {loading ? "Speichern..." : isEdit ? "Speichern" : "Anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
