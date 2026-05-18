// Tag-Typen, Statistiken und Datenlade-Hilfsfunktionen
// Nutzbar sowohl aus Server- als auch Client-Komponenten

export type Tag = {
  id: string;
  name: string;
  category: string; // "mistake" | "setup" | "emotion" | eigene
  color: string;    // Hex-Farbe, z.B. "#EF4444"
};

// Aggregierte Performance-Daten pro Tag (für Analytics)
export type TagStat = {
  id: string;
  name: string;
  category: string;
  color: string;
  tradeCount: number;
  totalPnl: number;
  winRate: number;      // 0–100
  avgR: number | null;
};

// Alle Tags des eingeloggten Benutzers laden (RLS filtert automatisch)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadUserTags(supabase: any): Promise<Tag[]> {
  const { data } = await supabase
    .from("tags")
    .select("id, name, category, color")
    .order("category")
    .order("name");
  return (data ?? []) as Tag[];
}

// Tags für eine Liste von Trade-IDs laden → Record<trade_id, Tag[]>
// Effizient: ein Query für alle Trades auf einmal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadTradeTagsMap(
  supabase: any,
  tradeIds: string[]
): Promise<Record<string, Tag[]>> {
  if (tradeIds.length === 0) return {};

  const { data } = await supabase
    .from("trade_tags")
    .select("trade_id, tags(id, name, category, color)")
    .in("trade_id", tradeIds);

  const map: Record<string, Tag[]> = {};
  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tag = (row as any).tags as Tag | null;
    if (!tag || !row.trade_id) continue;
    if (!map[row.trade_id]) map[row.trade_id] = [];
    map[row.trade_id].push(tag);
  }
  return map;
}

// Tags eines einzelnen Trades laden
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadTagsForTrade(
  supabase: any,
  tradeId: string
): Promise<Tag[]> {
  const { data } = await supabase
    .from("trade_tags")
    .select("tags(id, name, category, color)")
    .eq("trade_id", tradeId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? [])
    .map((row: any) => row.tags as Tag | null)
    .filter((t: Tag | null): t is Tag => t != null);
}
