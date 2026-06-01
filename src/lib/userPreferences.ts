import { createClient } from "@/lib/supabase/client";

export type StreakMode = "trading_only" | "all_weekdays";
export type NewsImpact = "low" | "medium" | "high";

export type UserPreferences = {
  streak_mode: StreakMode;
  sound_enabled: boolean;
  active_account_id: string | null;
  celebrated_goal_ids: string[];
  news_currencies: string[];
  news_min_impact: NewsImpact;
  news_warning_minutes: number;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  streak_mode: "trading_only",
  sound_enabled: false,
  active_account_id: null,
  celebrated_goal_ids: [],
  news_currencies: ["USD"],
  news_min_impact: "medium",
  news_warning_minutes: 30,
};

export async function updateUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ [key]: value }).eq("id", user.id);
}
