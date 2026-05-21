import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ImportClient from "@/components/ImportClient";
import { getUserPreferences } from "@/lib/getUserPreferences";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const supabase = createClient();

  const [{ data: accounts }, userPreferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, currency, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    getUserPreferences(),
  ]);

  if (!accounts || accounts.length === 0) redirect("/onboarding");

  const defaultAccountId =
    accounts.find((a) => a.id === userPreferences.active_account_id)?.id ??
    accounts[0].id;

  return (
    <ImportClient
      accounts={accounts as { id: string; name: string; currency: string }[]}
      defaultAccountId={defaultAccountId}
    />
  );
}
