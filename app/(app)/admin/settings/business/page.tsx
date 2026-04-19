import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminBusinessSettingsPage({
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
        title="Datos del negocio"
        description="Controla la identidad operativa del tenant usada en auth, UI y futuras automatizaciones."
      >
        <form action={updateSettingsSectionAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="section" value="business" />
          <input type="hidden" name="redirectTo" value="/admin/settings/business" />

          <Field label="Nombre" name="name" defaultValue={settings.business.name} />
          <Field label="Slug" name="slug" defaultValue={settings.business.slug} />
          <Field label="Zona horaria" name="timezone" defaultValue={settings.business.timezone} />
          <Field label="Moneda" name="currency" defaultValue={settings.business.currency} />
          <Field
            label="Teléfono de contacto"
            name="contact_phone"
            defaultValue={settings.business.contact_phone}
          />
          <Field
            label="Email de contacto"
            name="contact_email"
            defaultValue={settings.business.contact_email}
          />
          <Field
            label="Dirección"
            name="address"
            defaultValue={settings.business.address}
            className="md:col-span-2"
          />

          <div className="md:col-span-2">
            <NeonButton type="submit">Guardar negocio</NeonButton>
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
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <label className={className ? `flex flex-col gap-1.5 ${className}` : "flex flex-col gap-1.5"}>
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
      />
    </label>
  );
}
