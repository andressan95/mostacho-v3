import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminNotificationsSettingsPage({
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
        title="Notificaciones"
        description="Controla qué eventos intentarán enviar Web Push a los usuarios."
      >
        <form action={updateSettingsSectionAction} className="grid gap-3">
          <input type="hidden" name="section" value="push" />
          <input type="hidden" name="redirectTo" value="/admin/settings/notifications" />

          <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-4">
            <input
              name="notify_on_visit_confirm"
              type="checkbox"
              defaultChecked={settings.push.notify_on_visit_confirm}
              className="h-4 w-4 accent-[color:var(--color-purple-primary)]"
            />
            <span className="text-sm text-[color:var(--color-text-secondary)]">
              Notificar al barbero cuando una visita se confirma
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-4">
            <input
              name="notify_on_raffle_win"
              type="checkbox"
              defaultChecked={settings.push.notify_on_raffle_win}
              className="h-4 w-4 accent-[color:var(--color-purple-primary)]"
            />
            <span className="text-sm text-[color:var(--color-text-secondary)]">
              Notificar al cliente cuando gane un sorteo
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              Días de inactividad
            </span>
            <input
              name="notify_on_inactivity_days"
              type="number"
              defaultValue={settings.push.notify_on_inactivity_days}
              className="rounded-2xl border border-[color:var(--color-glass-border)] bg-white/5 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
            />
          </label>

          <div>
            <NeonButton type="submit">Guardar notificaciones</NeonButton>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}
