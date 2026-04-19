import type { LucideIcon } from "lucide-react";

import { GlassCard } from "@/components/glass";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <GlassCard className="flex flex-col items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-purple-primary)]/15 text-[color:var(--color-purple-vivid)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {description}
        </p>
      </div>
    </GlassCard>
  );
}
