"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null;
  onChange?: (val: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const sz = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (!onChange) return;
              onChange(star === value ? null : star);
            }}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 active:scale-95 cursor-pointer",
              readOnly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sz,
                filled ? "fill-gold-400 text-gold-400" : "text-zinc-600",
                !readOnly && !filled && "hover:text-gold-400/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
