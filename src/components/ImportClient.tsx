"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseMt5File } from "@/lib/mt5Parser";
import type { ParsedTrade } from "@/lib/mt5Parser";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";

type Account = { id: string; name: string; currency: string };
type TradeRow = { trade: ParsedTrade; isDuplicate: boolean; selected: boolean };
type Phase = "upload" | "parsing" | "preview" | "result";
type ImportResult = { imported: number; skipped: number; errors: string[] };

function fmtDate(iso: string): string {
  const p = iso.split("T")[0].split("-");
  return p[2] + "." + p[1] + "." + p[0].slice(2);
}

function fmtPrice(n: number): string {
  return n >= 100 ? n.toFixed(2) : n.toFixed(4);
}

export default function ImportClient({
  accounts,
  defaultAccountId,
}: {
  accounts: Account[];
  defaultAccountId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [brokerName, setBrokerName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const selectedCount = rows.filter((r) => r.selected).length;

  async function processFile(file: File) {
    setFileName(file.name);
    setPhase("parsing");
    setError(null);
    try {
      const parsed = await parseMt5File(file);
      if (parsed.trades.length === 0) {
        throw new Error("Keine Trades in der Datei gefunden.");
      }
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("trades")
        .select("broker_ticket_id")
        .eq("account_id", accountId)
        .not("broker_ticket_id", "is", null);

      const existingSet = new Set(
        (existing ?? []).map((t) => String(t.broker_ticket_id))
      );
      setRows(
        parsed.trades.map((trade) => ({
          trade,
          isDuplicate: existingSet.has(trade.ticket),
          selected: !existingSet.has(trade.ticket),
        }))
      );
      setWarnings(parsed.warnings);
      setBrokerName(parsed.brokerName);
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("upload");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleImport() {
    setImporting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setImporting(false);
      return;
    }

    const toImport = rows.filter((r) => r.selected);
    let imported = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (const { trade: t } of toImport) {
      const { error: insErr } = await supabase.from("trades").insert({
        account_id: accountId,
        user_id: user.id,
        symbol: t.symbol,
        direction: t.direction,
        status: t.exitTime ? "closed" : "open",
        entry_time: t.entryTime,
        exit_time: t.exitTime,
        actual_entry: t.entryPrice,
        actual_exit: t.exitPrice,
        stop_loss: t.stopLoss,
        take_profit: t.takeProfit,
        lot_size: t.volume,
        pnl_currency: t.exitTime ? t.profitRaw : null,
        broker_ticket_id: t.ticket,
        imported_at: now,
      });
      if (insErr) errors.push("Ticket " + t.ticket + ": " + insErr.message);
      else imported++;
    }

    setResult({ imported, skipped: toImport.length - imported, errors });
    setPhase("result");
    setImporting(false);
    router.refresh();
  }

  function resetToUpload() {
    setPhase("upload");
    setRows([]);
    setResult(null);
    setError(null);
  }

  // ── PHASE 1 + 2: UPLOAD / PARSING ─────────────────────────────────────
  if (phase === "upload" || phase === "parsing") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/trades"
            className="p-2 text-zinc-500 hover:text-white hover:bg-bg-card rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              MT5-Import
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Account-History aus MetaTrader 5 importieren
            </p>
          </div>
        </div>

        {accounts.length > 1 && (
          <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
            <label className="block text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2">
              Ziel-Konto
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={phase === "parsing"}
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition disabled:opacity-60"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f && phase !== "parsing") processFile(f);
          }}
          onClick={() => phase !== "parsing" && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all",
            phase !== "parsing" && "cursor-pointer",
            dragOver
              ? "border-gold-400 bg-gold-500/5"
              : "border-bg-border hover:border-zinc-600 bg-bg-card"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
          {phase === "parsing" ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
              <p className="text-zinc-400 text-sm">
                Analysiere{" "}
                <span className="text-white font-medium">{fileName}</span>
                ...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  MT5-Datei hier ablegen
                </p>
                <p className="text-zinc-500 text-sm">
                  oder{" "}
                  <span className="text-gold-400 underline underline-offset-2">
                    Datei auswählen
                  </span>
                </p>
              </div>
              <p className="text-zinc-600 text-xs">
                Akzeptiert: .html · .htm · .csv
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger">Fehler beim Einlesen</p>
              <p className="text-xs text-danger/80 mt-1 break-words">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-danger/60 hover:text-danger transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm text-zinc-400 hover:text-white transition"
          >
            <span className="font-medium">Wie exportiere ich aus MetaTrader 5?</span>
            {showInstructions ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
          {showInstructions && (
            <div className="px-5 pb-5 border-t border-bg-border">
              <ol className="space-y-2.5 mt-4">
                {[
                  "MetaTrader 5 öffnen",
                  'Unten im Terminal den Tab "Account History" wählen',
                  'Rechtsklick in die Liste → "Alle History" (alle Trades laden)',
                  'Erneut Rechtsklick → "Bericht speichern als..."',
                  "Format HTML oder Tabellenblatt (.csv) auswählen und speichern",
                  "Die gespeicherte Datei oben hochladen",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="w-5 h-5 rounded-full bg-gold-500/15 text-gold-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-px">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE 3: PREVIEW ──────────────────────────────────────────────────
  if (phase === "preview") {
    const newCount = rows.filter((r) => !r.isDuplicate).length;
    const dupCount = rows.filter((r) => r.isDuplicate).length;
    const allSelected = rows.length > 0 && rows.every((r) => r.selected);

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={resetToUpload}
            className="p-2 text-zinc-500 hover:text-white hover:bg-bg-card rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {rows.length} {rows.length === 1 ? "Trade" : "Trades"} gefunden
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              {fileName}
              {brokerName && " · " + brokerName}
              {" · "}
              <span className="text-gold-400">{account?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full bg-success/15 text-success font-medium">
            {newCount} neu
          </span>
          {dupCount > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
              {dupCount} {dupCount === 1 ? "Duplikat" : "Duplikate"}
            </span>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                {warnings.length}{" "}
                {warnings.length === 1 ? "Zeile übersprungen" : "Zeilen übersprungen"}
              </p>
              <ul className="mt-1 space-y-0.5">
                {warnings.slice(0, 3).map((w, i) => (
                  <li key={i} className="text-xs text-amber-400/70">
                    {w}
                  </li>
                ))}
                {warnings.length > 3 && (
                  <li className="text-xs text-amber-400/50">
                    + {warnings.length - 3} weitere
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setRows((r) => r.map((x) => ({ ...x, selected: true })))}
            className="text-xs px-3 py-1.5 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
          >
            Alle wählen
          </button>
          <button
            onClick={() => setRows((r) => r.map((x) => ({ ...x, selected: false })))}
            className="text-xs px-3 py-1.5 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
          >
            Abwählen
          </button>
          <button
            onClick={() =>
              setRows((r) => r.map((x) => ({ ...x, selected: !x.isDuplicate })))
            }
            className="text-xs px-3 py-1.5 bg-bg-card border border-bg-border rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
          >
            Nur Neue
          </button>
          <span className="ml-auto text-sm text-zinc-400">
            <span className="text-white font-semibold">{selectedCount}</span> von{" "}
            {rows.length} ausgewählt
          </span>
        </div>

        <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="w-10 px-3 py-3">
                    <button
                      onClick={() =>
                        setRows((r) =>
                          r.map((x) => ({ ...x, selected: !allSelected }))
                        )
                      }
                      className="text-zinc-500 hover:text-white transition"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {[
                    "Datum",
                    "Symbol",
                    "Dir.",
                    "Lot",
                    "Entry → Exit",
                    "P/L",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {rows.map((row, idx) => (
                  <tr
                    key={row.trade.ticket}
                    onClick={() =>
                      setRows((r) =>
                        r.map((x, i) =>
                          i === idx ? { ...x, selected: !x.selected } : x
                        )
                      )
                    }
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-bg-elevated/30",
                      !row.selected && "opacity-45"
                    )}
                  >
                    <td className="w-10 px-3 py-3">
                      {row.selected ? (
                        <CheckSquare className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-400 whitespace-nowrap text-xs">
                      {fmtDate(row.trade.entryTime)}
                    </td>
                    <td className="px-3 py-3 text-white font-medium whitespace-nowrap">
                      {row.trade.symbol}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          row.trade.direction === "long"
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        )}
                      >
                        {row.trade.direction === "long" ? "Long" : "Short"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {row.trade.volume}
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs whitespace-nowrap font-mono">
                      {fmtPrice(row.trade.entryPrice)}
                      {" → "}
                      {row.trade.exitPrice ? fmtPrice(row.trade.exitPrice) : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-sm font-semibold whitespace-nowrap",
                        row.trade.profitRaw > 0
                          ? "text-success"
                          : row.trade.profitRaw < 0
                          ? "text-danger"
                          : "text-zinc-400"
                      )}
                    >
                      {row.trade.exitTime
                        ? (row.trade.profitRaw >= 0 ? "+" : "") +
                          formatCurrency(
                            row.trade.profitRaw,
                            account?.currency ?? "USD"
                          )
                        : "offen"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {row.isDuplicate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-wider">
                          Duplikat
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success uppercase tracking-wider">
                          Neu
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 pb-4">
          <button
            onClick={resetToUpload}
            className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white border border-bg-border rounded-xl transition active:scale-95"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            disabled={selectedCount === 0 || importing}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl transition-all shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 text-sm",
              (selectedCount === 0 || importing) &&
                "opacity-50 cursor-not-allowed translate-y-0 hover:translate-y-0"
            )}
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird importiert...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                {"Importieren (" + selectedCount + ")"}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE 4: RESULT ───────────────────────────────────────────────────
  const success = result && result.errors.length === 0;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-bg-card border border-bg-border rounded-2xl p-8 md:p-12 text-center space-y-5">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto border",
            success
              ? "bg-success/15 border-success/30"
              : "bg-amber-500/15 border-amber-500/30"
          )}
        >
          {success ? (
            <Check className="w-8 h-8 text-success" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            {result?.imported ?? 0}{" "}
            {(result?.imported ?? 0) === 1 ? "Trade" : "Trades"} importiert
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            {success
              ? "Alle Trades wurden erfolgreich in "
              : "Teilweise importiert — einige fehlgeschlagen. Konto: "}
            <span className="text-white font-medium">{account?.name}</span>
            {success ? " gespeichert." : "."}
          </p>
          {(result?.errors ?? []).length > 0 && (
            <div className="mt-4 text-left bg-danger/10 border border-danger/20 rounded-xl p-4 space-y-1">
              {result!.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-danger/80">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={resetToUpload}
            className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white border border-bg-border rounded-xl transition active:scale-95"
          >
            Neue Datei
          </button>
          <Link
            href="/trades"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-bg font-semibold rounded-xl text-sm transition-all shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5"
          >
            Zu den Trades
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
