"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateReviewAnswersAction(
  reviewId: string,
  answers: Record<string, string>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function submitReviewAction(
  reviewId: string,
  answers: Record<string, string>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error: updateErr } = await supabase
    .from("reviews")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (updateErr) return { error: updateErr.message };

  const { error } = await supabase
    .from("reviews")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { error: null };
}
