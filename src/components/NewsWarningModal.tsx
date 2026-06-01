"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";
import { formatTimeUntil } from "@/lib/news/newsStatus";
import { AlertTriangle, X } from "lucide-react";

const IMPACT_COLOR: Record<string, string> = {
  high:   "bg-danger/20 text-danger border-danger/40",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  low:    "bg-zinc-700/40 text-zinc-500 border-zinc-600",
};
const IMPACT_LABEL: Record<string, string> = { high: "HIGH IMPACT", medium: "MEDIUM IMPACT", low: "LOW IMPACT" };

type Props = {
  isOpen: boolean;
  event: NewsEvent | null;
  minutesUntil: number | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
  });
}

export default function NewsWarningModal({ isOpen, event, minutesUntil, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen || !event) return null;

  const timeStr = formatTime(event.event_datetime);
  const countdown = minutesUntil !== null ? formatTimeUntil(minutesUntil) : "JETZT";
  const impactLabel = IMPACT_LABEL[event.impact] ?? "NEWS";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full sm:max-w-md bg-bg-card border border-bg-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">News-Event in Trade-Zeit</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Erh&#246;hte Volatilit&#228;t erwartet</p>
            </div>
          </div>
          <button type="button" onClick={onCancel}
            className="p-1.5 text-zinc-500 hover:text-white transition rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event-Card */}
        <div className="p-5 space-y-4">
          <div className="bg-bg-elevated border border-bg-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", IMPACT_COLOR[event.impact])}>
                {impactLabel}
              </span>
              <span className="text-xs font-bold text-zinc-400">{event.currency}</span>
            </div>
            <div className="text-sm font-semibold text-white leading-snug">{event.event_name}</div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Heute um {timeStr} Uhr</span>
              <span className={cn(
                "font-semibold",
                (minutesUntil ?? 0) <= 5 ? "text-danger" : "text-orange-400"
              )}>
                {countdown}
              </span>
            </div>
            {(event.forecast || event.previous) && (
              <div className="flex gap-4 text-[11px] text-zinc-500">
                {event.forecast && <span>Prognose: <span className="text-zinc-300">{event.forecast}</span></span>}
                {event.previous && <span>Vorher: <span className="text-zinc-300">{event.previous}</span></span>}
              </div>
            )}
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Du legst gerade einen Trade an, w&#228;hrend ein{" "}
            <span className={cn(
              "font-semibold",
              event.impact === "high" ? "text-danger" : "text-orange-400"
            )}>
              {event.impact === "high" ? "High" : event.impact === "medium" ? "Medium" : "Low"} Impact
            </span>{" "}
            News-Event in deinem Warn-Zeitraum liegt. Bist du dir bewusst und willst du den Trade trotzdem anlegen?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-bg-border text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl text-sm font-medium transition">
              Zur&#252;ck zum Formular
            </button>
            <button type="button" onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl text-sm transition shadow-md shadow-gold-500/20">
              Trade trotzdem anlegen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
