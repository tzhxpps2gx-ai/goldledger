"use server";
import { createClient } from "@/lib/supabase/server";
import { getTodayBerlin } from "@/lib/goals";

export async function archiveExpiredGoalsAction(): Promise<void> {
  const supabase = createClient();
  const today = getTodayBerlin();
  await supabase
    .from("goals")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("period_end", today);
}
