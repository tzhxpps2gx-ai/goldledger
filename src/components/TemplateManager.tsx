"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus } from "lucide-react";
import type { TradeTemplate } from "@/components/TemplatePickerModal";

export default function TemplateManager() {
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("trade_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data ?? []) as TradeTemplate[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteTemplate(id: string) {
    const supabase = createClient();
    await supabase.from("trade_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Lade Templates...</p>;
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center">
        <p className="text-sm text-zinc-400">Noch keine Templates gespeichert.</p>
        <p className="text-xs text-zinc-600 mt-1">
          Öffne einen bestehenden Trade → "Trade bearbeiten" → "Als Template speichern".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={"px-1.5 py-0.5 rounded text-[10px] font-bold border leading-none " + (t.direction === "long" ? "bg-success/15 text-success border-success/30" : "bg-danger/15 text-danger border-danger/30")}>
                {t.direction === "long" ? "LONG" : "SHORT"}
              </span>
              <span className="text-sm font-medium text-white truncate">{t.name}</span>
            </div>
            {t.setup && <p className="text-xs text-zinc-500 truncate">{t.setup}</p>}
            <p className="text-xs text-zinc-600 mt-0.5">
              {t.lot_size} Lot
              {t.planned_entry ? " · Entry " + t.planned_entry : ""}
              {t.planned_stop ? " · SL " + t.planned_stop : ""}
              {t.planned_target ? " · TP " + t.planned_target : ""}
            </p>
          </div>
          <button
            onClick={() => deleteTemplate(t.id)}
            className="p-2 rounded-lg text-zinc-600 hover:text-danger hover:bg-danger/10 transition shrink-0"
            title="Template löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
