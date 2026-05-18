import { NextResponse } from "next/server";

// TwelveData: kostenloses Tier, 800 Anfragen/Tag
// Symbol für XAUUSD bei TwelveData
const SYMBOL = "XAU/USD";
const INTERVAL = "5min";
const PADDING_MS = 2 * 60 * 60 * 1000; // ± 2 Stunden um den Trade

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entryTime = searchParams.get("entryTime");
  const exitTime = searchParams.get("exitTime");

  // API-Key bleibt serverseitig — niemals ans Frontend
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TWELVEDATA_API_KEY nicht konfiguriert" },
      { status: 503 }
    );
  }

  if (!entryTime) {
    return NextResponse.json(
      { error: "entryTime ist erforderlich" },
      { status: 400 }
    );
  }

  const entry = new Date(entryTime);
  const exit = exitTime ? new Date(exitTime) : entry;

  // Zeitfenster: Trade-Beginn minus 2h bis Trade-Ende plus 2h
  const startDate = new Date(entry.getTime() - PADDING_MS)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);
  const endDate = new Date(exit.getTime() + PADDING_MS)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const params = new URLSearchParams({
    symbol: SYMBOL,
    interval: INTERVAL,
    start_date: startDate,
    end_date: endDate,
    apikey: apiKey,
    format: "JSON",
    order: "ASC",
    timezone: "UTC",
  });

  const res = await fetch(
    "https://api.twelvedata.com/time_series?" + params.toString(),
    // 1 Stunde cachen — historische Kerzen ändern sich nicht
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "TwelveData-Anfrage fehlgeschlagen" },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data.status === "error") {
    return NextResponse.json({ error: data.message }, { status: 502 });
  }

  type RawCandle = {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
  };

  const values: RawCandle[] = data.values ?? [];

  // Unix-Timestamps in Sekunden für lightweight-charts
  const candles = values.map((v) => ({
    time: Math.floor(
      new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000
    ),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
  }));

  return NextResponse.json({ candles });
}
