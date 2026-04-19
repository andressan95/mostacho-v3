import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminBrandingSettingsPage({
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
        title="Branding"
        description="Estos valores sobreescriben el morado por defecto en el área privada."
      >
        <form action={updateSettingsSectionAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="section" value="branding" />
          <input type="hidden" name="redirectTo" value="/admin/settings/branding" />

          <ColorField
            label="Color primario"
            name="primary_hex"
            defaultValue={settings.branding.primary_hex}
          />
          <ColorField
            label="Color acento"
            name="accent_hex"
            defaultValue={settings.branding.accent_hex}
          />
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              URL del logo
            </span>
            <input
              name="logo_url"
              defaultValue={settings.branding.logo_url}
              className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
            />
          </label>

          <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div
              className="h-12 w-12 rounded-2xl"
              style={{ background: settings.branding.primary_hex }}
            />
            <div
              className="h-12 w-12 rounded-2xl"
              style={{ background: settings.branding.accent_hex }}
            />
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Vista rápida del tema actual del tenant.
            </p>
          </div>

          <div className="md:col-span-2">
            <NeonButton type="submit">Guardar branding</NeonButton>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <div className="flex gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3">
        <input
          name={name}
          type="color"
          defaultValue={defaultValue}
          className="h-11 w-14 rounded-xl bg-transparent"
        />
        <input
          defaultValue={defaultValue}
          readOnly
          className="flex-1 bg-transparent text-sm text-[color:var(--color-text-primary)] outline-none"
        />
      </div>
    </label>
  );
}
