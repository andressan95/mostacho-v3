import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

import { GlassCard } from "@/components/glass";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RaffleDetail = {
  id: string;
  name: string;
  description: string | null;
  prize_name: string;
  prize_description: string | null;
  starts_at: string;
  ends_at: string;
  status: "draft" | "open" | "running" | "completed";
  eligibility: { min_level?: string } | null;
  winner_client_id: string | null;
  drawn_at: string | null;
  delivered_at: string | null;
};

export default async function RaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select(
      "id, name, description, prize_name, prize_description, starts_at, ends_at, status, eligibility, winner_client_id, drawn_at, delivered_at",
    )
    .eq("id", id)
    .maybeSingle<RaffleDetail>();

  if (!raffle) notFound();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[color:var(--color-purple-primary)]/15 p-3 text-[color:var(--color-purple-vivid)]">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-secondary)]">
            {raffle.status}
          </span>
        </div>

        <h1 className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
          {raffle.name}
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {raffle.description || "Sorteo creado para premiar a los clientes más fieles del tenant."}
        </p>
      </header>

      <GlassCard variant="strong" className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Premio
          </p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--color-text-primary)]">
            {raffle.prize_name}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {raffle.prize_description || "El admin validará el canje con un QR de premio."}
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
              Elegibilidad
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
              Nivel mínimo: {(raffle.eligibility?.min_level ?? "silver").toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
              Ventana
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-text-primary)]">
              {formatDateTime(raffle.starts_at)} → {formatDateTime(raffle.ends_at)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Ganador
          </p>
          <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
            {raffle.winner_client_id ? "Asignado" : "Pendiente"}
          </p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Sorteado
          </p>
          <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
            {formatDateTime(raffle.drawn_at)}
          </p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Entregado
          </p>
          <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
            {formatDateTime(raffle.delivered_at)}
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
