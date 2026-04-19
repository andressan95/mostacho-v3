import { redirect } from "next/navigation";
import { Clock3, QrCode, Scissors } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { QrDisplay } from "@/components/qr/QrDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstValue, formatCurrency, formatDateTime } from "@/lib/utils";

import { createVisitAction } from "./actions";

type ServiceRow = {
  id: string;
  name: string;
  duration_min: number;
  base_points: number;
  price_cents: number;
};

type VisitRow = {
  id: string;
  price_cents_total: number;
  created_at: string;
};

type TokenRow = {
  token: string;
  expires_at: string;
  used_at: string | null;
};

type CurrentVisitSnapshot = VisitRow & {
  qr_token: TokenRow | null;
};

export default async function BarberNewVisitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const created = firstValue(params.created);
  const success = firstValue(params.success);
  const error = firstValue(params.error);

  if (!hasRole(session.roles, "barber") && !hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_min, base_points, price_cents")
    .eq("active", true)
    .order("name")
    .returns<ServiceRow[]>();

  const { data: visitRow } = created
    ? await supabase
        .from("visits")
        .select("id, price_cents_total, created_at")
        .eq("id", created)
        .maybeSingle<VisitRow>()
    : { data: null as VisitRow | null };

  const { data: qrToken } = created
    ? await supabase
        .from("qr_tokens")
        .select("token, expires_at, used_at")
        .eq("kind", "visit")
        .eq("ref_id", created)
        .maybeSingle<TokenRow>()
    : { data: null as TokenRow | null };

  const activeVisit: CurrentVisitSnapshot | null = visitRow
    ? {
        ...visitRow,
        qr_token: qrToken,
      }
    : null;

  const currentToken = activeVisit?.qr_token;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Nueva visita
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Genera el QR del servicio
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Selecciona uno o más servicios, confirma el total y comparte el QR
          efímero con el cliente.
        </p>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <form action={createVisitAction} className="space-y-4">
          <GlassCard variant="strong" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                Paso 1. Servicios
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                Puedes dejar el cliente vacío para que lo vincule al escanear.
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                Client ID opcional
              </span>
              <input
                name="clientId"
                type="text"
                placeholder="uuid del cliente si quieres preasignarlo"
                className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)]"
              />
            </label>

            {services?.length ? (
              <div className="grid gap-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[auto_1fr_auto]"
                  >
                    <input
                      name="serviceIds"
                      value={service.id}
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[color:var(--color-purple-primary)]"
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                        {service.name}
                      </div>
                      <div className="text-xs text-[color:var(--color-text-muted)]">
                        {service.duration_min} min · {service.base_points} pts base
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 md:min-w-56">
                      <div className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-[color:var(--color-text-primary)]">
                        {formatCurrency(service.price_cents)}
                      </div>
                      <input
                        name={`qty:${service.id}`}
                        type="number"
                        min={1}
                        defaultValue={1}
                        className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none"
                      />
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Scissors}
                title="No hay servicios activos"
                description="Activa al menos un servicio desde el panel admin para poder crear visitas."
              />
            )}

            <NeonButton type="submit" fullWidth disabled={!services?.length}>
              Crear visita y generar QR
            </NeonButton>
          </GlassCard>
        </form>

        <div className="space-y-4">
          {currentToken ? (
            <QrDisplay
              value={currentToken.token}
              title="Paso 2. Escanea este QR"
              description="El cliente debe escanearlo antes de que expire."
            />
          ) : (
            <EmptyState
              icon={QrCode}
              title="Todavía no hay QR activo"
              description="Al crear una visita verás aquí el QR efímero listo para mostrar."
            />
          )}

          {activeVisit ? (
            <GlassCard className="space-y-3">
              <h3 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                Paso 3. Estado de la visita
              </h3>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Total
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {formatCurrency(activeVisit.price_cents_total)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Expira
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    {formatDateTime(currentToken?.expires_at, {
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                    Creada
                  </div>
                  <div className="mt-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[color:var(--color-purple-vivid)]" />
                      {formatDateTime(activeVisit.created_at, {
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
