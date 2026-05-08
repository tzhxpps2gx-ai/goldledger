import { cn } from "@/lib/utils";

/**
 * 5 Logo-Varianten für GoldLedger.
 * Aktuell aktiv: variant 3 (Diagonal Chart mit Goldpunkt)
 *
 * So wechselst du das Logo: ändere ACTIVE_VARIANT auf 1, 2, 3, 4 oder 5.
 *
 * 1 = Monogramm "GL" — minimalistisch, zwei verschränkte Buchstaben
 * 2 = Goldbarren-Stack — drei gestapelte Barren von der Seite
 * 3 = Hexagon mit "G" — geometrisch, modern
 * 4 = Diagonal-Chart mit Goldpunkt — abstrakt, Trader-feeling
 * 5 = Aurum-Symbol — alchemistisch (Kreis mit Punkt), premium
 */
const ACTIVE_VARIANT: 1 | 2 | 3 | 4 | 5 = 2;

export type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<LogoSize, string> = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-12 h-12",
  xl: "w-14 h-14",
};

export default function Logo({
  size = "md",
  className,
  withGlow = true,
}: {
  size?: LogoSize;
  className?: string;
  withGlow?: boolean;
}) {
  const dimensions = SIZES[size];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 transition-all",
        withGlow && "shadow-lg shadow-gold-500/30",
        dimensions,
        className
      )}
    >
      {ACTIVE_VARIANT === 1 && <Variant1 />}
      {ACTIVE_VARIANT === 2 && <Variant2 />}
      {ACTIVE_VARIANT === 3 && <Variant3 />}
      {ACTIVE_VARIANT === 4 && <Variant4 />}
      {ACTIVE_VARIANT === 5 && <Variant5 />}
    </div>
  );
}

/* ============= VARIANT 1: Monogramm "GL" ============= */
function Variant1() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[60%] h-[60%]"
    >
      <path
        d="M14 8C10.5 8 8 10.5 8 14V18C8 21.5 10.5 24 14 24H17V18H14"
        stroke="#0A0A0B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 8V24H26"
        stroke="#0A0A0B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============= VARIANT 2: Goldbarren-Stack ============= */
function Variant2() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[65%] h-[65%]"
    >
      {/* Unterster Barren */}
      <path
        d="M5 22L9 19H23L27 22V25H5V22Z"
        fill="#0A0A0B"
        fillOpacity="0.9"
      />
      {/* Mittlerer Barren */}
      <path
        d="M7 17L11 14H21L25 17V20H7V17Z"
        fill="#0A0A0B"
        fillOpacity="0.95"
      />
      {/* Oberster Barren */}
      <path
        d="M9 12L13 9H19L23 12V15H9V12Z"
        fill="#0A0A0B"
      />
    </svg>
  );
}

/* ============= VARIANT 3: Hexagon mit "G" ============= */
function Variant3() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[70%] h-[70%]"
    >
      <path
        d="M16 4L26 9.5V22.5L16 28L6 22.5V9.5L16 4Z"
        stroke="#0A0A0B"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M19 13C18.5 12 17.5 11.5 16 11.5C13.8 11.5 12 13.3 12 16C12 18.7 13.8 20.5 16 20.5C18 20.5 19.5 19 19.5 17H16"
        stroke="#0A0A0B"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============= VARIANT 4: Diagonal Chart ============= */
function Variant4() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[70%] h-[70%]"
    >
      <path
        d="M6 22L12 16L17 19L26 9"
        stroke="#0A0A0B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="9" r="2.5" fill="#0A0A0B" />
      <circle cx="6" cy="22" r="1.5" fill="#0A0A0B" fillOpacity="0.6" />
    </svg>
  );
}

/* ============= VARIANT 5: Aurum-Symbol ============= */
function Variant5() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[70%] h-[70%]"
    >
      <circle
        cx="16"
        cy="16"
        r="10"
        stroke="#0A0A0B"
        strokeWidth="2.2"
        fill="none"
      />
      <circle cx="16" cy="16" r="2.5" fill="#0A0A0B" />
    </svg>
  );
}
