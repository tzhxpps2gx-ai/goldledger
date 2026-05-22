"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";
import { isReviewDue, getCurrentPeriodBounds, getPeriodLabel } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/client";

type Banner = {
  periodType: "weekly" | "monthly";
  label: string;
  href: string;
};

export default function ReviewDueBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from("reviews")
        .select("period_type, period_end")
        .order("period_end", { ascending: false })
        .limit(10);

      const lastWeekly = (data ?? []).find((r) => r.period_type === "weekly")?.period_end ?? null;
      const lastMonthly = (data ?? []).find((r) => r.period_type === "monthly")?.period_end ?? null;

      const result: Banner[] = [];
      for (const type of ["weekly", "monthly"] as const) {
        const last = type === "weekly" ? lastWeekly : lastMonthly;
        if (isReviewDue(last, type)) {
          const bounds = getCurrentPeriodBounds(type);
          // Vorperiode für den Link verwenden
          const { getPreviousPeriodBounds } = await import("@/lib/reviews");
          const prev = getPreviousPeriodBounds(type);
          result.push({
            periodType: type,
            label: getPeriodLabel(type, prev.end),
            href: "/reviews/new?type=" + type,
          });
        }
      }
      setBanners(result);
    }
    check();
  }, []);

  const visible = banners.filter((b) => !dismissed.includes(b.periodType));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((b) => (
        <div key={b.periodType}
          className="flex items-center gap-3 bg-gold-500/5 border border-gold-500/20 rounded-2xl px-4 py-3">
          <BookOpen className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">
              {b.periodType === "weekly" ? "Wochenreview" : "Monatsreview"} f&#252;r {b.label} steht an
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Reflektiere &#252;ber deine Performance und finde Muster
            </div>
          </div>
          <Link href={b.href}
            className="flex-shrink-0 px-3 py-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30 rounded-xl text-xs font-medium transition">
            Jetzt schreiben
          </Link>
          <button onClick={() => setDismissed((prev) => [...prev, b.periodType])}
            className="p-1 text-zinc-600 hover:text-zinc-400 transition flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
