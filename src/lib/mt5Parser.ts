export type ParsedTrade = {
  ticket: string;
  symbol: string;
  direction: "long" | "short";
  volume: number;
  entryTime: string;
  entryPrice: number;
  exitTime: string | null;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  commission: number;
  swap: number;
  profitRaw: number;
  comment: string;
};

export type ParseResult = {
  trades: ParsedTrade[];
  warnings: string[];
  accountCurrency: string | null;
  brokerName: string | null;
};

type ColMap = Partial<
  Record<
    | "ticket"
    | "openTime"
    | "type"
    | "volume"
    | "symbol"
    | "openPrice"
    | "sl"
    | "tp"
    | "closeTime"
    | "closePrice"
    | "commission"
    | "swap"
    | "profit"
    | "comment",
    number
  >
>;

// ── Symbol-Normalisierung ─────────────────────────────────────────────────
const XAU_RE = /^(XAU|GOLD)/i;

function normalizeSymbol(raw: string): string {
  const s = raw.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (XAU_RE.test(s)) return "XAUUSD";
  return raw.trim().toUpperCase();
}

// ── Zahlen-Parsing (1.234,56 und 1,234.56) ───────────────────────────────
export function parseNum(s: string): number {
  const t = s.trim().replace(/\s/g, "");
  if (!t || t === "-") return 0;
  const dots = (t.match(/\./g) ?? []).length;
  const commas = (t.match(/,/g) ?? []).length;
  if (dots > 0 && commas > 0) {
    // Beide vorhanden: letztes Trennzeichen ist Dezimal-Separator
    return t.lastIndexOf(".") > t.lastIndexOf(",")
      ? parseFloat(t.replace(/,/g, ""))                    // Englisch: 1,234.56
      : parseFloat(t.replace(/\./g, "").replace(",", ".")); // Deutsch: 1.234,56
  }
  if (commas === 1 && dots === 0) {
    const after = t.split(",")[1] ?? "";
    return after.length <= 3
      ? parseFloat(t.replace(",", "."))  // Dezimal-Komma: 1,56 oder 2150,50
      : parseFloat(t.replace(",", ""));  // Tausender-Komma
  }
  if (dots > 1) return parseFloat(t.replace(/\./g, "")); // mehrere Punkte = Tausender
  return parseFloat(t) || 0;
}

