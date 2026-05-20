"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

const GOLD_COLORS = ["#D4AF37", "#FFD700", "#F4E4A6", "#B8860B", "#FFFFFF"];

export default function CelebrationConfetti({
  trigger,
  onComplete,
}: {
  trigger: boolean;
  onComplete: () => void;
}) {
  const [active, setActive] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!trigger || active) return;
    setSize({ w: window.innerWidth, h: window.innerHeight });
    setActive(true);
    const t = setTimeout(() => {
      setActive(false);
      onComplete();
    }, 4500);
    return () => clearTimeout(t);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <ReactConfetti
      width={size.w}
      height={size.h}
      numberOfPieces={200}
      recycle={false}
      colors={GOLD_COLORS}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
