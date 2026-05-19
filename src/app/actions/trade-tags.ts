"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveTradeTagsAction(
  tradeId: string,
  tagIds: string[]
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht eingeloggt" };

  // Bestehende Tags löschen
  await supabase.from("trade_tags").delete().eq("trade_id", tradeId);

  if (tagIds.length === 0) return { error: null };

  // Neue Tags einfügen — zuerst ohne user_id versuchen
  const { error: errWithout } = await supabase.from("trade_tags").insert(
    tagIds.map((tagId) => ({ trade_id: tradeId, tag_id: tagId }))
  );

  if (!errWithout) return { error: null };

  // Falls fehlgeschlagen: mit user_id versuchen
  const { error: errWith } = await supabase.from("trade_tags").insert(
    tagIds.map((tagId) => ({
      user_id: user.id,
      trade_id: tradeId,
      tag_id: tagId,
    }))
  );

  if (!errWith) return { error: null };

  // Beide fehlgeschlagen → Fehler zurückgeben
  return { error: `Ohne user_id: ${errWithout.message} | Mit user_id: ${errWith.message}` };
}
