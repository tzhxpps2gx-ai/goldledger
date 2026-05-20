import { describe, it, expect } from "vitest";
import { parseMt5Content, parseNum, parseDate } from "../mt5Parser";

// ── Fixture-Hilfsfunktionen ───────────────────────────────────────────────
function makeHtml(rows: string, info = "Currency: USD"): string {
  return `<html><body><table border=1>
<tr><td colspan=15><b>Vantage Markets</b><br>${info}</td></tr>
<tr>
  <th>Ticket</th><th>Open Time</th><th>Type</th><th>Size</th><th>Item</th>
  <th>Price</th><th>S / L</th><th>T / P</th><th>Close Time</th><th>Price</th>
  <th>Commission</th><th>Taxes</th><th>Swap</th><th>Profit</th><th>Comment</th>
</tr>
${rows}
</table></body></html>`;
}

function tr(
  ticket: string, openTime: string, type: string, size: string, symbol: string,
  openPrice: string, sl: string, tp: string, closeTime: string, closePrice: string,
  comm: string, taxes: string, swap: string, profit: string, comment = ""
): string {
  return `<tr>
<td>${ticket}</td><td>${openTime}</td><td>${type}</td><td>${size}</td>
<td>${symbol}</td><td>${openPrice}</td><td>${sl}</td><td>${tp}</td>
<td>${closeTime}</td><td>${closePrice}</td><td>${comm}</td>
<td>${taxes}</td><td>${swap}</td><td>${profit}</td><td>${comment}</td>
</tr>`;
}

function balRow(ticket: string, time: string, profit: string, comment = "Deposit"): string {
  return `<tr>
<td>${ticket}</td><td>${time}</td><td>balance</td><td></td>
<td></td><td></td><td></td><td></td><td></td><td></td>
<td></td><td>0.00</td><td></td><td>${profit}</td><td>${comment}</td>
</tr>`;
}

// ── Fixture-Daten ─────────────────────────────────────────────────────────
const STD_ROWS = [
  tr("10000001","2024.03.15 09:30:00","buy","0.10","XAUUSDm",
     "2150.50","2130.00","2180.00","2024.03.15 14:20:00","2175.30","-0.80","0.00","-0.10","247.80"),
  tr("10000002","2024.03.16 10:00:00","buy","0.05","XAUUSD",
     "2160.00","2140.00","2200.00","2024.03.16 15:00:00","2145.00","-0.40","0.00","0.00","-75.00","SL hit"),
  tr("10000003","2024.03.17 09:15:00","buy","0.20","XAU/USD",
     "2155.00","2135.00","2185.00","2024.03.17 11:30:00","2170.00","-1.60","0.00","0.00","300.00"),
  tr("10000004","2024.03.18 09:00:00","sell","0.10","EURUSD",
     "1.0850","1.0900","1.0800","2024.03.18 13:00:00","1.0820","-0.70","0.00","0.00","30.00"),
  tr("10000005","2024.03.19 09:30:00","buy","0.10","GOLDm",
     "2165.00","2145.00","2195.00","2024.03.19 16:00:00","2180.00","-0.80","0.00","0.00","150.00"),
].join("\n");

const STANDARD_HTML = makeHtml(STD_ROWS);

const STANDARD_CSV = [
  "Ticket\tOpen Time\tType\tSize\tItem\tPrice\tS / L\tT / P\tClose Time\tPrice\tCommission\tTaxes\tSwap\tProfit\tComment",
  "10000001\t2024.03.15 09:30:00\tbuy\t0.10\tXAUUSDm\t2150.50\t2130.00\t2180.00\t2024.03.15 14:20:00\t2175.30\t-0.80\t0.00\t-0.10\t247.80\t",
  "10000002\t2024.03.16 10:00:00\tbuy\t0.05\tXAUUSD\t2160.00\t2140.00\t2200.00\t2024.03.16 15:00:00\t2145.00\t-0.40\t0.00\t0.00\t-75.00\tSL hit",
  "10000003\t2024.03.17 09:15:00\tbuy\t0.20\tXAU/USD\t2155.00\t2135.00\t2185.00\t2024.03.17 11:30:00\t2170.00\t-1.60\t0.00\t0.00\t300.00\t",
  "10000004\t2024.03.18 09:00:00\tsell\t0.10\tEURUSD\t1.0850\t1.0900\t1.0800\t2024.03.18 13:00:00\t1.0820\t-0.70\t0.00\t0.00\t30.00\t",
  "10000005\t2024.03.19 09:30:00\tbuy\t0.10\tGOLDm\t2165.00\t2145.00\t2195.00\t2024.03.19 16:00:00\t2180.00\t-0.80\t0.00\t0.00\t150.00\t",
].join("\n");

