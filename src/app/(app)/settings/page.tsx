"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import TagManager from "@/components/TagManager";
import ChecklistManager from "@/components/ChecklistManager";
import NewsPreferences from "@/components/NewsPreferences";
import AccountManager from "@/components/AccountManager";
import TemplateManager from "@/components/TemplateManager";
import { createClient } from "@/lib/supabase/client";
import {
  type UserPreferences,
  type StreakMode,
  DEFAULT_PREFERENCES,
  updateUserPreference,
} from "@/lib/userPreferences";
import {
  Building2,
  ListChecks,
  Newspaper,
  Tag,
  BookTemplate,
  Gift,
  ChevronRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  Calendar,
} from "lucide-react";

type Section = "konten" | "checklist" | "news" | "tags" | "templates" | "belohnungen";

const SECTIONS: { id: Section; label: string; description: string; icon: React.ElementType }[] = [
  { id: "konten",      label: "Konten",          description: "Trading-Konten verwalten",          icon: Building2 },
  { id: "checklist",   label: "Checklist",        description: "Pre-Trading Checkliste anpassen",   icon: ListChecks },
  { id: "news",        label: "News & Warnungen", description: "ForexFactory-Warnungen konfigurieren", icon: Newspaper },
  { id: "tags",        label: "Tags",             description: "Trade-Tags erstellen und verwalten", icon: Tag },
  { id: "templates",   label: "Templates",        description: "Gespeicherte Trade-Vorlagen",       icon: BookTemplate },
  { id: "belohnungen", label: "Belohnungen",      description: "Sound, Streak-Modus",               icon: Gift },
];

export default function SettingsPage() {
  const [active, setActive] = useState<Section | null>(null);
  const [prefs, setPrefs]   = useState<UserPreferences>(DEFAULT_PREFERENCES);
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

  const currentSection = SECTIONS.find((s) => s.id === active);

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {active && (
          <button
            type="button"
            onClick={() => setActive(null)}
            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {active ? currentSection?.label : "Einstellungen"}
          </h1>
          {!active && (
            <p className="text-zinc-400 text-sm mt-0.5">
              Konten, Checklist, Tags und mehr
            </p>
          )}
        </div>
      </div>

      {/* List view */}
      {!active && (
        <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden divide-y divide-bg-border">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-bg-elevated/60 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{s.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Section content */}
      {active === "konten" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <AccountManager />
        </div>
      )}

      {active === "checklist" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <ChecklistManager />
        </div>
      )}

      {active === "news" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-5">
            Konfiguriere deine News-Warnungen beim Trade-Anlegen.
          </p>
          <NewsPreferences />
        </div>
      )}

      {active === "tags" && <TagManager />}

      {active === "templates" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-5">
            Templates k&#246;nnen beim Anlegen eines neuen Trades geladen werden.
          </p>
          <TemplateManager />
        </div>
      )}

      {active === "belohnungen" && (
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
                type="button"
                onClick={toggleSound}
                disabled={!prefsLoaded}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50",
                  prefs.sound_enabled ? "bg-gold-500" : "bg-zinc-700"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  prefs.sound_enabled && "translate-x-5"
                )} />
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
                type="button"
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
                type="button"
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
