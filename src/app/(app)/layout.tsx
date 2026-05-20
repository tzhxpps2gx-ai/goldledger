import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { getUserPreferences } from "@/lib/getUserPreferences";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userPreferences = await getUserPreferences();

  return (
    <AppShell
      userEmail={user.email ?? ""}
      userId={user.id}
      userPreferences={userPreferences}
    >
      {children}
    </AppShell>
  );
}