// ── 1. Standard MT5-HTML mit 5 Trades ─────────────────────────────────────
describe("1. Standard MT5-HTML mit 5 Trades", () => {
  it("parst genau 5 Trades", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades).toHaveLength(5);
  });
  it("XAUUSDm -> XAUUSD", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].symbol).toBe("XAUUSD");
  });
  it("XAU/USD -> XAUUSD", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[2].symbol).toBe("XAUUSD");
  });
  it("GOLDm -> XAUUSD", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[4].symbol).toBe("XAUUSD");
  });
  it("EURUSD bleibt unveraendert", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[3].symbol).toBe("EURUSD");
  });
  it("buy -> long", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].direction).toBe("long");
  });
  it("sell -> short", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[3].direction).toBe("short");
  });
  it("Datum YYYY.MM.DD korrekt nach ISO", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].entryTime).toBe("2024-03-15T09:30:00");
  });
  it("exitTime korrekt", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].exitTime).toBe("2024-03-15T14:20:00");
  });
  it("profitRaw korrekt", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].profitRaw).toBeCloseTo(247.80);
  });
  it("negativer Profit korrekt", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[1].profitRaw).toBeCloseTo(-75.00);
  });
  it("volume korrekt", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").trades[0].volume).toBeCloseTo(0.10);
  });
  it("Currency USD erkannt", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").accountCurrency).toBe("USD");
  });
  it("keine Warnings", () => {
    expect(parseMt5Content(STANDARD_HTML, "html").warnings).toHaveLength(0);
  });
});

// ── 2. CSV-Variante ───────────────────────────────────────────────────────
describe("2. CSV-Variante", () => {
  it("parst 5 Trades aus CSV", () => {
    expect(parseMt5Content(STANDARD_CSV, "csv").trades).toHaveLength(5);
  });
  it("CSV: XAUUSDm -> XAUUSD", () => {
    expect(parseMt5Content(STANDARD_CSV, "csv").trades[0].symbol).toBe("XAUUSD");
  });
  it("CSV: GOLDm -> XAUUSD", () => {
    expect(parseMt5Content(STANDARD_CSV, "csv").trades[4].symbol).toBe("XAUUSD");
  });
  it("CSV: Profit korrekt", () => {
    expect(parseMt5Content(STANDARD_CSV, "csv").trades[0].profitRaw).toBeCloseTo(247.80);
  });
  it("CSV: sell -> short", () => {
    expect(parseMt5Content(STANDARD_CSV, "csv").trades[3].direction).toBe("short");
  });
});

// ── 3. Balance/Deposit-Zeilen werden uebersprungen ───────────────────────
describe("3. Balance/Deposit-Zeilen", () => {
  const rows = [
    balRow("99000001","2024.01.01 00:00:00","5000.00","Deposit"),
    tr("10000001","2024.03.15 09:30:00","buy","0.10","XAUUSDm",
       "2150.50","2130.00","2180.00","2024.03.15 14:20:00","2175.30","-0.80","0.00","-0.10","247.80"),
    balRow("99000002","2024.03.01 00:00:00","1000.00","Deposit"),
    tr("10000004","2024.03.18 09:00:00","sell","0.10","EURUSD",
       "1.0850","1.0900","1.0800","2024.03.18 13:00:00","1.0820","-0.70","0.00","0.00","30.00"),
    balRow("99000003","2024.03.31 00:00:00","-500.00","Withdrawal"),
  ].join("\n");
  const html = makeHtml(rows);

  it("nur 2 echte Trades importiert (Balance uebersprungen)", () => {
    expect(parseMt5Content(html, "html").trades).toHaveLength(2);
  });
  it("keine Warnings bei Balance-Zeilen", () => {
    expect(parseMt5Content(html, "html").warnings).toHaveLength(0);
  });
  it("Trade-Tickets korrekt", () => {
    const { trades } = parseMt5Content(html, "html");
    expect(trades[0].ticket).toBe("10000001");
    expect(trades[1].ticket).toBe("10000004");
  });
});

