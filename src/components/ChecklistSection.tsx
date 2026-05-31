"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/checklist";
import { Info } from "lucide-react";

type Props = {
  items: ChecklistItem[];
  checked: Record<string, boolean>;
  onChange: (itemId: string, value: boolean) => void;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-yellow-400";
  return "text-danger";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-yellow-400";
  return "bg-danger";
}

export default function ChecklistSection({ items, checked, onChange }: Props) {
  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const score = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  if (items.length === 0) return null;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">
          Pre-Trading-Checklist
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Hak ab, was du vor diesem Trade gepr&#252;ft hast
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={checked[item.id] ?? false}
                onChange={(e) => onChange(item.id, e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                checked[item.id]
                  ? "bg-gold-500 border-gold-500"
                  : "bg-bg-elevated border-bg-border group-hover:border-zinc-500"
              )}>
                {checked[item.id] && (
                  <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-sm transition-colors",
                checked[item.id] ? "text-white" : "text-zinc-300"
              )}>
                {item.label}
              </span>
              {item.description && (
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Score-Footer */}
      <div className="pt-2 border-t border-bg-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {checkedCount} von {items.length} abgehakt
          </span>
          <span className={cn("text-sm font-bold tabular-nums", scoreColor(score))}>
            Score: {score}%
          </span>
        </div>
        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", scoreBarColor(score))}
            style={{ width: score + "%" }}
          />
        </div>
      </div>
    </div>
  );
}
