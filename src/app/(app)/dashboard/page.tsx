import { createClient } from "@/lib/supabase/server";
import { type Trade } from "@/lib/calculations";
import DashboardClient from "@/components/DashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

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
    <DashboardClient
      trades={(trades ?? []) as Trade[]}
      account={{
        name: account.name,
        broker: account.broker,
        currency: account.currency,
        starting_balance: Number(account.starting_balance),
        current_balance: Number(account.current_balance),
      }}
    />
  );
}
