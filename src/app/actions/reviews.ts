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
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reviews")
    .update({ answers, status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteReviewAction(
  reviewId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { error: null };
}