// ── 4. Deutsche Lokalisierung ─────────────────────────────────────────────
describe("4. Deutsche Lokalisierung (DD.MM.YYYY, Komma-Dezimal)", () => {
  const deRows = [
    tr("10000001","15.03.2024 09:30:00","buy","0,10","XAUUSDm",
       "2150,50","2130,00","2180,00","15.03.2024 14:20:00","2175,30","-0,80","0,00","-0,10","247,80"),
    tr("10000002","16.03.2024 10:00:00","sell","0,05","EURUSD",
       "1,0850","1,0900","1,0800","16.03.2024 15:00:00","1,0820","-0,40","0,00","0,00","30,00"),
  ].join("\n");
  const html = makeHtml(deRows, "Währung: EUR");

  it("parst 2 Trades", () => {
    expect(parseMt5Content(html, "html").trades).toHaveLength(2);
  });
  it("Datum DD.MM.YYYY korrekt nach ISO", () => {
    expect(parseMt5Content(html, "html").trades[0].entryTime).toBe("2024-03-15T09:30:00");
  });
  it("Komma-Dezimal: Preis korrekt", () => {
    expect(parseMt5Content(html, "html").trades[0].entryPrice).toBeCloseTo(2150.50);
  });
  it("Komma-Dezimal: Profit korrekt", () => {
    expect(parseMt5Content(html, "html").trades[0].profitRaw).toBeCloseTo(247.80);
  });
  it("Komma-Dezimal: Volume korrekt", () => {
    expect(parseMt5Content(html, "html").trades[0].volume).toBeCloseTo(0.10);
  });
  it("Currency EUR erkannt", () => {
    expect(parseMt5Content(html, "html").accountCurrency).toBe("EUR");
  });
});

// ── 5. Englische Lokalisierung (YYYY.MM.DD, Punkt-Dezimal) ───────────────
describe("5. Englische Lokalisierung (Standard-MT5)", () => {
  it("ist bereits durch Fixture 1 abgedeckt", () => {
    const { trades } = parseMt5Content(STANDARD_HTML, "html");
    expect(trades[0].entryPrice).toBeCloseTo(2150.50);
    expect(trades[0].exitPrice).toBeCloseTo(2175.30);
  });
});

// ── 6. Offene Trades (kein Exit) ──────────────────────────────────────────
describe("6. Offene Trades", () => {
  const rows = [
    tr("10000001","2024.03.15 09:30:00","buy","0.10","XAUUSDm",
       "2150.50","2130.00","2180.00","","0","-0.80","0.00","0.00","0.00"),
    tr("10000002","2024.03.16 10:00:00","buy","0.05","XAUUSD",
       "2160.00","2140.00","2200.00","2024.03.16 15:00:00","2145.00","-0.40","0.00","0.00","-75.00"),
  ].join("\n");
  const html = makeHtml(rows);

  it("parst beide Trades", () => {
    expect(parseMt5Content(html, "html").trades).toHaveLength(2);
  });
  it("offener Trade hat exitTime null", () => {
    expect(parseMt5Content(html, "html").trades[0].exitTime).toBeNull();
  });
  it("offener Trade hat exitPrice null", () => {
    expect(parseMt5Content(html, "html").trades[0].exitPrice).toBeNull();
  });
  it("geschlossener Trade hat exitTime", () => {
    expect(parseMt5Content(html, "html").trades[1].exitTime).toBe("2024-03-16T15:00:00");
  });
});

