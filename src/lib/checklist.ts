export type ChecklistItem = {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_CHECKLIST_ITEMS: { label: string; description: string; sort_order: number }[] = [
  {
    label: "Markttrend analysiert (HTF + LTF)",
    description: "Higher Timeframe (z.B. H4/D1) und Lower Timeframe (z.B. M15/M5) auf Trendrichtung geprüft.",
    sort_order: 1,
  },
  {
    label: "News-Kalender geprüft — keine High-Impact News in 30 Min",
    description: "ForexFactory oder ähnlichen Kalender auf rote Events geprüft. Kein Trade 30 Min vor/nach High-Impact News.",
    sort_order: 2,
  },
  {
    label: "Setup-Bestätigung vorhanden (mind. 2 Konfluenzen)",
    description: "Mindestens 2 unabhängige Signale bestätigen den Trade (z.B. Struktur + FVG + Session-Level).",
    sort_order: 3,
  },
  {
    label: "Risiko unter 2% des Account-Balance",
    description: "Maximaler Verlust bei Stop-Loss beträgt weniger als 2% des aktuellen Kontostands.",
    sort_order: 4,
  },
  {
    label: "Stop und Target VOR Entry definiert",
    description: "Klarer Stop-Loss und Take-Profit Level festgelegt, bevor die Order platziert wird.",
    sort_order: 5,
  },
  {
    label: "Bin ich emotional ruhig? (kein FOMO, kein Revenge)",
    description: "Ehrliche Selbsteinschätzung: Kein Frust aus vorherigen Trades, keine Angst etwas zu verpassen.",
    sort_order: 6,
  },
  {
    label: "Trade-Zeit innerhalb meiner Trading-Hours",
    description: "Trade liegt innerhalb der persönlich definierten Trading-Zeiten (z.B. London/NY Open).",
    sort_order: 7,
  },
  {
    label: "Position-Size korrekt berechnet",
    description: "Lot-Size anhand von Stop-Distanz und Risikoprozent nochmals nachgerechnet.",
    sort_order: 8,
  },
];

export async function ensureDefaultChecklistItems(
  supabase: any,
  userId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from("checklist_items").insert(
    DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      user_id: userId,
      label: item.label,
      description: item.description,
      sort_order: item.sort_order,
      is_active: true,
    }))
  );
}
