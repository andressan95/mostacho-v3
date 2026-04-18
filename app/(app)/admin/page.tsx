import { redirect } from "next/navigation";

import { GlassCard } from "@/components/glass";
import { requireSession } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";

export default async function AdminHomePage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
        Resumen
      </h1>
      <GlassCard variant="strong">
        <span className="text-sm text-[color:var(--color-text-secondary)]">
          Dashboard administrativo en construcción. Llegará en Sprint 5 con
          gestión completa de clientes, barberos, servicios y sorteos.
        </span>
      </GlassCard>
    </div>
  );
}
