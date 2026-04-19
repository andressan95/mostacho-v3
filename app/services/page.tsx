import Link from "next/link";
import { Clock3, Coins, Scissors } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string;
  name: string;
  duration_min: number;
  base_points: number;
  price_cents: number;
  active: boolean;
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_min, base_points, price_cents, active")
    .eq("active", true)
    .order("base_points", { ascending: false })
    .returns<ServiceRow[]>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Servicios activos
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
              Qué puedes canjear en Mostacho
            </h1>
            <p className="max-w-2xl text-sm text-[color:var(--color-text-muted)]">
              Cada servicio suma puntos fijos. Mientras más visitas confirmas,
              mayor es tu multiplicador y más cerca quedas del próximo sorteo.
            </p>
          </div>
          <Link href="/auth/sign-in">
            <NeonButton>Entrar a mi cuenta</NeonButton>
          </Link>
        </div>
      </header>

      {services?.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <GlassCard key={service.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
                    {service.name}
                  </h2>
                  <p className="text-sm text-[color:var(--color-text-muted)]">
                    Confirma tu visita escaneando el QR del barbero.
                  </p>
                </div>
                <div className="rounded-full bg-[color:var(--color-purple-primary)]/15 p-3 text-[color:var(--color-purple-vivid)]">
                  <Scissors className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <div className="mb-2 text-[color:var(--color-purple-vivid)]">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="font-medium text-[color:var(--color-text-primary)]">
                    {service.duration_min} min
                  </div>
                  <div className="text-xs text-[color:var(--color-text-muted)]">
                    duración
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <div className="mb-2 text-[color:var(--color-purple-vivid)]">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div className="font-medium text-[color:var(--color-text-primary)]">
                    {service.base_points}
                  </div>
                  <div className="text-xs text-[color:var(--color-text-muted)]">
                    puntos base
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-3">
                  <div className="font-medium text-[color:var(--color-text-primary)]">
                    {formatCurrency(service.price_cents)}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    referencia
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Scissors}
          title="Todavía no hay servicios publicados"
          description="Cuando el admin active el catálogo del tenant, aparecerá aquí."
        />
      )}
    </main>
  );
}
