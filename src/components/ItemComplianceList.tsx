"use client";

import { cn } from "@/lib/utils";
import type { ItemCompliance } from "@/lib/disciplineScore";

type Props = {
  items: ItemCompliance[];
};

function barColor(rate: number): string {
  if (rate >= 80) return "bg-success";
  if (rate >= 60) return "bg-yellow-400";
  return "bg-danger";
}

function textColor(rate: number): string {
  if (rate >= 80) return "text-success";
  if (rate >= 60) return "text-yellow-400";
  return "text-danger";
}

export default function ItemComplianceList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-6 text-center">
        <p className="text-sm text-zinc-500">
          Keine Checklist-Items vorhanden. Gehe zu Einstellungen &#8594; Checklist.
        </p>
      </div>
    );
  }

  const withData = items.filter((i) => i.checkedCount + i.uncheckedCount > 0);

  if (withData.length === 0) {
    return (
      <div className="bg-bg-card border border-bg-border rounded-2xl p-6 text-center">
        <p className="text-sm text-zinc-500">
          Noch keine Checklist-Daten vorhanden. Lege Trades mit Checklist an.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_120px] gap-4 px-4 py-2 border-b border-bg-border text-[10px] text-zinc-500 uppercase tracking-wider">
        <span>Regel</span>
        <span className="text-right">Abgehakt</span>
        <span className="text-right">&#220;bersprungen</span>
        <span className="text-right">Compliance</span>
      </div>
      <div className="divide-y divide-bg-border">
        {withData.map(({ item, checkedCount, uncheckedCount, complianceRate }) => (
          <div key={item.id} className="px-4 py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-zinc-200 leading-snug">{item.label}</span>
              <span className={cn("text-sm font-bold tabular-nums flex-shrink-0", textColor(complianceRate))}>
                {complianceRate}%
              </span>
            </div>
            <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor(complianceRate))}
                style={{ width: complianceRate + "%" }}
              />
            </div>
            <div className="flex gap-4 text-[11px] text-zinc-500">
              <span className="text-success">&#10003; {checkedCount}&#215; abgehakt</span>
              <span className="text-danger">&#10007; {uncheckedCount}&#215; &#252;bersprungen</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
