import { createClient } from "@/lib/supabase/server";
import {
  type UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/userPreferences";

export async function getUserPreferences(): Promise<UserPreferences> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PREFERENCES;

  const { data } = await supabase
    .from("profiles")
    .select("streak_mode, sound_enabled, active_account_id, celebrated_goal_ids, news_currencies, news_min_impact, news_warning_minutes")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return DEFAULT_PREFERENCES;

  return {
    streak_mode: (data.streak_mode as UserPreferences["streak_mode"]) ?? DEFAULT_PREFERENCES.streak_mode,
    sound_enabled: data.sound_enabled ?? DEFAULT_PREFERENCES.sound_enabled,
    active_account_id: (data.active_account_id as string | null) ?? null,
    celebrated_goal_ids: (data.celebrated_goal_ids as string[]) ?? [],
    news_currencies: (data.news_currencies as string[]) ?? DEFAULT_PREFERENCES.news_currencies,
    news_min_impact: (data.news_min_impact as UserPreferences["news_min_impact"]) ?? DEFAULT_PREFERENCES.news_min_impact,
    news_warning_minutes: (data.news_warning_minutes as number) ?? DEFAULT_PREFERENCES.news_warning_minutes,
  };
}
