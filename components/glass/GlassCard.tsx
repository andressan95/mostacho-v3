import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong";
};

export function GlassCard({
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "glass-panel-strong" : "glass-panel",
        "p-6",
        className,
      )}
      {...props}
    />
  );
}
