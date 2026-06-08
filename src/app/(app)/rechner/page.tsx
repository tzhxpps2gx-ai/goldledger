import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/lib/getUserPreferences";
import PositionRechner from "@/components/PositionRechner";

export const dynamic = "force-dynamic";

export default async function RechnerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userPreferences = await getUserPreferences();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, currency, current_balance")
    .eq("is_archived", false);

  const account =
    accounts?.find((a) => a.id === userPreferences.active_account_id) ??
    accounts?.[0];

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Position Rechner
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Lot-Größe basierend auf Risiko und Entry / Stop berechnen
        </p>
      </div>
      <PositionRechner
        autoBalance={account ? Number(account.current_balance) : null}
        autoCurrency={account?.currency ?? null}
      />
    </div>
  );
}
