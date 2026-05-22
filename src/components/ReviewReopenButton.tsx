"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, RotateCcw } from "lucide-react";

export default function ReviewReopenButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReopen() {
    setLoading(true);
    await supabase
      .from("reviews")
      .update({ status: "draft", submitted_at: null })
      .eq("id", reviewId);
    router.refresh();
    setLoading(false);
    setShowConfirm(false);
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-bg-border text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl text-xs font-medium transition flex-shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Wieder &#246;ffnen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs text-zinc-500">Sicher?</span>
      <button onClick={() => setShowConfirm(false)}
        className="px-3 py-1.5 border border-bg-border text-zinc-500 hover:text-white rounded-lg text-xs transition">
        Abbrechen
      </button>
      <button onClick={handleReopen} disabled={loading}
        className="px-3 py-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1">
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        Ja, &#246;ffnen
      </button>
    </div>
  );
}
