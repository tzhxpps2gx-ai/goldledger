import { createClient } from "@/lib/supabase/server";
import { fetchForexFactoryNews } from "@/lib/news/forexFactoryFetcher";
import { NextResponse } from "next/server";

const CACHE_MAX_AGE_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const from       = url.searchParams.get("from");
  const to         = url.searchParams.get("to");
  const currencies = url.searchParams.get("currencies")?.split(",").filter(Boolean) ?? [];
  const minImpact  = url.searchParams.get("minImpact") ?? "medium";
  const debug      = url.searchParams.get("debug") === "1";

  const { data: latest } = await supabase
    .from("economic_news")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastFetchedAt = latest?.fetched_at ? new Date(latest.fetched_at) : null;
  const needsRefresh  = !lastFetchedAt || (Date.now() - lastFetchedAt.getTime()) > CACHE_MAX_AGE_MS;

  let stale      = false;
  let fetchError = "";
  let upsertError = "";
  let fetchedCount = 0;

  if (needsRefresh) {
    try {
      const freshEvents = await fetchForexFactoryNews();
      fetchedCount = freshEvents.length;

      if (freshEvents.length > 0) {
        const now = new Date().toISOString();
        const { error: uErr } = await supabase
          .from("economic_news")
          .upsert(
            freshEvents.map((e) => ({ ...e, fetched_at: now })),
            { onConflict: "event_datetime,currency,event_name", ignoreDuplicates: false }
          );
        if (uErr) {
          upsertError = uErr.message;
          stale = true;
        } else {
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("economic_news").delete().lt("event_datetime", cutoff);
        }
      } else {
        stale = true;
        fetchError = "ForexFactory returned 0 events";
      }
    } catch (err: any) {
      stale      = true;
      fetchError = String(err?.message ?? err);
    }
  }

  let query = supabase.from("economic_news").select("*").order("event_datetime");
  if (from) query = query.gte("event_datetime", from + "T00:00:00.000Z");
  if (to)   query = query.lte("event_datetime", to   + "T23:59:59.999Z");
  if (currencies.length > 0) query = query.in("currency", currencies);
  if (minImpact !== "low") {
    query = query.in("impact", minImpact === "high" ? ["high"] : ["medium", "high"]);
  }

  const { data: events, error: queryError } = await query;

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
    ...(debug && {
      _debug: {
        needsRefresh,
        fetchedCount,
        fetchError,
        upsertError,
        queryError: queryError?.message ?? null,
        totalInDb: (events ?? []).length,
      },
    }),
  });
}
