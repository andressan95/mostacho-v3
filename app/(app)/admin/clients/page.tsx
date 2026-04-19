import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { Notice } from "@/components/ui/Notice";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstValue } from "@/lib/utils";

import { adjustClientPointsAction } from "./actions";

type ClientRow = {
  id: string;
  profile_id: string;
  points: number;
  loyalty_level: "bronze" | "silver" | "gold" | "diamond";
  last_visit_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export default async function AdminClientsPage({
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
  const { data: clients } = await supabase
    .from("clients")
    .select("id, profile_id, points, loyalty_level, last_visit_at")
    .order("points", { ascending: false })
    .returns<ClientRow[]>();

  const profileIds = clients?.map((client) => client.profile_id) ?? [];
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", profileIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Clientes
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Fidelidad y puntos
        </h1>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {clients?.length ? (
        <div className="grid gap-4">
          {clients.map((client) => {
            const profile = profilesById.get(client.profile_id);

            return (
              <GlassCard key={client.id} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {profile?.full_name || "Cliente sin nombre"}
                    </h2>
                    <p className="text-sm text-[color:var(--color-text-muted)]">
                      {profile?.email || "Sin email"} · {profile?.phone || "Sin teléfono"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--color-purple-primary)]/15 px-4 py-3 text-right">
                    <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                      Nivel
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {client.loyalty_level.toUpperCase()}
                    </div>
                    <div className="text-sm text-[color:var(--color-text-secondary)]">
                      {client.points} pts
                    </div>
                  </div>
                </div>

                <form action={adjustClientPointsAction} className="grid gap-3 md:grid-cols-[1fr_120px_1fr_auto]">
                  <input type="hidden" name="clientId" value={client.id} />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                      Motivo
                    </span>
                    <input
                      name="reason"
                      type="text"
                      required
                      placeholder="Ej. Ajuste por cortesía"
                      className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                      Delta
                    </span>
                    <input
                      name="delta"
                      type="number"
                      required
                      placeholder="+50 / -20"
                      className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
                    />
                  </label>
                  <div className="flex items-end text-sm text-[color:var(--color-text-muted)]">
                    Última visita: {client.last_visit_at ? new Date(client.last_visit_at).toLocaleDateString("es-CL") : "—"}
                  </div>
                  <div className="flex items-end">
                    <NeonButton type="submit">Ajustar</NeonButton>
                  </div>
                </form>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Aún no hay clientes"
          description="Cuando se registren usuarios con rol client, aparecerán aquí."
        />
      )}
    </div>
  );
}
