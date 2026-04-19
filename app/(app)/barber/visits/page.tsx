import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";

import { GlassCard } from "@/components/glass";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type VisitRow = {
  id: string;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  price_cents_total: number;
  points_awarded: number;
  created_at: string;
  confirmed_at: string | null;
  client_id: string | null;
};

export default async function BarberVisitsPage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "barber") && !hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  const supabase = await createClient();
  const { data: barber } = await supabase
    .from("barbers")
    .select("id")
    .eq("profile_id", session.profileId)
    .maybeSingle<{ id: string }>();

  const { data: visits } = barber
    ? await supabase
        .from("visits")
        .select(
          "id, status, price_cents_total, points_awarded, created_at, confirmed_at, client_id",
        )
        .eq("barber_id", barber.id)
        .order("created_at", { ascending: false })
        .returns<VisitRow[]>()
    : { data: [] as VisitRow[] };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Visitas
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Registro del barbero
        </h1>
      </div>

      {visits?.length ? (
        <div className="grid gap-3">
          {visits.map((visit) => (
            <GlassCard key={visit.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {formatCurrency(visit.price_cents_total)}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {formatDateTime(visit.created_at, { timeStyle: "short" })}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                  {visit.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Cliente
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {visit.client_id ? "Vinculado" : "Pendiente"}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Puntos
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    +{visit.points_awarded}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Confirmada
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {formatDateTime(visit.confirmed_at, { timeStyle: "short" })}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock3}
          title="Sin visitas todavía"
          description="Cuando empieces a generar QRs, verás aquí el historial completo."
        />
      )}
    </div>
  );
}
