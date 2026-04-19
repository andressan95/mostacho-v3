import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { Notice } from "@/components/ui/Notice";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstValue, formatDateTime } from "@/lib/utils";

import { createRaffleAction, drawRaffleAction } from "./actions";

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
  delivered_at: string | null;
  eligibility: { min_level?: string } | null;
};

export default async function AdminRafflesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const success = firstValue(params.success);
  const error = firstValue(params.error);

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  const supabase = await createClient();
  const { data: raffles } = await supabase
    .from("raffles")
    .select(
      "id, name, description, prize_name, starts_at, ends_at, status, winner_client_id, drawn_at, delivered_at, eligibility",
    )
    .order("created_at", { ascending: false })
    .returns<RaffleRow[]>();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Sorteos
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Crear y resolver sorteos
        </h1>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <GlassCard variant="strong" className="space-y-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
          Nuevo sorteo
        </h2>
        <form action={createRaffleAction} className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre" name="name" />
          <Field label="Premio" name="prize_name" />
          <Field label="Inicio" name="starts_at" type="datetime-local" />
          <Field label="Fin" name="ends_at" type="datetime-local" />
          <Field
            label="Nivel mínimo"
            name="min_level"
            type="select"
            options={["bronze", "silver", "gold", "diamond"]}
          />
          <Field
            label="Estado inicial"
            name="status"
            type="select"
            options={["open", "draft"]}
          />
          <Field label="Descripción" name="description" className="md:col-span-2" />
          <Field
            label="Descripción del premio"
            name="prize_description"
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <NeonButton type="submit">Crear sorteo</NeonButton>
          </div>
        </form>
      </GlassCard>

      {raffles?.length ? (
        <div className="grid gap-4">
          {raffles.map((raffle) => (
            <GlassCard key={raffle.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {raffle.name}
                  </h2>
                  <p className="text-sm text-[color:var(--color-text-muted)]">
                    {raffle.description || "Sin descripción adicional."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                    {raffle.status}
                  </span>
                  <Link href={`/raffles/${raffle.id}`}>
                    <NeonButton variant="ghost">Ver pública</NeonButton>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <InfoTile label="Premio" value={raffle.prize_name} />
                <InfoTile
                  label="Nivel"
                  value={(raffle.eligibility?.min_level ?? "silver").toUpperCase()}
                />
                <InfoTile label="Cierra" value={formatDateTime(raffle.ends_at)} />
                <InfoTile
                  label="Entrega"
                  value={
                    raffle.delivered_at
                      ? formatDateTime(raffle.delivered_at)
                      : "Pendiente"
                  }
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {!raffle.winner_client_id ? (
                  <form action={drawRaffleAction}>
                    <input type="hidden" name="raffleId" value={raffle.id} />
                    <NeonButton type="submit">
                      <Trophy className="h-4 w-4" />
                      Sortear ganador
                    </NeonButton>
                  </form>
                ) : (
                  <Notice tone="info" className="w-full sm:w-auto">
                    Ganador seleccionado {raffle.drawn_at ? formatDateTime(raffle.drawn_at) : "recientemente"}.
                  </Notice>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Todavía no hay sorteos"
          description="Crea el primero para empezar a anunciar premios y resultados."
        />
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  options,
  className,
}: {
  label: string;
  name: string;
  type?: "text" | "datetime-local" | "select";
  options?: string[];
  className?: string;
}) {
  return (
    <label className={className ? `flex flex-col gap-1.5 ${className}` : "flex flex-col gap-1.5"}>
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      {type === "select" ? (
        <select
          name={name}
          className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
          defaultValue={options?.[0]}
        >
          {options?.map((option) => (
            <option key={option} value={option} className="bg-[color:var(--color-bg-surface)]">
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
        />
      )}
    </label>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
        {value}
      </div>
    </div>
  );
}
