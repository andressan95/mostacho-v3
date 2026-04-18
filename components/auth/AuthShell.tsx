import type { ReactNode } from "react";
import Link from "next/link";

import { GlassCard, PurpleBlob } from "@/components/glass";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <PurpleBlob position="top-left" size="lg" />
      <PurpleBlob position="bottom-right" size="md" intensity="soft" />

      <Link
        href="/"
        className="font-display text-2xl font-bold tracking-tight text-[color:var(--color-text-primary)]"
      >
        Mostacho
      </Link>

      <GlassCard variant="strong" className="mt-6 w-full max-w-md p-7">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-[color:var(--color-text-muted)]">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-6">{children}</div>
      </GlassCard>

      {footer ? (
        <div className="mt-5 text-center text-sm text-[color:var(--color-text-muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
