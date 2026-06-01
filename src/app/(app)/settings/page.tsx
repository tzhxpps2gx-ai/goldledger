"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import TagManager from "@/components/TagManager";
import ChecklistManager from "@/components/ChecklistManager";
import NewsPreferences from "@/components/NewsPreferences";
import { createClient } from "@/lib/supabase/client";
import {
  type UserPreferences,
  type StreakMode,
  DEFAULT_PREFERENCES,
  updateUserPreference,
} from "@/lib/userPreferences";
import { Volume2, VolumeX, Flame, Calendar } from "lucide-react";

type Tab = "checklist" | "news" | "tags" | "konto" | "profil" | "belohnungen";

const TABS: { id: Tab; label: string }[] = [
  { id: "checklist",   label: "Checklist" },
  { id: "news",        label: "News" },
  { id: "tags",        label: "Tags" },
  { id: "konto",       label: "Konto" },
  { id: "profil",      label: "Profil" },
  { id: "belohnungen", label: "Belohnungen" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("checklist");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setPrefsLoaded(true); return; }
      supabase
        .from("profiles")
        .select("streak_mode, sound_enabled, active_account_id, celebrated_goal_ids")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPrefs({
              ...DEFAULT_PREFERENCES,
              streak_mode: (data.streak_mode as StreakMode) ?? DEFAULT_PREFERENCES.streak_mode,
              sound_enabled: data.sound_enabled ?? DEFAULT_PREFERENCES.sound_enabled,
              active_account_id: (data.active_account_id as string | null) ?? null,
              celebrated_goal_ids: (data.celebrated_goal_ids as string[]) ?? [],
            });
          }
          setPrefsLoaded(true);
        });
    });
  }, []);

  async function toggleSound() {
    const newVal = !prefs.sound_enabled;
    setPrefs((p) => ({ ...p, sound_enabled: newVal }));
    await updateUserPreference("sound_enabled", newVal);
  }

  async function setStreakMode(mode: StreakMode) {
    setPrefs((p) => ({ ...p, streak_mode: mode }));
    await updateUserPreference("streak_mode", mode);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Einstellungen
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Verwalte deine Checklist, Tags, Konto-Daten und Profil.
        </p>
      </div>

      <div className="flex gap-1 bg-bg-card border border-bg-border rounded-xl p-1 overflow-x-auto scrollbar-hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 min-w-[72px] py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-bg-elevated text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "checklist" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <ChecklistManager />
        </div>
      )}

      {activeTab === "news" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">News &amp; Markt-Events</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Konfiguriere deine News-Warnungen beim Trade-Anlegen.
            </p>
          </div>
          <NewsPreferences />
        </div>
      )}

      {activeTab === "tags" && <TagManager />}

      {activeTab === "konto" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">&#127974;</div>
          <h2 className="text-base font-semibold text-white mb-2">Konto-Einstellungen</h2>
          <p className="text-zinc-500 text-sm">Kommt bald.</p>
        </div>
      )}

      {activeTab === "profil" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">&#128100;</div>
          <h2 className="text-base font-semibold text-white mb-2">Profil-Einstellungen</h2>
          <p className="text-zinc-500 text-sm">Kommt bald.</p>
        </div>
      )}

      {activeTab === "belohnungen" && (
        <div className="space-y-4">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {prefs.sound_enabled ? (
                  <Volume2 className="w-5 h-5 text-gold-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-zinc-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-white">Erfolgs-Sound</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Spielt einen Ton beim Erreichen eines Ziels
                  </div>
                </div>
              </div>
              <button
                onClick={toggleSound}
                disabled={!prefsLoaded}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50",
                  prefs.sound_enabled ? "bg-gold-500" : "bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    prefs.sound_enabled && "translate-x-5"
                  )}
                />
              </button>
            </div>
          </div>

          <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-semibold text-white">Streak-Modus</span>
            </div>
            <p className="text-xs text-zinc-500">
              Legt fest, wie deine Trading-Serie berechnet wird.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setStreakMode("trading_only")}
                disabled={!prefsLoaded}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all disabled:opacity-50",
                  prefs.streak_mode === "trading_only"
                    ? "border-gold-500/60 bg-gold-500/[0.08] text-white"
                    : "border-bg-border bg-bg-elevated/40 text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Flame className={cn("w-4 h-4", prefs.streak_mode === "trading_only" ? "text-gold-400" : "text-zinc-500")} />
                  <span className="text-sm font-semibold">Nur Trading-Tage</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Freie Tage und Wochenenden unterbrechen die Serie nicht.
                </p>
              </button>
              <button
                onClick={() => setStreakMode("all_weekdays")}
                disabled={!prefsLoaded}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all disabled:opacity-50",
                  prefs.streak_mode === "all_weekdays"
                    ? "border-gold-500/60 bg-gold-500/[0.08] text-white"
                    : "border-bg-border bg-bg-elevated/40 text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className={cn("w-4 h-4", prefs.streak_mode === "all_weekdays" ? "text-gold-400" : "text-zinc-500")} />
                  <span className="text-sm font-semibold">Alle Werktage</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Werktage ohne Trade unterbrechen die Gewinn-Serie.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