// ── Datum-Parsing ──────────────────────────────────────────────────────────
export function parseDate(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  let m: RegExpMatchArray | null;
  // YYYY.MM.DD HH:MM:SS  (MT5-Standard)
  m = t.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  // DD.MM.YYYY HH:MM:SS  (Deutsch)
  m = t.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}`;
  // YYYY-MM-DD HH:MM:SS  (ISO-ähnlich)
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  return null;
}

// ── Überspringen-Typen ─────────────────────────────────────────────────────
const SKIP_TYPES = new Set([
  "balance", "deposit", "withdrawal", "credit",
  "correction", "bonus", "rebate", "transfer",
]);

// ── Spalten-Erkennung ──────────────────────────────────────────────────────
function detectCols(headers: string[]): ColMap {
  const cols: ColMap = {};
  let priceCount = 0;
  let timeCount = 0;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/\s+/g, " ").trim();
    if (["ticket", "order", "deal", "#"].includes(h)) {
      cols.ticket ??= i;
    } else if (["open time", "entry time"].includes(h)) {
      cols.openTime = i;
    } else if (["close time", "exit time"].includes(h)) {
      cols.closeTime = i;
    } else if (h === "time") {
      if (timeCount === 0) cols.openTime ??= i;
      else cols.closeTime ??= i;
      timeCount++;
    } else if (["type", "action", "direction"].includes(h)) {
      cols.type ??= i;
    } else if (["size", "volume", "lots", "qty"].includes(h)) {
      cols.volume ??= i;
    } else if (["item", "symbol", "pair", "instrument", "asset"].includes(h)) {
      cols.symbol ??= i;
    } else if (["open price", "entry price"].includes(h)) {
      cols.openPrice = i;
    } else if (["close price", "exit price"].includes(h)) {
      cols.closePrice = i;
    } else if (h === "price") {
      if (priceCount === 0) cols.openPrice ??= i;
      else cols.closePrice ??= i;
      priceCount++;
    } else if (["s / l", "s/l", "stop loss", "sl", "stoploss"].includes(h)) {
      cols.sl ??= i;
    } else if (["t / p", "t/p", "take profit", "tp", "takeprofit"].includes(h)) {
      cols.tp ??= i;
    } else if (["commission", "comm", "fee"].includes(h)) {
      cols.commission ??= i;
    } else if (["swap", "rollover"].includes(h)) {
      cols.swap ??= i;
    } else if (["profit", "p/l", "pnl", "net profit"].includes(h)) {
      cols.profit ??= i;
    } else if (["comment", "comments", "remark"].includes(h)) {
      cols.comment ??= i;
    }
  }
  return cols;
}

// ── Zeile → ParsedTrade ───────────────────────────────────────────────────
function rowToTrade(
  cells: string[],
  cols: ColMap,
): ParsedTrade | null {
  const get = (k: keyof ColMap) =>
    cols[k] !== undefined ? (cells[cols[k]!]?.trim() ?? "") : "";

  const ticket = get("ticket");
  const typeRaw = get("type");
  if (!ticket) return null;
  if (SKIP_TYPES.has(typeRaw.toLowerCase().trim())) return null;

  const direction: "long" | "short" | null = typeRaw.toLowerCase().includes("buy")
    ? "long"
    : typeRaw.toLowerCase().includes("sell")
    ? "short"
    : null;
  if (!direction) return null;

  const entryTime = parseDate(get("openTime"));
  if (!entryTime) return null;

  const exitTimeRaw = get("closeTime");
  const exitTime = exitTimeRaw ? parseDate(exitTimeRaw) : null;

  const closePriceRaw = get("closePrice");
  const closePriceNum = closePriceRaw ? parseNum(closePriceRaw) : 0;

  const slRaw = parseNum(get("sl"));
  const tpRaw = parseNum(get("tp"));

  return {
    ticket,
    symbol: get("symbol") ? normalizeSymbol(get("symbol")) : "UNKNOWN",
    direction,
    volume: parseNum(get("volume")),
    entryTime,
    entryPrice: parseNum(get("openPrice")),
    exitTime,
    exitPrice: closePriceNum !== 0 ? closePriceNum : null,
    stopLoss: slRaw !== 0 ? slRaw : null,
    takeProfit: tpRaw !== 0 ? tpRaw : null,
    commission: parseNum(get("commission")),
    swap: parseNum(get("swap")),
    profitRaw: parseNum(get("profit")),
    comment: get("comment"),
  };
}

// ── HTML-Parser ────────────────────────────────────────────────────────────
function parseHtml(html: string): ParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  let accountCurrency: string | null = null;
  let brokerName: string | null = null;

  const firstCell = doc.querySelector("td");
  if (firstCell) {
    const text = firstCell.textContent ?? "";
    const currMatch = text.match(/(?:Currency|W[äa]hrung):\s*([A-Z]{3})/i);
    if (currMatch) accountCurrency = currMatch[1].toUpperCase();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines[0]) {
      brokerName = lines[0].replace(/MetaTrader\s*[45]\s*[-–]\s*/i, "").trim();
    }
  }

  const tables = Array.from(doc.querySelectorAll("table"));
  let cols: ColMap = {};
  let dataRows: Element[] = [];

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr"));
    const hIdx = rows.findIndex((row) => {
      const texts = Array.from(row.querySelectorAll("th, td")).map(
        (c) => c.textContent?.trim().toLowerCase() ?? ""
      );
      return (
        (texts.includes("ticket") || texts.includes("order") || texts.includes("deal")) &&
        (texts.includes("type") || texts.includes("action"))
      );
    });
    if (hIdx !== -1) {
      const headerCells = Array.from(rows[hIdx].querySelectorAll("th, td")).map(
        (c) => c.textContent?.trim() ?? ""
      );
      cols = detectCols(headerCells);
      dataRows = rows.slice(hIdx + 1);
      break;
    }
  }

  if (cols.ticket === undefined || cols.type === undefined) {
    throw new Error("Keine Handels-Tabelle in der Datei gefunden.");
  }

  const trades: ParsedTrade[] = [];
  const warnings: string[] = [];

  dataRows.forEach((row, idx) => {
    const firstTd = row.querySelector("td");
    if (firstTd?.getAttribute("colspan")) return; // Summen-Zeile überspringen

    const cells = Array.from(row.querySelectorAll("td")).map(
      (c) => c.textContent?.trim() ?? ""
    );
    if (cells.length < 3) return;

    try {
      const trade = rowToTrade(cells, cols);
      if (trade) trades.push(trade);
    } catch (e) {
      warnings.push(`Zeile ${idx + 1} übersprungen: ${String(e)}`);
    }
  });

  return { trades, warnings, accountCurrency, brokerName };
}

// ── CSV-Parser ─────────────────────────────────────────────────────────────
function parseCsv(csv: string): ParseResult {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV enthält keine Daten.");

  const sample = lines[0];
  const delimiter =
    (sample.match(/\t/g) ?? []).length >= (sample.match(/;/g) ?? []).length
      ? "\t"
      : ";";

  const headerCells = lines[0]
    .split(delimiter)
    .map((c) => c.trim().replace(/^"|"$/g, ""));
  const cols = detectCols(headerCells);

  if (cols.ticket === undefined || cols.type === undefined) {
    throw new Error("Keine Handels-Tabelle in der CSV gefunden.");
  }

  const trades: ParsedTrade[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]
      .split(delimiter)
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cells.length < 3) continue;
    try {
      const trade = rowToTrade(cells, cols);
      if (trade) trades.push(trade);
    } catch (e) {
      warnings.push(`Zeile ${i + 1} übersprungen: ${String(e)}`);
    }
  }

  return { trades, warnings, accountCurrency: null, brokerName: null };
}

// ── Öffentliche API ────────────────────────────────────────────────────────
export function parseMt5Content(content: string, ext: string): ParseResult {
  if (!content.trim()) throw new Error("Die Datei ist leer.");
  if (ext === "csv") return parseCsv(content);
  return parseHtml(content);
}

export async function parseMt5File(file: File): Promise<ParseResult> {
  if (!file.size) throw new Error("Die Datei ist leer.");
  const content = await file.text();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return parseMt5Content(content, ext);
}
