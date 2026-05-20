import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/userPreferences";

const MIGRATION_FLAG = "goldledger_migration_v1_done";

export async function migrateLegacyPreferences(
  supabase: SupabaseClient,
  userId: string,
  currentPrefs: UserPreferences
): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG) === "1") return;

  const updates: Record<string, unknown> = {};

  const storedAccount =
    localStorage.getItem("goldledger_active_account") ||
    localStorage.getItem("activeAccountId");
  if (storedAccount && currentPrefs.active_account_id === null) {
    updates.active_account_id = storedAccount;
  }

  const storedSound = localStorage.getItem("goldledger_sound_enabled");
  if (
    storedSound !== null &&
    currentPrefs.sound_enabled === DEFAULT_PREFERENCES.sound_enabled
  ) {
    updates.sound_enabled = storedSound === "true";
  }

  const storedMode = localStorage.getItem("goldledger_streak_mode");
  if (
    storedMode &&
    (storedMode === "trading_only" || storedMode === "all_weekdays") &&
    currentPrefs.streak_mode === DEFAULT_PREFERENCES.streak_mode
  ) {
    updates.streak_mode = storedMode;
  }

  const storedGoals = localStorage.getItem("goldledger_celebrated_goals");
  if (storedGoals && currentPrefs.celebrated_goal_ids.length === 0) {
    try {
      const ids = JSON.parse(storedGoals) as unknown;
      if (Array.isArray(ids) && ids.length > 0) {
        updates.celebrated_goal_ids = ids;
      }
    } catch {
      // silent
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("profiles").update(updates).eq("id", userId);
  }

  for (const k of [
    "goldledger_active_account",
    "activeAccountId",
    "goldledger_sound_enabled",
    "goldledger_streak_mode",
    "goldledger_celebrated_goals",
  ]) {
    localStorage.removeItem(k);
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
}
