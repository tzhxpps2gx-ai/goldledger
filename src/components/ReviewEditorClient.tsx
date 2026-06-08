"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { ReviewTemplate } from "@/lib/reviewTemplates";
import type { Review, ReviewStats, ReviewTrade } from "@/lib/reviews";
import { getPeriodLabel } from "@/lib/reviews";
import {
  updateReviewAnswersAction,
  submitReviewAction,
  deleteReviewAction,
} from "@/app/actions/reviews";
import { ArrowLeft, Check, Loader2, Copy, ExternalLink, ChevronDown, Trash2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  review: Review;
  periodType: "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
  template: ReviewTemplate;
  stats: ReviewStats;
  trades: ReviewTrade[];
  currency: string;
  disciplineScore?: number | null;
  disciplineTradeCount?: number;
};

function formatDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatExitTime(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl p-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
      {children}
    </div>
  );
}

function TradeCard({ label, trade, currency, onCopyId }: {
  label: string; trade: ReviewTrade; currency: string; onCopyId: (id: string) => void;
}) {
  return (
    <StatCard label={label}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
              trade.direction === "long" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}>
              {trade.direction === "long" ? "L" : "S"}
            </span>
            <span className="text-sm font-semibold text-white">{trade.symbol}</span>
          </div>
          <div className={cn("text-base font-bold mt-0.5",
            (trade.pnl_currency ?? 0) >= 0 ? "text-success" : "text-danger")}>
            {(trade.pnl_currency ?? 0) >= 0 ? "+" : ""}
            {formatCurrency(trade.pnl_currency ?? 0, currency)}
          </div>
          {trade.exit_time && (
            <div className="text-[10px] text-zinc-600 mt-0.5">{formatExitTime(trade.exit_time)}</div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Link href={"/trades/" + trade.id} target="_blank"
            className="p-1.5 rounded-lg bg-bg-card border border-bg-border text-zinc-500 hover:text-white transition"
            title="Trade &#246;ffnen">
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button type="button" onClick={() => onCopyId(trade.id)}
            className="p-1.5 rounded-lg bg-bg-card border border-bg-border text-zinc-500 hover:text-gold-400 transition"
            title="ID kopieren">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </StatCard>
  );
}

export default function ReviewEditorClient({
  review,
  periodType, periodStart, periodEnd,
  template, stats, trades, currency,
  disciplineScore, disciplineTradeCount,
}: Props) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>(review.answers ?? {});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestAnswers = useRef<Record<string, string>>(answers);
  latestAnswers.current = answers;

  const saveNow = useCallback(async (currentAnswers: Record<string, string>) => {
    setSaveStatus("saving");
    const { error } = await updateReviewAnswersAction(review.id, currentAnswers);
    if (error) { setSaveStatus("error"); return; }
    setSaveStatus("saved");
    setLastSaved(new Date());
  }, [review.id]);

  const handleChange = useCallback((key: string, value: string) => {
    const next = { ...latestAnswers.current, [key]: value };
    setAnswers(next);
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNow(next), 1000);
  }, [saveNow]);

  async function handleSaveAndBack() {
    await saveNow(latestAnswers.current);
    router.push("/reviews");
  }

  async function handleSubmit() {
    setSubmitting(true);
    const { error } = await submitReviewAction(review.id, latestAnswers.current);
    if (!error) {
      router.push("/reviews/" + review.id);
    } else {
      setSaveStatus("error");
      setShowSubmitConfirm(false);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deleteReviewAction(review.id);
    if (!error) {
      router.push("/reviews");
    } else {
      setSaveStatus("error");
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  }

  function handleCopyId(tradeId: string) {
    navigator.clipboard.writeText("#" + tradeId).catch(() => {});
    setCopiedId(tradeId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const periodLabel = getPeriodLabel(periodType, periodEnd);
  const dateRange = formatDate(periodStart) + " – " + formatDate(periodEnd);

  const sidebar = (
    <div className="space-y-3">
      <StatCard label="Zeitraum-Performance">
        <div className={cn("text-xl font-bold", stats.totalPnl >= 0 ? "text-success" : "text-danger")}>
          {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl, currency)}
        </div>
        <div className="flex gap-3 mt-2">
          <div>
            <div className="text-[10px] text-zinc-500">Trades</div>
            <div className="text-sm font-semibold text-white">{stats.tradeCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500">Win Rate</div>
            <div className="text-sm font-semibold text-white">{Math.round(stats.winRate)} %</div>
          </div>
          {stats.avgRMultiple != null && (
            <div>
              <div className="text-[10px] text-zinc-500">&#216; R</div>
              <div className="text-sm font-semibold text-white">{stats.avgRMultiple.toFixed(2)}R</div>
            </div>
          )}
        </div>
        {stats.tradeCount > 0 && (
          <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-success/60"
              style={{ width: Math.round(stats.winRate) + "%" }} />
          </div>
        )}
        {stats.tradeCount === 0 && (
          <p className="text-xs text-zinc-600 mt-1">Keine Trades im Zeitraum.</p>
        )}
      </StatCard>
      {disciplineScore != null && (
        <StatCard label="Disziplin">
          <div className={cn(
            "text-xl font-bold",
            disciplineScore >= 80 ? "text-success" : disciplineScore >= 50 ? "text-gold-400" : "text-danger"
          )}>
            {disciplineScore} %
          </div>
          <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full",
              disciplineScore >= 80 ? "bg-success/60" : disciplineScore >= 50 ? "bg-gold-400/60" : "bg-danger/60"
            )} style={{ width: disciplineScore + "%" }} />
          </div>
          {disciplineTradeCount != null && disciplineTradeCount > 0 && (
            <p className="text-[10px] text-zinc-600 mt-1.5">
              {"Basierend auf " + disciplineTradeCount + (disciplineTradeCount === 1 ? " Trade" : " Trades") + " mit Checklist"}
            </p>
          )}
        </StatCard>
      )}
      {stats.bestTrade && (
        <TradeCard label="Bester Trade" trade={stats.bestTrade}
          currency={currency} onCopyId={handleCopyId} />
      )}
      {stats.worstTrade && stats.worstTrade.id !== stats.bestTrade?.id && (
        <TradeCard label="Schlechtester Trade" trade={stats.worstTrade}
          currency={currency} onCopyId={handleCopyId} />
      )}
      {(stats.bestDay || stats.worstDay) && (
        <StatCard label="Tage">
          {stats.bestDay && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-zinc-400">Bester Tag</span>
              <span className="text-sm font-semibold text-success">
                {stats.bestDay.pnl >= 0 ? "+" : ""}{formatCurrency(stats.bestDay.pnl, currency)}
                <span className="text-[10px] text-zinc-600 ml-1">{formatDate(stats.bestDay.date)}</span>
              </span>
            </div>
          )}
          {stats.worstDay && stats.worstDay.date !== stats.bestDay?.date && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-[11px] text-zinc-400">Schw&#228;chster Tag</span>
              <span className="text-sm font-semibold text-danger">
                {formatCurrency(stats.worstDay.pnl, currency)}
                <span className="text-[10px] text-zinc-600 ml-1">{formatDate(stats.worstDay.date)}</span>
              </span>
            </div>
          )}
        </StatCard>
      )}
      {copiedId && (
        <div className="text-[11px] text-gold-400 text-center flex items-center justify-center gap-1">
          <Check className="w-3 h-3" />
          #ID kopiert &#8212; f&#252;g es in deine Antwort ein
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Zurück + Löschen */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/reviews"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
          <ArrowLeft className="w-3 h-3" />
          Alle Reviews
        </Link>
        <button type="button" onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-danger transition">
          <Trash2 className="w-3.5 h-3.5" />
          Entwurf l&#246;schen
        </button>
      </div>

      {/* Löschen-Bestätigung (inline) */}
      {showDeleteConfirm && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl">
          <span className="text-xs text-zinc-300 flex-1">Entwurf wirklich l&#246;schen?</span>
          <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
            className="px-3 py-1.5 border border-bg-border text-zinc-400 hover:text-white rounded-lg text-xs transition disabled:opacity-40">
            Abbrechen
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-3 py-1.5 bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1">
            {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
            Ja, l&#246;schen
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-full">
              {periodLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
              Entwurf
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{template.title}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{dateRange}</p>
        </div>
        <div className="text-right flex-shrink-0 pt-1 min-w-[130px]">
          {saveStatus === "saving" && (
            <span className="text-[11px] text-zinc-500 flex items-center justify-end gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Speichert&#8230;
            </span>
          )}
          {saveStatus === "saved" && lastSaved && (
            <span className="text-[11px] text-success flex items-center justify-end gap-1">
              <Check className="w-3 h-3" />
              {"Gespeichert " + lastSaved.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-[11px] text-danger">Fehler beim Speichern</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {template.questions.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-semibold text-white mb-1">{q.label}</label>
              {q.hint && <p className="text-[11px] text-zinc-500 mb-2">{q.hint}</p>}
              <textarea
                value={answers[q.key] ?? ""}
                onChange={(e) => handleChange(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={4}
                className="w-full bg-bg-card border border-bg-border rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 resize-none transition"
                style={{ minHeight: "100px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = t.scrollHeight + "px";
                }}
              />
            </div>
          ))}

          <div className="flex items-center gap-3 pb-8">
            <button type="button" onClick={handleSaveAndBack} disabled={saveStatus === "saving"}
              className="px-4 py-2 border border-bg-border text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl text-sm font-medium transition disabled:opacity-50">
              Als Entwurf speichern
            </button>
            <button type="button" onClick={() => setShowSubmitConfirm(true)}
              className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all shadow-md shadow-gold-500/20 text-sm">
              Review abschlie&#223;en
            </button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6">{sidebar}</div>
        </div>
      </div>

      <div className="lg:hidden border-t border-bg-border mt-2 pt-4">
        <button type="button" onClick={() => setSidebarOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition mb-3">
          <ChevronDown className={cn("w-4 h-4 transition-transform", sidebarOpen && "rotate-180")} />
          Zeitraum-Stats {sidebarOpen ? "ausblenden" : "anzeigen"}
        </button>
        {sidebarOpen && sidebar}
      </div>

      {/* Abschließen-Modal: Fullscreen-Flex, kein separates Overlay */}
      {showSubmitConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowSubmitConfirm(false); }}
        >
          <div
            className="bg-bg-card border border-bg-border rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white mb-2">Review abschlie&#223;en?</h3>
            <p className="text-sm text-zinc-400 mb-5">
              Du kannst es danach noch einmal &#246;ffnen, aber so dokumentierst du den aktuellen Stand als abgeschlossen.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-bg-border text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition disabled:opacity-40">
                Abbrechen
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Abschlie&#223;en
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

