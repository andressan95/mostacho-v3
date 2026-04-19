import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { PurpleBlob } from "@/components/glass";
import { BottomNav } from "@/components/BottomNav";
import { signOut } from "@/app/auth/actions";
import type { AppRole } from "@/lib/supabase/database.types";

type AppShellProps = {
  role: AppRole;
  fullName: string;
  tenantName?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const ROLE_LABEL: Record<AppRole, string> = {
  client: "Cliente",
  barber: "Barbero",
  admin: "Admin",
};

export function AppShell({
  role,
  fullName,
  tenantName,
  style,
  children,
}: AppShellProps) {
  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden"
      style={style}
    >
      <PurpleBlob position="top-right" size="md" intensity="soft" />
      <PurpleBlob position="bottom-left" size="lg" intensity="soft" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 pb-3 pt-6">
        <div className="flex flex-col">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-[color:var(--color-text-primary)]"
          >
            {tenantName ?? "Mostacho"}
          </Link>
          <span className="text-[11px] uppercase tracking-widest text-[color:var(--color-text-muted)]">
            {ROLE_LABEL[role]} · {fullName}
          </span>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-glass-border)] bg-[color:var(--color-glass-bg)] text-[color:var(--color-text-muted)] backdrop-blur-md transition-colors hover:text-[color:var(--color-text-primary)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </header>

      <main className="relative z-10 flex-1 px-5 pb-28 pt-2">{children}</main>

      <BottomNav role={role} />
    </div>
  );
}
