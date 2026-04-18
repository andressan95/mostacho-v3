import { Scan, Sparkles, Trophy } from "lucide-react";

import { GlassCard, PointsBadge } from "@/components/glass";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  points: number;
  loyalty_level: "bronze" | "silver" | "gold" | "diamond";
};

export default async function ClientHomePage() {
  const session = await requireSession();

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("points, loyalty_level")
    .eq("profile_id", session.profileId)
    .maybeSingle<ClientRow>();

  const points = client?.points ?? 0;
  const level = client?.loyalty_level ?? "bronze";

  return (
    <div className="flex flex-col gap-5 pt-2">
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
        <div className="flex items-baseline justify-between gap-3">
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
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GlassCard className="flex flex-col items-start gap-1.5">
          <Scan className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
          <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Escanear QR
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            Confirma tu visita y suma puntos.
          </span>
        </GlassCard>
        <GlassCard className="flex flex-col items-start gap-1.5">
          <Sparkles className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
          <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Promociones
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            Multiplicadores al subir de nivel.
          </span>
        </GlassCard>
        <GlassCard className="flex flex-col items-start gap-1.5">
          <Trophy className="h-5 w-5 text-[color:var(--color-purple-vivid)]" />
          <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            Sorteos
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            Participa y reclama premios reales.
          </span>
        </GlassCard>
      </div>
    </div>
  );
}
