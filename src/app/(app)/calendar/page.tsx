import { createClient } from "@/lib/supabase/server";
import { type Trade } from "@/lib/calculations";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    redirect("/onboarding");
  }
  const account = accounts[0];

  const now = new Date();
  const month = searchParams.month
    ? Number(searchParams.month) - 1
    : now.getMonth();
  const year = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("account_id", account.id)
    .eq("status", "closed")
    .gte("exit_time", firstDay.toISOString())
    .lte("exit_time", lastDay.toISOString());

  return (
    <CalendarClient
      trades={(trades ?? []) as Trade[]}
      currency={account.currency}
      startBalance={Number(account.starting_balance)}
      month={month}
      year={year}
    />
  );
}
