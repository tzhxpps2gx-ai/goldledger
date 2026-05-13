import { createClient } from "@/lib/supabase/server";
import { type Trade } from "@/lib/calculations";
import { redirect } from "next/navigation";
import TradesListClient from "@/components/TradesListClient";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    redirect("/onboarding");
  }
  const account = accounts[0];

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("account_id", account.id)
    .order("entry_time", { ascending: false, nullsFirst: false });

  return (
    <TradesListClient
      trades={(trades ?? []) as Trade[]}
      currency={account.currency}
    />
  );
}
