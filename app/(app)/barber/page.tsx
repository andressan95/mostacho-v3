import { redirect } from "next/navigation";

import { GlassCard } from "@/components/glass";
import { requireSession } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";

export default async function BarberHomePage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "barber") && !hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
        Hoy
      </h1>
      <GlassCard variant="strong">
        <span className="text-sm text-[color:var(--color-text-secondary)]">
          Panel de barbero en construcción. En Sprint 2 podrás crear visitas
          y generar QR aquí.
        </span>
      </GlassCard>
    </div>
  );
}
