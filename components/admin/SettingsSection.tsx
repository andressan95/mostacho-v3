import { GlassCard } from "@/components/glass";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard variant="strong" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {description}
        </p>
      </div>
      {children}
    </GlassCard>
  );
}
