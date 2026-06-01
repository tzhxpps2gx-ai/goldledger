"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const ALL_CURRENCIES = ["USD","EUR","GBP","JPY","AUD","NZD","CHF","CAD"];
const WARN_OPTS = [15, 30, 45, 60];
type Impact = "low" | "medium" | "high";

export default function NewsPreferences() {
  const supabase = createClient();
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [minImpact, setMinImpact] = useState<Impact>("medium");
  const [warnMins, setWarnMins] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("news_currencies, news_min_impact, news_warning_minutes")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setCurrencies((data.news_currencies as string[]) ?? ["USD"]);
        setMinImpact((data.news_min_impact as Impact) ?? "medium");
        setWarnMins((data.news_warning_minutes as number) ?? 30);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleCurrency(c: string) {
    setCurrencies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("profiles").update({
      news_currencies: currencies,
      news_min_impact: minImpact,
      news_warning_minutes: warnMins,
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Währungen */}
      <div>
        <div className="text-sm font-semibold text-white mb-1">Beobachtete W&#228;hrungen</div>
        <p className="text-xs text-zinc-500 mb-3">
          Du bekommst Warnungen nur f&#252;r diese W&#228;hrungen.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_CURRENCIES.map((c) => (
            <button key={c} type="button" onClick={() => toggleCurrency(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                currencies.includes(c)
                  ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                  : "bg-bg-elevated border-bg-border text-zinc-500 hover:text-white"
              )}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Mindest-Impact */}
      <div>
        <div className="text-sm font-semibold text-white mb-1">Mindest-Impact</div>
        <p className="text-xs text-zinc-500 mb-3">Nur Events ab diesem Impact l&#246;sen Warnungen aus.</p>
        <div className="grid grid-cols-3 gap-2">
          {(["low","medium","high"] as Impact[]).map((impact) => (
            <button key={impact} type="button" onClick={() => { setMinImpact(impact); setSaved(false); }}
              className={cn(
                "py-2.5 px-3 rounded-xl border text-xs font-semibold transition",
                minImpact === impact
                  ? impact === "high"   ? "bg-danger/20 border-danger/40 text-danger"
                  : impact === "medium" ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-zinc-700/40 border-zinc-600 text-zinc-300"
                  : "bg-bg-elevated border-bg-border text-zinc-500 hover:text-white"
              )}>
              {impact === "low" ? "Low (alle)" : impact === "medium" ? "Medium+" : "High only"}
            </button>
          ))}
        </div>
      </div>

      {/* Warn-Zeitraum */}
      <div>
        <div className="text-sm font-semibold text-white mb-1">Warn-Zeitraum</div>
        <p className="text-xs text-zinc-500 mb-3">
          Innerhalb dieses Zeitraums vor und nach einer News bekommst du Warnungen beim Trade-Anlegen &#8212; inklusive Best&#228;tigungs-Modal vor dem Submit.
        </p>
        <div className="flex gap-2">
          {WARN_OPTS.map((m) => (
            <button key={m} type="button" onClick={() => { setWarnMins(m); setSaved(false); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-xs font-semibold transition",
                warnMins === m
                  ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                  : "bg-bg-elevated border-bg-border text-zinc-500 hover:text-white"
              )}>
              {m} Min
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={saving}
        className="w-full py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {saved ? "Gespeichert ✓" : "Einstellungen speichern"}
      </button>
    </div>
  );
}
