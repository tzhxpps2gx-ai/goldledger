import { createClient } from "@/lib/supabase/server";
import { type Trade } from "@/lib/calculations";
import { type Goal, type TradeLike } from "@/lib/goals";
import DashboardClient from "@/components/DashboardClient";
import { redirect } from "next/navigation";
import { archiveExpiredGoalsAction } from "@/app/actions/goals";
import { getUserPreferences } from "@/lib/getUserPreferences";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  await archiveExpiredGoalsAction();

  const [{ data: accounts }, userPreferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: true }),
    getUserPreferences(),
  ]);

  if (!accounts || accounts.length === 0) {
    redirect("/onboarding");
  }

  const account =
    accounts.find((a) => a.id === userPreferences.active_account_id) ??
    accounts[0];

  const [{ data: trades }, { data: goals }, { data: goalTrades }] =
    await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .eq("account_id", account.id)
        .order("entry_time", { ascending: false, nullsFirst: false }),
      supabase
        .from("goals")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("trades")
        .select("account_id, pnl_currency, status, exit_time")
        .eq("account_id", account.id),
    ]);

  return (
    <DashboardClient
      trades={(trades ?? []) as Trade[]}
      account={{
        name: account.name,
        account_type: account.account_type ?? "live",
        broker: account.broker,
        currency: account.currency,
        starting_balance: Number(account.starting_balance),
        current_balance: Number(account.current_balance),
        is_archived: account.is_archived ?? false,
      }}
      goals={(goals ?? []) as Goal[]}
      goalTrades={(goalTrades ?? []) as TradeLike[]}
      userPreferences={userPreferences}
    />
  );
}
