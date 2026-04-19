import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminAntifraudSettingsPage({
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

  const settings = await getTenantSettingsForTenant(session.tenantId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <SettingsSection
        title="Anti-fraude"
        description="Estos límites se aplican dentro de la RPC de canje, no solo en UI."
      >
        <form action={updateSettingsSectionAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="section" value="antifraud" />
          <input type="hidden" name="redirectTo" value="/admin/settings/antifraud" />

          <Field
            label="Intervalo mínimo entre visitas (segundos)"
            name="min_seconds_between_visits"
            defaultValue={settings.antifraud.min_seconds_between_visits}
          />
          <Field
            label="Máximo de visitas por día"
            name="max_visits_per_day"
            defaultValue={settings.antifraud.max_visits_per_day}
          />

          <div className="md:col-span-2">
            <NeonButton type="submit">Guardar anti-fraude</NeonButton>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <input
        name={name}
        type="number"
        defaultValue={defaultValue}
        className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
      />
    </label>
  );
}
