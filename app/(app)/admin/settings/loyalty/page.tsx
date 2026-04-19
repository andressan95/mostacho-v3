import { redirect } from "next/navigation";

import { NeonButton } from "@/components/glass";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettingsForTenant } from "@/lib/domains/settings/server";
import { firstValue } from "@/lib/utils";

import { updateSettingsSectionAction } from "../actions";

export default async function AdminLoyaltySettingsPage({
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pt-2">
      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <SettingsSection
        title="Lealtad"
        description="Estos thresholds y multiplicadores son consumidos por la RPC que confirma la visita."
      >
        <form action={updateSettingsSectionAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="section" value="loyalty" />
          <input type="hidden" name="redirectTo" value="/admin/settings/loyalty" />

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
              Thresholds
            </h3>
            <NumberField label="Silver" name="silver" defaultValue={settings.loyalty.level_thresholds.silver} />
            <NumberField label="Gold" name="gold" defaultValue={settings.loyalty.level_thresholds.gold} />
            <NumberField label="Diamond" name="diamond" defaultValue={settings.loyalty.level_thresholds.diamond} />
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
              Multiplicadores
            </h3>
            <NumberField label="Bronze" name="bronze_multiplier" step="0.01" defaultValue={settings.loyalty.level_multipliers.bronze} />
            <NumberField label="Silver" name="silver_multiplier" step="0.01" defaultValue={settings.loyalty.level_multipliers.silver} />
            <NumberField label="Gold" name="gold_multiplier" step="0.01" defaultValue={settings.loyalty.level_multipliers.gold} />
            <NumberField label="Diamond" name="diamond_multiplier" step="0.01" defaultValue={settings.loyalty.level_multipliers.diamond} />
          </div>

          <div className="lg:col-span-2">
            <NeonButton type="submit">Guardar lealtad</NeonButton>
          </div>
        </form>
      </SettingsSection>
    </div>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  step = "1",
}: {
  label: string;
  name: string;
  defaultValue: number;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <input
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue}
        className="rounded-2xl border border-[color:var(--color-glass-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--color-text-primary)] outline-none"
      />
    </label>
  );
}
