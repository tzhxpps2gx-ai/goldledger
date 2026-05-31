"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/checklist";

export async function getChecklistItemsAction(): Promise<{
  data: any[];
  error: string | null;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Nicht eingeloggt" };

  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order");

  return { data: data ?? [], error: error?.message ?? null };
}

export async function addChecklistItemAction(
  label: string,
  description: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt" };

  const { data: existing } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.sort_order ?? 0;

  const { error } = await supabase.from("checklist_items").insert({
    user_id: user.id,
    label: label.trim(),
    description: description.trim() || null,
    sort_order: maxOrder + 1,
    is_active: true,
  });
  return { error: error?.message ?? null };
}

export async function updateChecklistItemAction(
  id: string,
  fields: { label?: string; description?: string; sort_order?: number }
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteChecklistItemAction(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function resetToDefaultChecklistAction(): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt" };

  await supabase
    .from("checklist_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  const { error } = await supabase.from("checklist_items").insert(
    DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      user_id: user.id,
      label: item.label,
      description: item.description,
      sort_order: item.sort_order,
      is_active: true,
    }))
  );
  return { error: error?.message ?? null };
}

export async function saveTradeChecklistAction(
  tradeId: string,
  completions: Array<{ item_id: string; is_checked: boolean }>
): Promise<{ error: string | null }> {
  const supabase = createClient();

  await supabase
    .from("trade_checklist_completions")
    .delete()
    .eq("trade_id", tradeId);

  if (completions.length === 0) return { error: null };

  const { error } = await supabase
    .from("trade_checklist_completions")
    .insert(completions.map((c) => ({ trade_id: tradeId, ...c })));

  return { error: error?.message ?? null };
}
