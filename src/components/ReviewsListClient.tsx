"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews";
import { getPeriodLabel } from "@/lib/reviews";
import { BookOpen } from "lucide-react";

type Tab = "all" | "weekly" | "monthly" | "draft";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "weekly", label: "Wochenreviews" },
  { key: "monthly", label: "Monatsreviews" },
  { key: "draft", label: "Entwürfe" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPreview(answers: Record<string, string>): string {
  for (const val of Object.values(answers)) {
    const trimmed = val?.trim();
    if (trimmed) return trimmed.slice(0, 100) + (trimmed.length > 100 ? "…" : "");
  }
  return "Noch keine Antworten eingetragen.";
}

export default function ReviewsListClient({ reviews }: { reviews: Review[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (tab === "weekly") return r.period_type === "weekly";
      if (tab === "monthly") return r.period_type === "monthly";
      if (tab === "draft") return r.status === "draft";
      return true;
    });
  }, [reviews, tab]);

  if (reviews.length === 0) {
    return (
      <>
        <div className="flex gap-1 border-b border-bg-border pb-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t.key
                  ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                  : "text-zinc-500 hover:text-zinc-300")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-bg-card border border-bg-border rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm mb-1">Noch keine Reviews vorhanden.</p>
          <p className="text-zinc-600 text-xs">
            Schreib dein erstes Review und beginne, deine Muster zu erkennen.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter-Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              tab === t.key
                ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                : "bg-bg-card border border-bg-border text-zinc-400 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm">Keine Reviews in dieser Kategorie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Link key={r.id} href={"/reviews/" + r.id}
              className="block bg-bg-card border border-bg-border rounded-2xl p-4 hover:border-gold-500/30 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-full">
                    {getPeriodLabel(r.period_type, r.period_end)}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    r.status === "submitted"
                      ? "bg-success/15 text-success"
                      : "bg-yellow-500/15 text-yellow-400"
                  )}>
                    {r.status === "submitted" ? "Fertig" : "Entwurf"}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-600 flex-shrink-0">
                  {r.status === "submitted" && r.submitted_at
                    ? "Abgeschlossen " + formatDate(r.submitted_at)
                    : "Erstellt " + formatDate(r.created_at)}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2 group-hover:text-zinc-300 transition">
                {getPreview(r.answers)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
