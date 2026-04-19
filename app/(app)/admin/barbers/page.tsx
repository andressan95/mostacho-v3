import { redirect } from "next/navigation";
import { Scissors } from "lucide-react";

import { GlassCard } from "@/components/glass";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type BarberRow = {
  id: string;
  profile_id: string;
  bio: string | null;
  active: boolean;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export default async function AdminBarbersPage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  const supabase = await createClient();
  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, profile_id, bio, active")
    .order("created_at", { ascending: false })
    .returns<BarberRow[]>();

  const profileIds = barbers?.map((barber) => barber.profile_id) ?? [];
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", profileIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Barberos
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Equipo operativo
        </h1>
      </div>

      {barbers?.length ? (
        <div className="grid gap-4">
          {barbers.map((barber) => {
            const profile = profilesById.get(barber.profile_id);

            return (
              <GlassCard key={barber.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {profile?.full_name || "Barbero sin nombre"}
                    </h2>
                    <p className="text-sm text-[color:var(--color-text-muted)]">
                      {profile?.email || "Sin email"} · {profile?.phone || "Sin teléfono"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                    {barber.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  {barber.bio || "Sin bio registrada todavía."}
                </p>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Scissors}
          title="Aún no hay barberos configurados"
          description="Cuando un perfil reciba el rol barber, aparecerá en este panel."
        />
      )}
    </div>
  );
}
