"use client";

import { useEffect } from "react";
import { X, BookTemplate, ChevronRight } from "lucide-react";

export type TradeTemplate = {
  id: string;
  name: string;
  direction: string;
  setup: string | null;
  reasoning: string | null;
  planned_entry: number | null;
  planned_stop: number | null;
  planned_target: number | null;
  lot_size: number;
};

export default function TemplatePickerModal({
  templates,
  onSelect,
  onClose,
}: {
  templates: TradeTemplate[];
  onSelect: (t: TradeTemplate) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-bg-card border border-bg-border rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-white">Template laden</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X size={16} />
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-400">Noch keine Templates gespeichert.</p>
            <p className="text-xs text-zinc-600 mt-1">Speichere einen Trade als Template unter "Trade bearbeiten".</p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); onClose(); }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-gold-500/40 hover:bg-gold-500/5 transition text-left"
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
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
