import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { Notice } from "@/components/ui/Notice";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstValue, formatCurrency } from "@/lib/utils";

import { archiveServiceAction, saveServiceAction } from "./actions";

type ServiceRow = {
  id: string;
  name: string;
  duration_min: number;
  base_points: number;
  price_cents: number;
  active: boolean;
};

export default async function AdminServicesPage({
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
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_min, base_points, price_cents, active")
    .order("active", { ascending: false })
    .order("name")
    .returns<ServiceRow[]>();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Servicios
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Catálogo del tenant
        </h1>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <GlassCard variant="strong" className="space-y-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
          Crear nuevo servicio
        </h2>
        <form action={saveServiceAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input type="hidden" name="id" value="" />
          <label className="flex flex-col gap-1.5 xl:col-span-2">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              Nombre
            </span>
            <input
              name="name"
              required
              className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
            />
          </label>
          <Field name="durationMin" label="Minutos" type="number" defaultValue={30} />
          <Field name="basePoints" label="Puntos" type="number" defaultValue={20} />
          <Field name="priceCents" label="Precio (cents)" type="number" defaultValue={15000} />
          <label className="flex items-end gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3">
            <input
              name="active"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-[color:var(--color-purple-primary)]"
            />
            <span className="text-sm text-[color:var(--color-text-secondary)]">
              Activo
            </span>
          </label>
          <div className="md:col-span-2 xl:col-span-6">
            <NeonButton type="submit">Guardar servicio</NeonButton>
          </div>
        </form>
      </GlassCard>

      {services?.length ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <GlassCard key={service.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {service.name}
                  </h2>
                  <p className="text-sm text-[color:var(--color-text-muted)]">
                    {formatCurrency(service.price_cents)} · {service.base_points} pts base · {service.duration_min} min
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--color-purple-primary)]/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--color-purple-vivid)]">
                  {service.active ? "Activo" : "Archivado"}
                </span>
              </div>

              <div className="space-y-3">
                <form action={saveServiceAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <input type="hidden" name="id" value={service.id} />
                  <label className="flex flex-col gap-1.5 xl:col-span-2">
                    <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                      Nombre
                    </span>
                    <input
                      name="name"
                      required
                      defaultValue={service.name}
                      className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
                    />
                  </label>
                  <Field
                    name="durationMin"
                    label="Minutos"
                    type="number"
                    defaultValue={service.duration_min}
                  />
                  <Field
                    name="basePoints"
                    label="Puntos"
                    type="number"
                    defaultValue={service.base_points}
                  />
                  <Field
                    name="priceCents"
                    label="Precio (cents)"
                    type="number"
                    defaultValue={service.price_cents}
                  />
                  <label className="flex items-end gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3">
                    <input
                      name="active"
                      type="checkbox"
                      defaultChecked={service.active}
                      className="h-4 w-4 accent-[color:var(--color-purple-primary)]"
                    />
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      Activo
                    </span>
                  </label>
                  <div className="md:col-span-2 xl:col-span-6">
                    <NeonButton type="submit">Actualizar</NeonButton>
                  </div>
                </form>

                {service.active ? (
                  <form action={archiveServiceAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <NeonButton type="submit" variant="ghost">
                      Archivar servicio
                    </NeonButton>
                  </form>
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Settings2}
          title="No hay servicios todavía"
          description="Crea tu primer servicio para habilitar visitas y canjes."
        />
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: "number" | "text";
  defaultValue: string | number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
      />
    </label>
  );
}
