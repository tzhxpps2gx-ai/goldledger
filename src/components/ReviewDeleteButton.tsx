"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteReviewAction } from "@/app/actions/reviews";

export default function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const { error } = await deleteReviewAction(reviewId);
    if (!error) {
      router.push("/reviews");
    } else {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (!showConfirm) {
    return (
      <button type="button" onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-bg-border text-zinc-500 hover:text-danger hover:border-danger/40 rounded-xl text-xs font-medium transition flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
        L&#246;schen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs text-zinc-500">Sicher?</span>
      <button type="button" onClick={() => setShowConfirm(false)} disabled={loading}
        className="px-3 py-1.5 border border-bg-border text-zinc-500 hover:text-white rounded-lg text-xs transition disabled:opacity-40">
        Abbrechen
      </button>
      <button type="button" onClick={handleDelete} disabled={loading}
        className="px-3 py-1.5 bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1">
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        Ja, l&#246;schen
      </button>
    </div>
  );
}
