"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveReviewAction(
  reviewId: string | null,
  periodType: "weekly" | "monthly",
  periodStart: string,
  periodEnd: string,
  answers: Record<string, string>
): Promise<{ id: string | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Nicht angemeldet" };

  if (!reviewId) {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        answers,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) return { id: null, error: error.message };
    return { id: data.id as string, error: null };
  } else {
    const { error } = await supabase
      .from("reviews")
      .update({ answers, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", user.id);
    if (error) return { id: reviewId, error: error.message };
    return { id: reviewId, error: null };
  }
}

export async function submitReviewAction(
  reviewId: string,
  answers: Record<string, string>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  // Erst sicherstellen dass aktuelle Antworten gespeichert sind
  await supabase
    .from("reviews")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("reviews")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { error: null };
}
