import { cn } from "@/lib/utils";

export type LoyaltyLevel = "bronze" | "silver" | "gold" | "diamond";

type PointsBadgeProps = {
  level: LoyaltyLevel;
  points?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const levelConfig: Record<
  LoyaltyLevel,
  { label: string; gradient: string; text: string }
> = {
  bronze: {
    label: "Bronce",
    gradient: "from-amber-800 via-amber-600 to-amber-900",
    text: "text-amber-100",
  },
  silver: {
    label: "Plata",
    gradient: "from-slate-400 via-slate-300 to-slate-500",
    text: "text-slate-900",
  },
  gold: {
    label: "Oro",
    gradient: "from-yellow-500 via-yellow-300 to-amber-500",
    text: "text-yellow-950",
  },
  diamond: {
    label: "Diamante",
    gradient: "from-cyan-400 via-sky-300 to-purple-vivid",
    text: "text-slate-900",
  },
};

const sizeMap = {
  sm: "text-xs px-2.5 py-1 rounded-full",
  md: "text-sm px-3 py-1.5 rounded-full",
  lg: "text-base px-4 py-2 rounded-full",
};

export function PointsBadge({
  level,
  points,
  size = "md",
  className,
}: PointsBadgeProps) {
  const cfg = levelConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-wide",
        "bg-gradient-to-br shadow-[0_4px_14px_rgba(124,58,237,0.3)]",
        cfg.gradient,
        cfg.text,
        sizeMap[size],
        className,
      )}
      aria-label={`Nivel ${cfg.label}${points !== undefined ? `, ${points} puntos` : ""}`}
    >
      <span className="uppercase">{cfg.label}</span>
      {points !== undefined && (
        <span className="opacity-80">· {points.toLocaleString("es-CL")} pts</span>
      )}
    </span>
  );
}
