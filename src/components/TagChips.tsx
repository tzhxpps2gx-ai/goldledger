"use client";

import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/tags";

// Deutsche Labels für die Standard-Kategorien
const CATEGORY_LABELS: Record<string, string> = {
  mistake: "Fehler",
  setup: "Setup",
  emotion: "Emotion",
};

// Reihenfolge der Kategorien im Edit-Modus
const CATEGORY_ORDER = ["setup", "mistake", "emotion"];

type Props = {
  tags: Tag[];          // Alle verfügbaren Tags
  selectedIds: string[]; // IDs der ausgewählten Tags
  onChange?: (ids: string[]) => void; // nur im edit-Modus
  mode?: "edit" | "display";
  // Nur im display-Modus: max. Chips bevor "+N" erscheint
  maxDisplay?: number;
};

export default function TagChips({
  tags,
  selectedIds,
  onChange,
  mode = "display",
  maxDisplay,
}: Props) {

  // ─── DISPLAY-MODUS: nur ausgewählte Tags als Badges ───────────────────────
  if (mode === "display") {
    const selected = tags.filter((t) => selectedIds.includes(t.id));
    if (selected.length === 0) return null;

    const visible = maxDisplay != null ? selected.slice(0, maxDisplay) : selected;
    const hiddenCount = selected.length - visible.length;

    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gold-500/10 text-gold-400 border border-gold-500/20"
          >
            {/* Farbpunkt zeigt Tag-Kategorie an */}
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-elevated text-zinc-500 border border-bg-border">
            {"+" + hiddenCount}
          </span>
        )}
      </div>
    );
  }

  // ─── EDIT-MODUS: alle Tags nach Kategorie, klickbar ───────────────────────
  function toggle(tagId: string) {
    if (!onChange) return;
    onChange(
      selectedIds.includes(tagId)
        ? selectedIds.filter((id) => id !== tagId)
        : [...selectedIds, tagId]
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-xs text-zinc-500 italic">
        Noch keine Tags vorhanden — werden beim Onboarding angelegt.
      </p>
    );
  }

  // Kategorien in definierter Reihenfolge, unbekannte ans Ende
  const knownCats = CATEGORY_ORDER.filter((c) => tags.some((t) => t.category === c));
  const otherCats = Array.from(new Set(tags.map((t) => t.category))).filter(
    (c) => !CATEGORY_ORDER.includes(c)
  );
  const allCats = [...knownCats, ...otherCats];

  return (
    <div className="space-y-3">
      {allCats.map((cat) => {
        const catTags = tags.filter((t) => t.category === cat);
        const label = CATEGORY_LABELS[cat] ?? cat;

        return (
          <div key={cat}>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1.5">
              {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {catTags.map((tag) => {
                const active = selectedIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95",
                      active
                        ? "bg-gold-500/20 border border-gold-500/40 text-gold-400 shadow-sm shadow-gold-500/10"
                        : "bg-bg-elevated border border-bg-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
