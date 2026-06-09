"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Instrument = {
  label: string;
  symbol: string;
  contractSize: number;
  pricePrecision: number;
  placeholder: string;
};

const INSTRUMENTS: Instrument[] = [
  { label: "Gold (XAUUSD)",     symbol: "XAUUSD",  contractSize: 100,    pricePrecision: 2, placeholder: "2350.00" },
  { label: "EUR/USD",           symbol: "EURUSD",  contractSize: 100000, pricePrecision: 5, placeholder: "1.08500" },
  { label: "GBP/USD",          symbol: "GBPUSD",  contractSize: 100000, pricePrecision: 5, placeholder: "1.27000" },
  { label: "AUD/USD",          symbol: "AUDUSD",  contractSize: 100000, pricePrecision: 5, placeholder: "0.65000" },
  { label: "NZD/USD",          symbol: "NZDUSD",  contractSize: 100000, pricePrecision: 5, placeholder: "0.60000" },
  { label: "USD/CHF",          symbol: "USDCHF",  contractSize: 100000, pricePrecision: 5, placeholder: "0.90000" },
  { label: "Silber (XAGUSD)",  symbol: "XAGUSD",  contractSize: 5000,   pricePrecision: 3, placeholder: "27.500"  },
  { label: "Öl WTI (XTIUSD)", symbol: "XTIUSD",  contractSize: 1000,   pricePrecision: 2, placeholder: "78.50"   },
  { label: "Sonstige / Custom",symbol: "CUSTOM",  contractSize: 0,      pricePrecision: 5, placeholder: ""        },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD", "JPY"];

type Props = {
  autoBalance: number | null;
  autoCurrency: string | null;
};

export default function PositionRechner({ autoBalance, autoCurrency }: Props) {
  const [useAuto, setUseAuto]           = useState(autoBalance !== null);
  const [manualBalance, setManualBalance] = useState("");
  const [manualCurrency, setManualCurrency] = useState(autoCurrency ?? "EUR");
  const [riskPct, setRiskPct]           = useState(1);
  const [instrIdx, setInstrIdx]         = useState(0);
  const [entryStr, setEntryStr]         = useState("");
  const [stopStr, setStopStr]           = useState("");
  const [customSize, setCustomSize]     = useState("");

  const instr        = INSTRUMENTS[instrIdx];
  const isCustom     = instr.symbol === "CUSTOM";
  const contractSize = isCustom ? (parseFloat(customSize) || 0) : instr.contractSize;
  const accountCurrency = useAuto ? (autoCurrency ?? "EUR") : manualCurrency;
  const balance      = useAuto ? (autoBalance ?? 0) : (parseFloat(manualBalance) || 0);
  const riskAmount   = balance > 0 ? balance * (riskPct / 100) : null;

  const lotResult = useMemo(() => {
    if (balance <= 0 || contractSize <= 0) return null;
    const entry = parseFloat(entryStr);
    const stop  = parseFloat(stopStr);
    if (isNaN(entry) || isNaN(stop) || entry === stop) return null;

    const stopDist    = Math.abs(entry - stop);
    const rAmt        = balance * (riskPct / 100);
    const riskPerLot  = stopDist * contractSize;
    return { lots: rAmt / riskPerLot, stopDist };
  }, [balance, riskPct, entryStr, stopStr, contractSize]);

  function floorLots(l: number) {
    return Math.floor(l * 100) / 100;
  }

  function fmt(val: number, cur: string) {
    try {
      return new Intl.NumberFormat("de-DE", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(val);
    } catch {
      return val.toFixed(2) + " " + cur;
    }
  }

  const lotsFloored = lotResult?.lots != null ? floorLots(lotResult.lots) : null;

  return (
    <div className="max-w-xl mx-auto space-y-5">

      {/* ── Konto ── */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Konto</div>

        {autoBalance !== null && (
          <div className="flex gap-2">
            {(["Automatisch", "Manuell"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setUseAuto(i === 0)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-semibold border transition",
                  (i === 0 ? useAuto : !useAuto)
                    ? "bg-gold-500/10 border-gold-500/40 text-gold-400"
                    : "border-bg-border text-zinc-500 hover:border-zinc-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {useAuto && autoBalance !== null ? (
          <div className="flex items-center justify-between bg-bg-elevated rounded-xl px-4 py-3">
            <span className="text-xs text-zinc-500">Kontostand (aktives Konto)</span>
            <span className="text-sm font-bold text-white">{fmt(autoBalance, autoCurrency ?? "EUR")}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              value={manualBalance}
              onChange={(e) => setManualBalance(e.target.value)}
              placeholder="10000"
              className="flex-1 bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
            />
            <select
              value={manualCurrency}
              onChange={(e) => setManualCurrency(e.target.value)}
              className="bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Risiko ── */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Risiko</div>

        {/* Big risk display */}
        <div className="rounded-xl bg-gold-500/8 border border-gold-500/20 px-5 py-4 flex items-center justify-between gap-4">
          <span className="text-5xl font-black text-gold-400 leading-none tabular-nums">
            {riskPct.toFixed(1)}<span className="text-2xl font-bold ml-1 text-gold-400/70">%</span>
          </span>
          {riskAmount !== null ? (
            <span className="text-2xl font-bold text-white tabular-nums">
              {fmt(riskAmount, accountCurrency)}
            </span>
          ) : (
            <span className="text-lg text-zinc-600">Kontostand eingeben</span>
          )}
        </div>

        {/* Slider */}
        <div>
          <input
            type="range"
            min="0.1" max="30" step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value))}
            className="w-full accent-gold-500 h-2 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
            <span>0.1 %</span><span>30 %</span>
          </div>
        </div>
      </div>

      {/* ── Trade-Parameter ── */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-5 space-y-4">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Trade-Parameter</div>

        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Instrument</label>
          <select
            value={instrIdx}
            onChange={(e) => { setInstrIdx(parseInt(e.target.value)); setEntryStr(""); setStopStr(""); }}
            className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50"
          >
            {INSTRUMENTS.map((inst, i) => (
              <option key={inst.symbol} value={i}>{inst.label}</option>
            ))}
          </select>
        </div>

        {isCustom && (
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Kontraktgröße pro Lot</label>
            <input
              type="number"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="z.B. 100000 für Forex-Majors, 100 für Gold"
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Entry-Preis</label>
            <input
              type="number"
              step="any"
              value={entryStr}
              onChange={(e) => setEntryStr(e.target.value)}
              placeholder={instr.placeholder || "0.00"}
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Stop-Loss</label>
            <input
              type="number"
              step="any"
              value={stopStr}
              onChange={(e) => setStopStr(e.target.value)}
              placeholder={instr.placeholder || "0.00"}
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        {lotResult?.stopDist !== undefined && (
          <p className="text-[11px] text-zinc-500 text-center">
            Stop-Distanz:{" "}
            <span className="text-zinc-300 font-medium">
              {lotResult.stopDist.toFixed(instr.pricePrecision)}
            </span>
          </p>
        )}
      </div>

      {/* ── Ergebnis ── */}
      {lotResult !== null && (
        <div className="bg-bg-card border border-gold-500/20 rounded-2xl p-5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Ergebnis</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">Risikobetrag</div>
              <div className="text-2xl font-bold text-white">
                {riskAmount !== null ? fmt(riskAmount, accountCurrency) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">Lot-Größe</div>
              <div className="text-2xl font-bold text-gold-400">
                {lotsFloored !== null ? lotsFloored.toFixed(2) : "—"}
              </div>
            </div>
          </div>

          {lotsFloored !== null && lotsFloored > 0 && (
            <div className="mt-4 pt-4 border-t border-bg-border grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Exakter Wert</div>
                <div className="text-sm font-semibold text-zinc-300">
                  {lotResult.lots.toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Mini-Lots</div>
                <div className="text-sm font-semibold text-zinc-300">
                  {(lotsFloored * 10).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Mikro-Lots</div>
                <div className="text-sm font-semibold text-zinc-300">
                  {(lotsFloored * 100).toFixed(0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {lotResult === null && balance > 0 && (
        <p className="text-center py-4 text-zinc-600 text-sm">
          Entry und Stop eingeben um die Lot-Größe zu berechnen
        </p>
      )}
    </div>
  );
}
