"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calculateXauusdPnlEur,
  calculateRMultiple,
  calculatePlannedRR,
  fetchEurUsdRate,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
import TagChips from "@/components/TagChips";
import ChecklistSection from "@/components/ChecklistSection";
import NewsWarningModal from "@/components/NewsWarningModal";
import TemplatePickerModal, { type TradeTemplate } from "@/components/TemplatePickerModal";
import type { Tag } from "@/lib/tags";
import type { ChecklistItem } from "@/lib/checklist";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";
import { getNewsStatus } from "@/lib/news/newsStatus";
import { saveTradeTagsAction } from "@/app/actions/trade-tags";
import { saveTradeChecklistAction, getChecklistItemsAction } from "@/app/actions/checklist";

export default function NewTradePage() {
  const router = useRouter();
  const supabase = createClient();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // News Warning
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [newsCurrencies, setNewsCurrencies] = useState<string[]>(["USD"]);
  const [newsMinImpact, setNewsMinImpact] = useState<"low"|"medium"|"high">("medium");
  const [newsWarnMins, setNewsWarnMins] = useState(30);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [warningEvent, setWarningEvent] = useState<NewsEvent | null>(null);
  const [warningMins, setWarningMins] = useState<number | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [form, setForm] = useState({
    account_id: "",
    direction: "long" as "long" | "short",
    setup: "",
    reasoning: "",
    planned_entry: "",
    planned_stop: "",
    planned_target: "",
    lot_size: "0.01",
    actual_entry: "",
    actual_exit: "",
    entry_time: "",
    exit_time: "",
    notes: "",
    status: "closed" as "planned" | "open" | "closed",
  });

  useEffect(() => {
    async function loadData() {
      const now = new Date();
      const to = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({ from: now.toISOString(), to, minImpact: "low" });

      const [{ data: accs }, { data: tagsData }, { data: clItems }, { data: tmplData }] = await Promise.all([
        supabase.from("accounts").select("*").eq("is_archived", false),
        supabase.from("tags").select("id, name, category, color").order("category").order("name"),
        getChecklistItemsAction(),
        supabase.from("trade_templates").select("*").order("created_at", { ascending: false }),
      ]);
      if (accs && accs.length > 0) {
        setAccounts(accs);
        setForm((f) => ({ ...f, account_id: accs[0].id }));
      }
      setAvailableTags((tagsData ?? []) as Tag[]);
      setChecklistItems((clItems ?? []) as ChecklistItem[]);
      setTemplates((tmplData ?? []) as TradeTemplate[]);

      // News + User-Prefs laden
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [newsRes, { data: profile }] = await Promise.all([
          fetch("/api/news?" + params.toString()),
          supabase.from("profiles").select("news_currencies,news_min_impact,news_warning_minutes").eq("id", user.id).maybeSingle(),
        ]);
        if (newsRes.ok) {
          const d = await newsRes.json();
          setNewsEvents(d.events ?? []);
        }
        if (profile) {
          setNewsCurrencies((profile.news_currencies as string[]) ?? ["USD"]);
          setNewsMinImpact((profile.news_min_impact as "low"|"medium"|"high") ?? "medium");
          setNewsWarnMins((profile.news_warning_minutes as number) ?? 30);
        }
      }
    }
    loadData();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyTemplate(t: TradeTemplate) {
    setForm((f) => ({
      ...f,
      direction: (t.direction as "long" | "short") ?? f.direction,
      setup: t.setup ?? f.setup,
      reasoning: t.reasoning ?? f.reasoning,
      planned_entry: t.planned_entry?.toString() ?? f.planned_entry,
      planned_stop: t.planned_stop?.toString() ?? f.planned_stop,
      planned_target: t.planned_target?.toString() ?? f.planned_target,
      lot_size: t.lot_size?.toString() ?? f.lot_size,
    }));
  }

  function handleChecklistChange(itemId: string, value: boolean) {
    setCheckedItems((prev) => ({ ...prev, [itemId]: value }));
  }

  async function doSubmit(flaggedAgainstNews = false) {
    setLoading(true);
    setError(null);

    const lotSize = parseFloat(form.lot_size) || 0.01;
    const plannedEntry = parseFloat(form.planned_entry) || null;
    const plannedStop = parseFloat(form.planned_stop) || null;
    const plannedTarget = parseFloat(form.planned_target) || null;
    const actualEntry = parseFloat(form.actual_entry) || null;
    const actualExit = parseFloat(form.actual_exit) || null;

    let plannedRR = null;
    if (plannedEntry && plannedStop && plannedTarget) {
      plannedRR = calculatePlannedRR(plannedEntry, plannedStop, plannedTarget, form.direction);
    }

    let pnl = null;
    let rMultiple = null;
    let pnlPercent = null;
    let exchangeRate = 1.0;

    if (form.status === "closed" && actualEntry && actualExit) {
      exchangeRate = await fetchEurUsdRate();
      pnl = calculateXauusdPnlEur(actualEntry, actualExit, lotSize, form.direction, exchangeRate);
      if (plannedStop) {
        rMultiple = calculateRMultiple(actualEntry, plannedStop, actualExit, form.direction);
      }
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        pnlPercent = (pnl / Number(account.starting_balance)) * 100;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Nicht eingeloggt");
      setLoading(false);
      return;
    }

    const checklistUsed = checklistItems.length > 0;

    const { data: newTrade, error: insertError } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        account_id: form.account_id,
        symbol: "XAUUSD",
        direction: form.direction,
        setup: form.setup || null,
        reasoning: form.reasoning || null,
        planned_entry: plannedEntry,
        planned_stop: plannedStop,
        planned_target: plannedTarget,
        planned_rr: plannedRR,
        lot_size: lotSize,
        actual_entry: actualEntry,
        actual_exit: actualExit,
        entry_time: form.entry_time || null,
        exit_time: form.exit_time || null,
        pnl_currency: pnl,
        pnl_percent: pnlPercent,
        r_multiple: rMultiple,
        exchange_rate: exchangeRate,
        status: form.status,
        notes: form.notes || null,
        checklist_used: checklistUsed,
        traded_against_news: flaggedAgainstNews,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (form.status === "closed" && pnl !== null && pnl !== 0) {
      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        await supabase
          .from("accounts")
          .update({ current_balance: Number(account.current_balance) + pnl })
          .eq("id", account.id);
      }
    }

    if (selectedTagIds.length > 0) {
      const { error: tagError } = await saveTradeTagsAction(newTrade.id, selectedTagIds);
      if (tagError) {
        setError("Tags konnten nicht gespeichert werden: " + tagError);
        setLoading(false);
        return;
      }
    }

    if (checklistUsed) {
      const completions = checklistItems.map((item) => ({
        item_id: item.id,
        is_checked: checkedItems[item.id] ?? false,
      }));
      await saveTradeChecklistAction(newTrade.id, completions);
    }

    router.refresh();
    router.push("/trades/" + newTrade.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (newsCurrencies.length > 0) {
      const st = getNewsStatus(newsEvents, newsCurrencies, newsMinImpact, new Date(), newsWarnMins);
      if (st.currentlyInWindow && st.windowEvents.length > 0) {
        const ev = st.windowEvents.sort((a, b) =>
          Math.abs(new Date(a.event_datetime).getTime() - Date.now()) -
          Math.abs(new Date(b.event_datetime).getTime() - Date.now())
        )[0];
        const mins = Math.round((new Date(ev.event_datetime).getTime() - Date.now()) / 60_000);
        setWarningEvent(ev);
        setWarningMins(mins);
        setShowNewsModal(true);
        setPendingSubmit(true);
        return;
      }
    }

    await doSubmit();
  }

  async function handleModalConfirm() {
    setShowNewsModal(false);
    setPendingSubmit(false);
    await doSubmit(true);
  }

  function handleModalCancel() {
    setShowNewsModal(false);
    setPendingSubmit(false);
  }

  if (accounts.length === 0) {
    return <div className="text-zinc-400">Lade Konten...</div>;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Neuer Trade
              </h1>
              <p className="text-zinc-400 text-sm mt-1">XAUUSD &#183; in EUR</p>
            </div>
            {templates.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:border-gold-500/50 hover:text-gold-400 transition mt-1"
              >
                Template laden
              </button>
            )}
          </div>
          {accounts.length > 0 && (() => {
            const acc = accounts.find((a: any) => a.id === form.account_id) ?? accounts[0];
            const TBADGE: Record<string, {label:string;cls:string}> = { live: { label: "LIVE", cls: "bg-success/15 text-success border-success/30" }, demo: { label: "DEMO", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" }, prop: { label: "PROP", cls: "bg-gold-500/15 text-gold-400 border-gold-500/30" } };
            const badge = TBADGE[String(acc?.account_type ?? "live")] ?? TBADGE.live;
            return (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-zinc-500 text-xs">Trade f&#252;r:</span>
                <span className="text-xs text-white font-medium">{acc?.name}</span>
                <span className={"px-1.5 py-0.5 rounded text-[10px] font-bold border " + badge.cls}>{badge.label}</span>
              </div>
            );
          })()}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
            {accounts.length > 1 && (
              <div>
                <Label>Konto</Label>
                <select
                  value={form.account_id}
                  onChange={(e) => update("account_id", e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 bg-bg-elevated border border-bg-border rounded-xl text-white focus:outline-none focus:border-gold-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>Richtung</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button type="button" onClick={() => update("direction", "long")}
                  className={cn("py-3 rounded-xl font-semibold transition",
                    form.direction === "long"
                      ? "bg-success/20 border border-success/40 text-success"
                      : "bg-bg-elevated border border-bg-border text-zinc-400")}>
                  &#9650; LONG
                </button>
                <button type="button" onClick={() => update("direction", "short")}
                  className={cn("py-3 rounded-xl font-semibold transition",
                    form.direction === "short"
                      ? "bg-danger/20 border border-danger/40 text-danger"
                      : "bg-bg-elevated border border-bg-border text-zinc-400")}>
                  &#9660; SHORT
                </button>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Pre-Trade Plan</h3>
            <div>
              <Label>Setup</Label>
              <input type="text" value={form.setup} onChange={(e) => update("setup", e.target.value)}
                placeholder="z.B. Breakout, FVG, Liquidity Sweep" className={inputCls} />
            </div>
            <div>
              <Label>Begr&#252;ndung</Label>
              <textarea value={form.reasoning} onChange={(e) => update("reasoning", e.target.value)}
                placeholder="Warum machst du diesen Trade?" rows={2} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Entry geplant</Label><input type="number" step="0.01" value={form.planned_entry} onChange={(e) => update("planned_entry", e.target.value)} placeholder="2650.50" className={inputCls} /></div>
              <div><Label>Stop</Label><input type="number" step="0.01" value={form.planned_stop} onChange={(e) => update("planned_stop", e.target.value)} placeholder="2645.00" className={inputCls} /></div>
              <div><Label>Target</Label><input type="number" step="0.01" value={form.planned_target} onChange={(e) => update("planned_target", e.target.value)} placeholder="2660.00" className={inputCls} /></div>
            </div>
            <div>
              <Label>Lot Size</Label>
              <input type="number" step="0.01" value={form.lot_size} onChange={(e) => update("lot_size", e.target.value)} className={inputCls} />
            </div>
          </div>

          <ChecklistSection items={checklistItems} checked={checkedItems} onChange={handleChecklistChange} />

          <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Ausf&#252;hrung</h3>
              <select value={form.status} onChange={(e) => update("status", e.target.value as any)}
                className="text-xs bg-bg-elevated border border-bg-border rounded-lg px-2 py-1 text-white">
                <option value="planned">Geplant</option>
                <option value="open">Offen</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tats&#228;chlicher Entry</Label><input type="number" step="0.01" value={form.actual_entry} onChange={(e) => update("actual_entry", e.target.value)} className={inputCls} /></div>
              <div><Label>Exit</Label><input type="number" step="0.01" value={form.actual_exit} onChange={(e) => update("actual_exit", e.target.value)} className={inputCls} /></div>
              <div><Label>Entry-Zeit</Label><input type="datetime-local" value={form.entry_time} onChange={(e) => update("entry_time", e.target.value)} className={inputCls} /></div>
              <div><Label>Exit-Zeit</Label><input type="datetime-local" value={form.exit_time} onChange={(e) => update("exit_time", e.target.value)} className={inputCls} /></div>
            </div>
            <div>
              <Label>Notizen</Label>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
                placeholder="Was lief gut? Fehler? Beobachtungen?" rows={3} className={inputCls} />
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-3">Tags</h3>
              <TagChips tags={availableTags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} mode="edit" />
            </div>
          )}

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 py-3 bg-bg-card border border-bg-border text-zinc-300 font-medium rounded-xl hover:bg-bg-elevated transition">
              Abbrechen
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition disabled:opacity-50 shadow-md shadow-gold-500/20">
              {loading ? "Speichern..." : "Trade speichern"}
            </button>
          </div>
        </form>
      </div>

      <NewsWarningModal
        isOpen={showNewsModal}
        event={warningEvent}
        minutesUntil={warningMins}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {showTemplatePicker && (
        <TemplatePickerModal
          templates={templates}
          onSelect={applyTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </>
  );
}

const inputCls =
  "w-full mt-1.5 px-3 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
      {children}
    </label>
  );
}
