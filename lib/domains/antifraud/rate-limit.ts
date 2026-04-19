import {
  defaultTenantSettings,
  getSettingsSection,
} from "@/lib/domains/settings/schema";

export function getAntifraudPolicy(raw?: unknown) {
  return getSettingsSection(raw ?? defaultTenantSettings, "antifraud");
}

export function describeAntifraudPolicy(raw?: unknown) {
  const policy = getAntifraudPolicy(raw);

  return {
    ...policy,
    min_interval_label:
      policy.min_seconds_between_visits >= 3600
        ? `${policy.min_seconds_between_visits / 3600} hora(s)`
        : `${policy.min_seconds_between_visits / 60} min`,
  };
}
