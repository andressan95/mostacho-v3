import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";

import { GlassCard } from "@/components/glass";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type VisitHistoryRow = {
  id: string;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  price_cents_total: number;
  points_awarded: number;
  created_at: string;
  confirmed_at: string | null;
};

export default async function ClientHistoryPage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "client")) {
    redirect("/barber");
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", session.profileId)
    .maybeSingle<{ id: string }>();

  const { data: visits } = client
    ? await supabase
        .from("visits")
        .select(
          "id, status, price_cents_total, points_awarded, created_at, confirmed_at",
        )
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .returns<VisitHistoryRow[]>()
    : { data: [] as VisitHistoryRow[] };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Historial
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Tus visitas confirmadas
        </h1>
      </div>

      {visits?.length ? (
        <div className="flex flex-col gap-3">
          {visits.map((visit) => (
            <GlassCard key={visit.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {formatCurrency(visit.price_cents_total)}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {formatDateTime(visit.confirmed_at ?? visit.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                  {visit.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Puntos
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--color-text-primary)]">
                    +{visit.points_awarded}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Estado
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {visit.status === "confirmed" ? "Confirmada" : visit.status}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock3}
          title="Todavía no tienes visitas registradas"
          description="Cuando canjees tu primer QR, tu historial aparecerá aquí."
        />
      )}
    </div>
  );
}
