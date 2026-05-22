import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewsListClient from "@/components/ReviewsListClient";
import type { Review } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("period_end", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Reviews
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Strukturierte Reflexion deiner Performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/reviews/new?type=monthly"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 rounded-xl text-xs font-medium transition"
          >
            Monatsreview
          </a>
          <a
            href="/reviews/new?type=weekly"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-bg font-semibold rounded-xl transition-all shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 text-xs"
          >
            Wochenreview
          </a>
        </div>
      </div>

      <ReviewsListClient reviews={(data ?? []) as Review[]} />
    </div>
  );
}
