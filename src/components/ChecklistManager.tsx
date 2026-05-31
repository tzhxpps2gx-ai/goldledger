"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/checklist";
import {
  getChecklistItemsAction,
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
  resetToDefaultChecklistAction,
} from "@/app/actions/checklist";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, RotateCcw } from "lucide-react";

export default function ChecklistManager() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await getChecklistItemsAction();
    setItems(data as ChecklistItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAddLoading(true);
    await addChecklistItemAction(newLabel, newDesc);
    setNewLabel(""); setNewDesc(""); setShowAdd(false);
    await load();
    setAddLoading(false);
  }

  async function handleDelete(id: string) {
    setSaving(id);
    await deleteChecklistItemAction(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSaving(null);
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const newItems = [...items];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);
    await Promise.all([
      updateChecklistItemAction(newItems[index].id, { sort_order: index + 1 }),
      updateChecklistItemAction(newItems[target].id, { sort_order: target + 1 }),
    ]);
  }

  async function handleEditSave(id: string) {
    if (!editLabel.trim()) return;
    setSaving(id);
    await updateChecklistItemAction(id, { label: editLabel.trim() });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, label: editLabel.trim() } : i));
    setEditingId(null);
    setSaving(null);
  }

  async function handleReset() {
    setResetLoading(true);
    await resetToDefaultChecklistAction();
    await load();
    setShowResetConfirm(false);
    setResetLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Deine Pre-Trading-Regeln</h3>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-sm">
            Diese Regeln erscheinen beim Anlegen eines neuen Trades. Hak ab, was du eingehalten hast &#8212; daraus berechnet sich dein Disziplin-Score.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-bg-border text-zinc-500 hover:text-white hover:border-zinc-600 rounded-lg text-xs transition"
        >
          <RotateCcw className="w-3 h-3" />
          Auf Default
        </button>
      </div>

      {showResetConfirm && (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <span className="text-xs text-zinc-300 flex-1">Alle Regeln durch die 8 Standard-Regeln ersetzen?</span>
          <button type="button" onClick={() => setShowResetConfirm(false)} disabled={resetLoading}
            className="px-3 py-1.5 border border-bg-border text-zinc-400 hover:text-white rounded-lg text-xs transition disabled:opacity-40">
            Abbrechen
          </button>
          <button type="button" onClick={handleReset} disabled={resetLoading}
            className="px-3 py-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1">
            {resetLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Zur&#252;cksetzen
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-6">
            Noch keine Regeln. Klick auf &#8222;+ Neue Regel&#8220; um zu starten.
          </p>
        )}
        {items.map((item, idx) => (
          <div key={item.id}
            className="flex items-start gap-2 p-3 bg-bg-elevated border border-bg-border rounded-xl group">
            <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
              <button type="button" onClick={() => handleMove(idx, -1)} disabled={idx === 0 || saving === item.id}
                className="p-0.5 text-zinc-600 hover:text-white disabled:opacity-30 transition">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1 || saving === item.id}
                className="p-0.5 text-zinc-600 hover:text-white disabled:opacity-30 transition">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(item.id); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                    className="flex-1 bg-bg-card border border-gold-500/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                  />
                  <button type="button" onClick={() => handleEditSave(item.id)} disabled={saving === item.id}
                    className="px-2 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-400 rounded-lg text-xs font-medium transition disabled:opacity-50">
                    {saving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)}
                    className="px-2 py-1 border border-bg-border text-zinc-500 hover:text-white rounded-lg text-xs transition">
                    Abbruch
                  </button>
                </div>
              ) : (
                <button type="button"
                  onClick={() => { setEditingId(item.id); setEditLabel(item.label); }}
                  className="text-sm text-zinc-200 hover:text-white text-left w-full transition">
                  {item.label}
                </button>
              )}
              {item.description && editingId !== item.id && (
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
            <button type="button" onClick={() => handleDelete(item.id)} disabled={saving === item.id}
              className="flex-shrink-0 p-1.5 text-zinc-600 hover:text-danger transition disabled:opacity-40 rounded-lg">
              {saving === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="p-4 bg-bg-elevated border border-gold-500/30 rounded-xl space-y-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Regelbezeichnung (z.B. Trend analysiert?)"
            autoFocus
            className="w-full bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold-500"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optionale Beschreibung (kann leer bleiben)"
            className="w-full bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-gold-500/50"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowAdd(false); setNewLabel(""); setNewDesc(""); }}
              className="flex-1 py-2 border border-bg-border text-zinc-400 hover:text-white rounded-xl text-sm transition">
              Abbrechen
            </button>
            <button type="button" onClick={handleAdd} disabled={!newLabel.trim() || addLoading}
              className="flex-1 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
              {addLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Speichern
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gold-500/40 text-gold-400 hover:bg-gold-500/5 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" />
          Neue Regel hinzuf&#252;gen
        </button>
      )}
    </div>
  );
}
