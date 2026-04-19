import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Plus, QrCode } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type VisitSummary = {
  id: string;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  price_cents_total: number;
  points_awarded: number;
  created_at: string;
  confirmed_at: string | null;
};

export default async function BarberHomePage() {
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
          "id, status, price_cents_total, points_awarded, created_at, confirmed_at",
        )
        .eq("barber_id", barber.id)
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<VisitSummary[]>()
    : { data: [] as VisitSummary[] };

  const todayVisits =
    visits?.filter((visit) => {
      const created = new Date(visit.created_at);
      const now = new Date();

      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }) ?? [];

  const confirmedToday = todayVisits.filter((visit) => visit.status === "confirmed");
  const pendingToday = todayVisits.filter((visit) => visit.status === "pending");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Hoy
          </span>
          <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
            Jornada de {session.fullName}
          </h1>
        </div>
        <Link href="/barber/new-visit">
          <NeonButton>
            <Plus className="h-4 w-4" />
            Nueva visita
          </NeonButton>
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Visitas hoy
          </p>
          <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
            {todayVisits.length}
          </p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Confirmadas
          </p>
          <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
            {confirmedToday.length}
          </p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Pendientes
          </p>
          <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
            {pendingToday.length}
          </p>
        </GlassCard>
      </section>

      {visits?.length ? (
        <GlassCard variant="strong" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              Últimas visitas
            </h2>
            <Link
              href="/barber/visits"
              className="text-sm text-[color:var(--color-purple-vivid)]"
            >
              Ver todas
            </Link>
          </div>

          <div className="grid gap-3">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {formatCurrency(visit.price_cents_total)}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {formatDateTime(visit.confirmed_at ?? visit.created_at, {
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                    {visit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          icon={QrCode}
          title="Todavía no has generado visitas"
          description="Crea tu primera visita para mostrar un QR efímero al cliente."
        />
      )}

      <GlassCard className="flex items-center gap-3">
        <div className="rounded-full bg-[color:var(--color-purple-primary)]/15 p-3 text-[color:var(--color-purple-vivid)]">
          <Clock3 className="h-4 w-4" />
        </div>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Cada QR expira según la política del tenant y se valida una sola vez.
        </p>
      </GlassCard>
    </div>
  );
}
