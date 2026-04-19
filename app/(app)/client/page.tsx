import Link from "next/link";
import { Scan, Sparkles, Trophy } from "lucide-react";

import { GlassCard, NeonButton, PointsBadge } from "@/components/glass";
import { QrDisplay } from "@/components/qr/QrDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { getNextMilestone } from "@/lib/domains/loyalty/levels";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

type ClientRow = {
  id: string;
  points: number;
  loyalty_level: "bronze" | "silver" | "gold" | "diamond";
};

type VisitRow = {
  id: string;
  points_awarded: number;
  confirmed_at: string | null;
  status: "pending" | "confirmed" | "expired" | "cancelled";
};

type PrizeTokenRow = {
  token: string;
  expires_at: string;
};

export default async function ClientHomePage() {
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: client }, { count: openRaffles }, settings] = await Promise.all([
    supabase
      .from("clients")
      .select("id, points, loyalty_level")
      .eq("profile_id", session.profileId)
      .maybeSingle<ClientRow>(),
    supabase
      .from("raffles")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    getTenantSettingsForTenant(session.tenantId),
  ]);

  const visitsPromise = client
    ? supabase
        .from("visits")
        .select("id, points_awarded, confirmed_at, status")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<VisitRow[]>()
    : Promise.resolve({ data: [] as VisitRow[] });

  const prizeTokenPromise = client
    ? supabase
        .from("raffles")
        .select("id")
        .eq("winner_client_id", client.id)
        .is("delivered_at", null)
        .order("drawn_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>()
    : Promise.resolve({ data: null as { id: string } | null });

  const [{ data: visits }, { data: pendingPrizeRaffle }] = await Promise.all([
    visitsPromise,
    prizeTokenPromise,
  ]);

  const { data: prizeToken } = pendingPrizeRaffle
    ? await supabase
        .from("qr_tokens")
        .select("token, expires_at")
        .eq("kind", "raffle_prize")
        .eq("ref_id", pendingPrizeRaffle.id)
        .is("used_at", null)
        .maybeSingle<PrizeTokenRow>()
    : { data: null as PrizeTokenRow | null };

  const points = client?.points ?? 0;
  const level = client?.loyalty_level ?? "bronze";
  const nextMilestone = getNextMilestone(points, settings);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      <section className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-[color:var(--color-text-muted)]">
          Hola,
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          {session.fullName}
        </h1>
      </section>

      <GlassCard variant="strong" className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-widest text-[color:var(--color-text-muted)]">
          Tu fidelidad
        </span>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-display text-4xl font-bold text-[color:var(--color-text-primary)]">
              {points.toLocaleString("es-CL")}
            </span>
            <span className="text-xs text-[color:var(--color-text-muted)]">
              puntos acumulados
            </span>
          </div>
          <PointsBadge level={level} points={points} />
        </div>
        {nextMilestone ? (
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
            Te faltan{" "}
            <span className="font-semibold text-[color:var(--color-text-primary)]">
              {nextMilestone.remaining}
            </span>{" "}
            puntos para {nextMilestone.level.toUpperCase()}.
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
            Ya estás en el máximo nivel. Cada nueva visita sigue sumando para futuros sorteos.
          </div>
        )}
      </GlassCard>

      {prizeToken ? (
        <QrDisplay
          value={prizeToken.token}
          title="Ganaste un premio"
          description={`Muestra este QR al admin antes de ${formatDateTime(prizeToken.expires_at)}.`}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/client/scan">
          <GlassCard className="h-full flex flex-col items-start gap-1.5">
            <Scan className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
            <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
              Escanear QR
            </span>
            <span className="text-xs text-[color:var(--color-text-muted)]">
              Confirma tu próxima visita.
            </span>
          </GlassCard>
        </Link>
        <GlassCard className="flex flex-col items-start gap-1.5">
          <Sparkles className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
          <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Siguiente nivel
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {nextMilestone
              ? `${nextMilestone.remaining} pts hacia ${nextMilestone.level}.`
              : "Nivel máximo alcanzado."}
          </span>
        </GlassCard>
        <Link href="/raffles">
          <GlassCard className="h-full flex flex-col items-start gap-1.5">
            <Trophy className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
            <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
              Sorteos
            </span>
            <span className="text-xs text-[color:var(--color-text-muted)]">
              {openRaffles ?? 0} abiertos en este momento.
            </span>
          </GlassCard>
        </Link>
      </div>

      {visits?.length ? (
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              Últimas visitas
            </h2>
            <Link href="/client/history">
              <NeonButton variant="ghost">Ver historial</NeonButton>
            </Link>
          </div>
          <div className="grid gap-3">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {visit.points_awarded} puntos
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {formatDateTime(visit.confirmed_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                    {visit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          icon={Scan}
          title="Aún no tienes visitas confirmadas"
          description="Escanea tu primer QR desde la barbería para empezar a subir de nivel."
        />
      )}
    </div>
  );
}
