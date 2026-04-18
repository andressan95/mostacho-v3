import { cn } from "@/lib/utils";

type PurpleBlobProps = {
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  size?: "sm" | "md" | "lg";
  intensity?: "soft" | "strong";
  className?: string;
};

const positionMap: Record<NonNullable<PurpleBlobProps["position"]>, string> = {
  "top-left": "-top-20 -left-20",
  "top-right": "-top-20 -right-20",
  "bottom-left": "-bottom-20 -left-20",
  "bottom-right": "-bottom-20 -right-20",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const sizeMap: Record<NonNullable<PurpleBlobProps["size"]>, string> = {
  sm: "w-64 h-64",
  md: "w-96 h-96",
  lg: "w-[32rem] h-[32rem]",
};

export function PurpleBlob({
  position = "top-right",
  size = "md",
  intensity = "soft",
  className,
}: PurpleBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-[120px]",
        positionMap[position],
        sizeMap[size],
        intensity === "strong"
          ? "bg-purple-primary opacity-50"
          : "bg-purple-deep opacity-35",
        className,
      )}
      style={{
        background:
          intensity === "strong"
            ? "radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%)"
            : "radial-gradient(circle, rgba(91,33,182,0.45), transparent 70%)",
      }}
    />
  );
}
