import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { RafflesRealtimeRefresh } from "@/components/raffles/RafflesRealtimeRefresh";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RaffleRow = {
  id: string;
  name: string;
  description: string | null;
  prize_name: string;
  starts_at: string;
  ends_at: string;
  status: "draft" | "open" | "running" | "completed";
  winner_client_id: string | null;
  drawn_at: string | null;
};

const STATUS_LABEL: Record<RaffleRow["status"], string> = {
  draft: "Borrador",
  open: "Abierto",
  running: "En sorteo",
  completed: "Completado",
};

export default async function RafflesPage() {
  const supabase = await createClient();
  const { data: raffles } = await supabase
    .from("raffles")
    .select(
      "id, name, description, prize_name, starts_at, ends_at, status, winner_client_id, drawn_at",
    )
    .order("ends_at", { ascending: false })
    .returns<RaffleRow[]>();

  const openCount = raffles?.filter((raffle) => raffle.status === "open").length ?? 0;
  const completedCount =
    raffles?.filter((raffle) => raffle.status === "completed").length ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <RafflesRealtimeRefresh />

      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Sorteos en vivo
        </span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
              Premios activos y ganadores recientes
            </h1>
            <p className="max-w-2xl text-sm text-[color:var(--color-text-muted)]">
              Los clientes elegibles participan automáticamente según su nivel
              de fidelidad. Aquí puedes seguir cada sorteo sin iniciar sesión.
            </p>
          </div>
          <Link href="/auth/sign-in">
            <NeonButton>Ver mi estado</NeonButton>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Abiertos
          </p>
          <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
            {openCount}
          </p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Completados
          </p>
          <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
            {completedCount}
          </p>
        </GlassCard>
      </section>

      {raffles?.length ? (
        <section className="grid gap-4">
          {raffles.map((raffle) => (
            <GlassCard key={raffle.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-[color:var(--color-purple-primary)]/15 p-2 text-[color:var(--color-purple-vivid)]">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-secondary)]">
                      {STATUS_LABEL[raffle.status]}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
                    {raffle.name}
                  </h2>
                  <p className="text-sm text-[color:var(--color-text-muted)]">
                    {raffle.description || "Sorteo configurado por el tenant."}
                  </p>
                </div>

                <Link href={`/raffles/${raffle.id}`}>
                  <NeonButton variant="ghost">
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                  </NeonButton>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Premio
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {raffle.prize_name}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Cierra
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {formatDateTime(raffle.ends_at)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Resultado
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {raffle.drawn_at
                      ? `Ganador sorteado ${formatDateTime(raffle.drawn_at)}`
                      : "Pendiente"}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Todavía no hay sorteos visibles"
          description="Cuando el admin abra o complete un sorteo, aparecerá aquí automáticamente."
        />
      )}
    </main>
  );
}
