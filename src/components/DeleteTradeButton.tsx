"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteTradeButton({
  tradeId,
  pnl,
  accountId,
  accountBalance,
}: {
  tradeId: string;
  pnl: number | null;
  accountId: string;
  accountBalance: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Trade wirklich löschen? Das kann nicht rückgängig gemacht werden.")) return;
    setLoading(true);

    await supabase.from("trades").delete().eq("id", tradeId);

    if (pnl !== null && pnl !== 0) {
      await supabase
        .from("accounts")
        .update({ current_balance: accountBalance - pnl })
        .eq("id", accountId);
    }

    router.push("/trades");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/30 hover:bg-danger/20 text-danger text-xs font-medium rounded-lg transition disabled:opacity-50"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Löschen
    </button>
  );
}