// ── 7. Ungueltige Zeilen werden uebersprungen ─────────────────────────────
describe("7. Ungueltige Zeilen", () => {
  const rows = [
    // Kein Ticket
    `<tr><td></td><td>2024.03.15 09:30:00</td><td>buy</td><td>0.10</td>
<td>XAUUSD</td><td>2150.50</td><td></td><td></td>
<td>2024.03.15 14:20:00</td><td>2175.30</td><td>0</td>
<td>0</td><td>0</td><td>100.00</td><td></td></tr>`,
    // Unbekannter Type (kein buy/sell)
    `<tr><td>99</td><td>2024.03.15 09:30:00</td><td>unknown_op</td><td>0.10</td>
<td>XAUUSD</td><td>2150.50</td><td></td><td></td>
<td>2024.03.15 14:20:00</td><td>2175.30</td><td>0</td>
<td>0</td><td>0</td><td>100.00</td><td></td></tr>`,
    // Gueltiger Trade
    tr("10000001","2024.03.15 09:30:00","buy","0.10","XAUUSD",
       "2150.50","2130.00","2180.00","2024.03.15 14:20:00","2175.30","-0.80","0.00","0.00","247.80"),
    // Kaputtes Datum
    `<tr><td>10000099</td><td>KEIN_DATUM</td><td>buy</td><td>0.10</td>
<td>XAUUSD</td><td>2150.50</td><td></td><td></td>
<td></td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td></td></tr>`,
  ].join("\n");
  const html = makeHtml(rows);

  it("nur 1 gueltiger Trade importiert", () => {
    expect(parseMt5Content(html, "html").trades).toHaveLength(1);
  });
  it("Ticket des gueltigen Trades korrekt", () => {
    expect(parseMt5Content(html, "html").trades[0].ticket).toBe("10000001");
  });
});

// ── 8. Leere Datei ────────────────────────────────────────────────────────
describe("8. Leere Datei", () => {
  it("wirft Error bei leerem String", () => {
    expect(() => parseMt5Content("", "html")).toThrow();
  });
  it("wirft Error bei Whitespace-only", () => {
    expect(() => parseMt5Content("   \n  \t  ", "html")).toThrow();
  });
});

// ── 9. Kein Trade-Table ───────────────────────────────────────────────────
describe("9. Kein Trade-Table", () => {
  it("wirft Error bei HTML ohne Ticket/Type-Spalten", () => {
    const html = "<html><body><p>Kein MT5-Export hier.</p></body></html>";
    expect(() => parseMt5Content(html, "html")).toThrow("Keine Handels-Tabelle");
  });
  it("wirft Error bei HTML mit zufaelliger Tabelle", () => {
    const html = `<html><body>
<table><tr><th>Name</th><th>Wert</th></tr>
<tr><td>Foo</td><td>Bar</td></tr></table>
</body></html>`;
    expect(() => parseMt5Content(html, "html")).toThrow("Keine Handels-Tabelle");
  });
});

// ── Interne Hilfsfunktionen ───────────────────────────────────────────────
describe("parseNum", () => {
  it("Englisch: 1,234.56", () => expect(parseNum("1,234.56")).toBeCloseTo(1234.56));
  it("Deutsch: 1.234,56", () => expect(parseNum("1.234,56")).toBeCloseTo(1234.56));
  it("Dezimal-Komma: 2150,50", () => expect(parseNum("2150,50")).toBeCloseTo(2150.50));
  it("Einfache Zahl: 247.80", () => expect(parseNum("247.80")).toBeCloseTo(247.80));
  it("Negative Zahl: -0.80", () => expect(parseNum("-0.80")).toBeCloseTo(-0.80));
  it("Null-String -> 0", () => expect(parseNum("")).toBe(0));
  it("Strich -> 0", () => expect(parseNum("-")).toBe(0));
});

describe("parseDate", () => {
  it("MT5-Standard: YYYY.MM.DD", () =>
    expect(parseDate("2024.03.15 09:30:00")).toBe("2024-03-15T09:30:00"));
  it("Deutsch: DD.MM.YYYY", () =>
    expect(parseDate("15.03.2024 09:30:00")).toBe("2024-03-15T09:30:00"));
  it("ISO-aehnlich: YYYY-MM-DD", () =>
    expect(parseDate("2024-03-15 09:30:00")).toBe("2024-03-15T09:30:00"));
  it("Leerer String -> null", () =>
    expect(parseDate("")).toBeNull());
  it("Ungueltig -> null", () =>
    expect(parseDate("KEIN_DATUM")).toBeNull());
});
