import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminRafflesSettingsPage({
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
        title="Sorteos"
        description="Define los defaults que usará el panel admin al crear un sorteo nuevo."
      >
        <form action={updateSettingsSectionAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="section" value="raffles" />
          <input type="hidden" name="redirectTo" value="/admin/settings/raffles" />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              Nivel mínimo por defecto
            </span>
            <select
              name="default_min_level"
              defaultValue={settings.raffles.default_min_level}
              className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
            >
              {["bronze", "silver", "gold", "diamond"].map((level) => (
                <option
                  key={level}
                  value={level}
                  className="bg-[color:var(--color-bg-surface)]"
                >
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3">
            <input
              name="auto_close_on_ends_at"
              type="checkbox"
              defaultChecked={settings.raffles.auto_close_on_ends_at}
              className="h-4 w-4 accent-[color:var(--color-purple-primary)]"
            />
            <span className="text-sm text-[color:var(--color-text-secondary)]">
              Cerrar automáticamente al llegar a `ends_at`
            </span>
          </label>

          <div className="md:col-span-2">
            <NeonButton type="submit">Guardar defaults</NeonButton>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}
