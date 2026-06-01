import { createClient } from "@/lib/supabase/server";
import { fetchForexFactoryNews } from "@/lib/news/forexFactoryFetcher";
import type { NewsEvent } from "@/lib/news/forexFactoryFetcher";
import { NextResponse } from "next/server";

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 Stunde

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const from     = url.searchParams.get("from");
  const to       = url.searchParams.get("to");
  const currencies = url.searchParams.get("currencies")?.split(",").filter(Boolean) ?? [];
  const minImpact  = url.searchParams.get("minImpact") ?? "medium";

  // Letztes Fetch-Datum aus DB prüfen
  const { data: latest } = await supabase
    .from("economic_news")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastFetchedAt = latest?.fetched_at ? new Date(latest.fetched_at) : null;
  const needsRefresh = !lastFetchedAt ||
    (Date.now() - lastFetchedAt.getTime()) > CACHE_MAX_AGE_MS;

  let stale = false;

  if (needsRefresh) {
    try {
      const freshEvents = await fetchForexFactoryNews();
      if (freshEvents.length > 0) {
        const now = new Date().toISOString();
        await supabase
          .from("economic_news")
          .upsert(
            freshEvents.map((e) => ({ ...e, fetched_at: now })),
            { onConflict: "event_datetime,currency,event_name", ignoreDuplicates: false }
          );
        // Alte News bereinigen (>30 Tage)
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("economic_news").delete().lt("event_datetime", cutoff);
      } else {
        stale = true;
      }
    } catch {
      stale = true;
    }
  }

  let query = supabase
    .from("economic_news")
    .select("*")
    .order("event_datetime");

  if (from) query = query.gte("event_datetime", from);
  if (to)   query = query.lte("event_datetime", to);
  if (currencies.length > 0) query = query.in("currency", currencies);
  if (minImpact !== "low") {
    const impacts =
      minImpact === "high" ? ["high"] : ["medium", "high"];
    query = query.in("impact", impacts);
  }

  const { data: events } = await query;

  const { data: freshLatest } = await supabase
    .from("economic_news")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    events: events ?? [],
    lastFetched: freshLatest?.fetched_at ?? null,
    stale,
  });
}
