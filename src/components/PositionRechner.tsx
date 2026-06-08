"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Instrument = {
  label: string;
  symbol: string;
  contractSize: number;
  quoteCurrency: string;
  pricePrecision: number;
  placeholder: string;
};

const INSTRUMENTS: Instrument[] = [
  { label: "Gold (XAUUSD)",     symbol: "XAUUSD",  contractSize: 100,    quoteCurrency: "USD", pricePrecision: 2, placeholder: "2350.00" },
  { label: "EUR/USD",           symbol: "EURUSD",  contractSize: 100000, quoteCurrency: "USD", pricePrecision: 5, placeholder: "1.08500" },
  { label: "GBP/USD",           symbol: "GBPUSD",  contractSize: 100000, quoteCurrency: "USD", pricePrecision: 5, placeholder: "1.27000" },
  { label: "AUD/USD",           symbol: "AUDUSD",  contractSize: 100000, quoteCurrency: "USD", pricePrecision: 5, placeholder: "0.65000" },
  { label: "NZD/USD",           symbol: "NZDUSD",  contractSize: 100000, quoteCurrency: "USD", pricePrecision: 5, placeholder: "0.60000" },
  { label: "USD/JPY",           symbol: "USDJPY",  contractSize: 100000, quoteCurrency: "JPY", pricePrecision: 3, placeholder: "150.000" },
  { label: "EUR/JPY",           symbol: "EURJPY",  contractSize: 100000, quoteCurrency: "JPY", pricePrecision: 3, placeholder: "162.000" },
  { label: "GBP/JPY",           symbol: "GBPJPY",  contractSize: 100000, quoteCurrency: "JPY", pricePrecision: 3, placeholder: "190.000" },
  { label: "USD/CHF",           symbol: "USDCHF",  contractSize: 100000, quoteCurrency: "CHF", pricePrecision: 5, placeholder: "0.90000" },
  { label: "USD/CAD",           symbol: "USDCAD",  contractSize: 100000, quoteCurrency: "CAD", pricePrecision: 5, placeholder: "1.36000" },
  { label: "Silber (XAGUSD)",   symbol: "XAGUSD",  contractSize: 5000,   quoteCurrency: "USD", pricePrecision: 3, placeholder: "27.500"  },
  { label: "Öl WTI (XTIUSD)",   symbol: "XTIUSD",  contractSize: 1000,   quoteCurrency: "USD", pricePrecision: 2, placeholder: "78.50"   },
  { label: "Sonstige / Custom", symbol: "CUSTOM",  contractSize: 0,      quoteCurrency: "USD", pricePrecision: 5, placeholder: ""        },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD"];

type Props = {
  autoBalance: number | null;
  autoCurrency: string | null;
};

export default function PositionRechner({ autoBalance, autoCurrency }: Props) {
  const [useAuto, setUseAuto]         = useState(autoBalance !== null);
  const [manualBalance, setManualBalance] = useState("");
  const [manualCurrency, setManualCurrency] = useState(autoCurrency ?? "EUR");
  const [riskPct, setRiskPct]         = useState(1);
  const [instrIdx, setInstrIdx]       = useState(0);
  const [entryStr, setEntryStr]       = useState("");
  const [stopStr, setStopStr]         = useState("");
  const [rateStr, setRateStr]         = useState("");
  const [customSize, setCustomSize]   = useState("");
  const [customQuote, setCustomQuote] = useState("USD");

  const instr        = INSTRUMENTS[instrIdx];
  const isCustom     = instr.symbol === "CUSTOM";
  const contractSize = isCustom ? (parseFloat(customSize) || 0) : instr.contractSize;
  const quoteCurrency = isCustom ? customQuote : instr.quoteCurrency;
  const accountCurrency = useAuto ? (autoCurrency ?? "EUR") : manualCurrency;
  const needsRate    = quoteCurrency !== accountCurrency;

  const balance = useAuto ? (autoBalance ?? 0) : (parseFloat(manualBalance) || 0);
  const riskAmount = balance > 0 ? balance * (riskPct / 100) : null;

  const lotResult = useMemo(() => {
    if (balance <= 0 || contractSize <= 0) return null;
    const entry = parseFloat(entryStr);
    const stop  = parseFloat(stopStr);
    if (isNaN(entry) || isNaN(stop) || entry === stop) return null;

    const stopDist = Math.abs(entry - stop);
    const rAmt = balance * (riskPct / 100);
    const riskPerLotQuote = stopDist * contractSize;

    if (needsRate) {
      const rate = parseFloat(rateStr);
      if (isNaN(rate) || rate <= 0) return { lots: null as null, stopDist };
      return { lots: rAmt / (riskPerLotQuote * rate), stopDist };
    }

    return { lots: rAmt / riskPerLotQuote, stopDist };
  }, [balance, riskPct, entryStr, stopStr, contractSize, needsRate, rateStr]);

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

  function handleInstrChange(idx: number) {
    setInstrIdx(idx);
    setEntryStr("");
    setStopStr("");
    setRateStr("");
  }

  const showResult = lotResult !== null;
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

        {/* Risiko-Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">Risiko</span>
            <span className="text-xs font-bold text-gold-400">
              {riskPct.toFixed(1)} %
              {riskAmount !== null && " = " + fmt(riskAmount, accountCurrency)}
            </span>
          </div>
          <input
            type="range"
            min="0.1" max="5" step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value))}
            className="w-full accent-gold-500 h-1.5 rounded"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            <span>0.1 %</span><span>5 %</span>
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
            onChange={(e) => handleInstrChange(parseInt(e.target.value))}
            className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50"
          >
            {INSTRUMENTS.map((inst, i) => (
              <option key={inst.symbol} value={i}>{inst.label}</option>
            ))}
          </select>
        </div>

        {isCustom && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Kontraktgröße pro Lot</label>
              <input
                type="number"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="100000"
                className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Kurswährung</label>
              <select
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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

        {needsRate && (
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">
              {"1 " + quoteCurrency + " = ? " + accountCurrency}
            </label>
            <input
              type="number"
              step="any"
              value={rateStr}
              onChange={(e) => setRateStr(e.target.value)}
              placeholder={quoteCurrency === "JPY" ? "0.0062" : "0.926"}
              className="w-full bg-bg-elevated border border-bg-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500/50"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Aktuellen Kurs aus deiner Handelsplattform ablesen
            </p>
          </div>
        )}
      </div>

      {/* ── Ergebnis ── */}
      {showResult && (
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
              <div className={cn("text-2xl font-bold", lotsFloored !== null ? "text-gold-400" : "text-zinc-600")}>
                {lotsFloored !== null ? lotsFloored.toFixed(2) : "—"}
              </div>
            </div>
          </div>

          {lotsFloored !== null && lotsFloored > 0 && (
            <div className="mt-4 pt-4 border-t border-bg-border grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Exakter Wert</div>
                <div className="text-sm font-semibold text-zinc-300">
                  {lotResult!.lots!.toFixed(4)}
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

          {lotResult?.lots === null && needsRate && (
            <p className="text-xs text-zinc-500 mt-3">
              Wechselkurs eingeben um die Lot-Größe zu berechnen
            </p>
          )}
        </div>
      )}

      {!showResult && balance > 0 && (
        <p className="text-center py-4 text-zinc-600 text-sm">
          Entry und Stop eingeben um die Lot-Größe zu berechnen
        </p>
      )}
    </div>
  );
}
