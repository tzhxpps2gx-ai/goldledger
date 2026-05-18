"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, Check, X, AlertCircle, Loader2 } from "lucide-react";
import type { Tag } from "@/lib/tags";

// Standard-Farben je Kategorie
const CATEGORY_COLORS: Record<string, string> = {
  setup: "#10B981",
  mistake: "#EF4444",
  emotion: "#3B82F6",
  custom: "#D4AF37",
};

const CATEGORY_LABELS: Record<string, string> = {
  setup: "Setup",
  mistake: "Fehler",
  emotion: "Emotion",
  custom: "Sonstige",
};

type DeleteConfirm = {
  id: string;
  name: string;
  tradeCount: number | null; // null = wird noch geladen
};

export default function TagManager() {
  const supabase = createClient();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline-Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Löschen mit Bestätigung
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Neuen Tag hinzufügen
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("setup");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Animations-Sets
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    const { data } = await supabase
      .from("tags")
      .select("id, name, category, color")
      .order("category")
      .order("name");
    setTags((data ?? []) as Tag[]);
    setLoading(false);
  }

  // ── Inline-Edit ──────────────────────────────────────────────────────────────

  function startEdit(tag: Tag) {
    setDeleteConfirm(null);
    setEditingId(tag.id);
    setEditValue(tag.name);
    setEditError(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
    setEditError(null);
  }

  async function saveEdit(tag: Tag) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditError("Name darf nicht leer sein");
      return;
    }
    if (trimmed === tag.name) {
      cancelEdit();
      return;
    }
    if (
      tags.some(
        (t) => t.id !== tag.id && t.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setEditError("Dieser Name existiert bereits");
      return;
    }

    setSavingId(tag.id);
    // Optimistisch aktualisieren — sofort sichtbar
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, name: trimmed } : t))
    );
    setEditingId(null);

    const { error } = await supabase
      .from("tags")
      .update({ name: trimmed })
      .eq("id", tag.id);

    setSavingId(null);
    if (error) {
      // Bei Fehler zurücksetzen
      setTags((prev) =>
        prev.map((t) => (t.id === tag.id ? { ...t, name: tag.name } : t))
      );
      setEditError(error.message);
    }
  }

  // ── Löschen ──────────────────────────────────────────────────────────────────

  async function requestDelete(tag: Tag) {
    cancelEdit();
    setDeleteConfirm({ id: tag.id, name: tag.name, tradeCount: null });

    // Anzahl betroffener Trades laden
    const { count } = await supabase
      .from("trade_tags")
      .select("*", { count: "exact", head: true })
      .eq("tag_id", tag.id);

    setDeleteConfirm((prev) =>
      prev?.id === tag.id ? { ...prev, tradeCount: count ?? 0 } : prev
    );
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeletingId(id);

    // Fade-out-Animation starten
    setFadingIds((prev) => new Set([...prev, id]));

    // trade_tags zuerst löschen, dann den Tag
    await supabase.from("trade_tags").delete().eq("tag_id", id);
    await supabase.from("tags").delete().eq("id", id);

    // Nach der Transition aus der Liste entfernen
    setTimeout(() => {
      setTags((prev) => prev.filter((t) => t.id !== id));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteConfirm(null);
      setDeletingId(null);
    }, 300);
  }

  // ── Neuen Tag hinzufügen ─────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();

    if (!trimmed) {
      setAddError("Name darf nicht leer sein");
      return;
    }
    if (
      tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setAddError("Dieser Name existiert bereits");
      return;
    }

    setAdding(true);
    setAddError(null);

    const color = CATEGORY_COLORS[newCategory] ?? "#D4AF37";
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAddError("Nicht eingeloggt");
      setAdding(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: trimmed, category: newCategory, color })
      .select()
      .single();

    setAdding(false);

    if (error || !inserted) {
      setAddError(error?.message ?? "Fehler beim Speichern");
      return;
    }

    const newTag = inserted as Tag;

    // Optimistisch einfügen + Fade-in markieren
    setTags((prev) => {
      const list = [...prev, newTag];
      list.sort((a, b) =>
        a.category !== b.category
          ? a.category.localeCompare(b.category)
          : a.name.localeCompare(b.name)
      );
      return list;
    });
    setFreshIds((prev) => new Set([...prev, newTag.id]));
    setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(newTag.id);
        return next;
      });
    }, 600);

    setNewName("");
    newInputRef.current?.focus();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag-Liste */}
      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
        {tags.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-sm">
            Noch keine Tags vorhanden.
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {tags.map((tag) => {
              const isFading = fadingIds.has(tag.id);
              const isFresh = freshIds.has(tag.id);
              const isEditing = editingId === tag.id;
              const isDeleteConfirm = deleteConfirm?.id === tag.id;

              return (
                <div
                  key={tag.id}
                  className={cn(
                    "px-4 py-3 transition-all duration-300",
                    isFading && "opacity-0 scale-y-0 max-h-0 py-0",
                    isFresh && "animate-fade-in",
                    isDeleteConfirm && "bg-danger/5"
                  )}
                >
                  {isEditing ? (
                    /* ── Inline-Edit ── */
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => {
                            setEditValue(e.target.value);
                            setEditError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(tag);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 bg-bg-elevated border border-gold-500/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500 transition"
                        />
                        <button
                          onClick={() => saveEdit(tag)}
                          className="p-1.5 text-success hover:bg-success/10 rounded-lg transition"
                          title="Speichern (Enter)"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-zinc-500 hover:bg-bg-elevated rounded-lg transition"
                          title="Abbrechen (Esc)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {editError && (
                        <p className="text-[10px] text-danger ml-5">{editError}</p>
                      )}
                    </div>
                  ) : isDeleteConfirm ? (
                    /* ── Inline-Bestätigung ── */
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-sm text-danger">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          {deleteConfirm.tradeCount === null ? (
                            "Lade betroffene Trades…"
                          ) : deleteConfirm.tradeCount === 0 ? (
                            <span>
                              Tag <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong> wirklich löschen?
                            </span>
                          ) : (
                            <span>
                              Tag <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong> wirklich löschen?
                              Wird von{" "}
                              <strong>
                                {deleteConfirm.tradeCount}{" "}
                                {deleteConfirm.tradeCount === 1 ? "Trade" : "Trades"}
                              </strong>{" "}
                              entfernt.
                            </span>
                          )}
                        </span>
                      </div>
                      {deleteConfirm.tradeCount !== null && (
                        <div className="flex gap-2">
                          <button
                            onClick={confirmDelete}
                            disabled={!!deletingId}
                            className="px-3 py-1.5 bg-danger/15 border border-danger/30 text-danger text-xs font-medium rounded-lg hover:bg-danger/25 transition disabled:opacity-50"
                          >
                            {deletingId ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Löschen…
                              </span>
                            ) : (
                              "Ja, löschen"
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={!!deletingId}
                            className="px-3 py-1.5 bg-bg-elevated border border-bg-border text-zinc-400 text-xs font-medium rounded-lg hover:text-white transition disabled:opacity-50"
                          >
                            Abbrechen
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Normale Ansicht ── */
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm text-white min-w-0 truncate">
                        {tag.name}
                        {savingId === tag.id && (
                          <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin text-zinc-500" />
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider hidden sm:block flex-shrink-0">
                        {CATEGORY_LABELS[tag.category] ?? tag.category}
                      </span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => startEdit(tag)}
                          className="p-1.5 text-zinc-500 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition"
                          title="Umbenennen"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDelete(tag)}
                          className="p-1.5 text-zinc-500 hover:text-danger hover:bg-danger/10 rounded-lg transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Neuer Tag */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
          Neuer Tag
        </h3>

        <form onSubmit={handleAdd} className="space-y-3">
          {/* Kategorie-Auswahl */}
          <div className="grid grid-cols-3 gap-1.5">
            {(["setup", "mistake", "emotion"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewCategory(cat)}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-medium transition-all",
                  newCategory === cat
                    ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                    : "bg-bg-elevated border border-bg-border text-zinc-400 hover:text-zinc-300"
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Name-Eingabe + Plus-Button */}
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[newCategory] }}
            />
            <input
              ref={newInputRef}
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError(null);
              }}
              placeholder="Tag-Name…"
              className="flex-1 px-3 py-2 bg-bg-elevated border border-bg-border rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="p-2 bg-gold-500/20 border border-gold-500/40 text-gold-400 rounded-lg hover:bg-gold-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Hinzufügen (Enter)"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>

          {addError && (
            <p className="text-[11px] text-danger ml-5">{addError}</p>
          )}
        </form>
      </div>
    </div>
  );
}
