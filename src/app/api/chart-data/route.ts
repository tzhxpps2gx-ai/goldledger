import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const interval = searchParams.get("interval") ?? "5min";

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  if (!startDate) {
    return NextResponse.json({ error: "startDate required" }, { status: 400 });
  }

  const endDateStr =
    endDate ?? new Date().toISOString().replace("T", " ").substring(0, 19);

  const params = new URLSearchParams({
    symbol: "XAU/USD",
    interval,
    start_date: startDate,
    end_date: endDateStr,
    apikey: apiKey,
    format: "JSON",
    order: "ASC",
    timezone: "UTC",
  });

  const res = await fetch(
    `https://api.twelvedata.com/time_series?${params}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "TwelveData request failed" }, { status: 502 });
  }

  const data = await res.json();

  if (data.status === "error") {
    return NextResponse.json({ error: data.message }, { status: 502 });
  }

  const values: { datetime: string; open: string; high: string; low: string; close: string }[] =
    data.values ?? [];

  const candles = values.map((v) => ({
    time: Math.floor(new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
  }));

  return NextResponse.json({ candles });
}
