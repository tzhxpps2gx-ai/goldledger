import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/lib/getUserPreferences";
import NewsClient from "@/components/NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getUserPreferences();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Wirtschafts-News
          </h1>
          <p className="text-zinc-500 text-xs mt-1 italic">
            Powered by ForexFactory
          </p>
        </div>
      </div>
      <NewsClient
        initialCurrencies={prefs.news_currencies}
        initialMinImpact={prefs.news_min_impact}
      />
    </div>
  );
}
