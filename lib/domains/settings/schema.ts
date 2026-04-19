import { z } from "zod";

const optionalText = z.string().trim().max(200).default("");
const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6})$/, "Usa un color HEX como #7C3AED");

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(2).max(80),
  currency: z.string().trim().length(3),
  contact_phone: optionalText,
  contact_email: z.string().trim().email().or(z.literal("")).default(""),
  address: z.string().trim().max(200).default(""),
});

export const brandingSettingsSchema = z.object({
  primary_hex: hexColor,
  accent_hex: hexColor,
  logo_url: optionalText,
});

export const loyaltySettingsSchema = z.object({
  level_thresholds: z.object({
    silver: z.number().int().min(1),
    gold: z.number().int().min(1),
    diamond: z.number().int().min(1),
  }),
  level_multipliers: z.object({
    bronze: z.number().min(1),
    silver: z.number().min(1),
    gold: z.number().min(1),
    diamond: z.number().min(1),
  }),
});

export const qrSettingsSchema = z.object({
  token_ttl_seconds: z.number().int().min(60).max(86400),
});

export const antifraudSettingsSchema = z.object({
  min_seconds_between_visits: z.number().int().min(0).max(86400),
  max_visits_per_day: z.number().int().min(1).max(20),
});

export const raffleDefaultsSchema = z.object({
  default_min_level: z.enum(["bronze", "silver", "gold", "diamond"]),
  auto_close_on_ends_at: z.boolean(),
});

export const pushSettingsSchema = z.object({
  notify_on_visit_confirm: z.boolean(),
  notify_on_raffle_win: z.boolean(),
  notify_on_inactivity_days: z.number().int().min(1).max(365),
});

export const tenantSettingsSchema = z.object({
  business: businessSettingsSchema,
  branding: brandingSettingsSchema,
  loyalty: loyaltySettingsSchema,
  qr: qrSettingsSchema,
  antifraud: antifraudSettingsSchema,
  raffles: raffleDefaultsSchema,
  push: pushSettingsSchema,
});

export type BusinessSettings = z.infer<typeof businessSettingsSchema>;
export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;
export type LoyaltySettings = z.infer<typeof loyaltySettingsSchema>;
export type QrSettings = z.infer<typeof qrSettingsSchema>;
export type AntifraudSettings = z.infer<typeof antifraudSettingsSchema>;
export type RaffleDefaults = z.infer<typeof raffleDefaultsSchema>;
export type PushSettings = z.infer<typeof pushSettingsSchema>;
export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type TenantSettingsSection = keyof TenantSettings;

export const defaultTenantSettings: TenantSettings = {
  business: {
    name: "Mostacho",
    slug: "mostacho-demo",
    timezone: "America/Guayaquil",
    currency: "USD",
    contact_phone: "",
    contact_email: "",
    address: "",
  },
  branding: {
    primary_hex: "#7C3AED",
    accent_hex: "#A78BFA",
    logo_url: "",
  },
  loyalty: {
    level_thresholds: {
      silver: 100,
      gold: 500,
      diamond: 2000,
    },
    level_multipliers: {
      bronze: 1,
      silver: 1.1,
      gold: 1.25,
      diamond: 1.5,
    },
  },
  qr: {
    token_ttl_seconds: 600,
  },
  antifraud: {
    min_seconds_between_visits: 3600,
    max_visits_per_day: 3,
  },
  raffles: {
    default_min_level: "silver",
    auto_close_on_ends_at: true,
  },
  push: {
    notify_on_visit_confirm: true,
    notify_on_raffle_win: true,
    notify_on_inactivity_days: 30,
  },
};

export function parseTenantSettings(raw: unknown): TenantSettings {
  const merged = deepMergeSettings(defaultTenantSettings, raw);
  return tenantSettingsSchema.parse(merged);
}

export function getSettingsSection<TSection extends TenantSettingsSection>(
  raw: unknown,
  section: TSection,
): TenantSettings[TSection] {
  return parseTenantSettings(raw)[section];
}

export function buildSettingsPatch<TSection extends TenantSettingsSection>(
  section: TSection,
  values: TenantSettings[TSection],
) {
  return {
    [section]: values,
  } satisfies Partial<TenantSettings>;
}

function deepMergeSettings(
  base: TenantSettings,
  raw: unknown,
): TenantSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }

  const input = raw as Record<string, unknown>;

  return {
    business: {
      ...base.business,
      ...asObject(input.business),
    },
    branding: {
      ...base.branding,
      ...asObject(input.branding),
    },
    loyalty: {
      ...base.loyalty,
      ...asObject(input.loyalty),
      level_thresholds: {
        ...base.loyalty.level_thresholds,
        ...asObject(asObject(input.loyalty).level_thresholds),
      },
      level_multipliers: {
        ...base.loyalty.level_multipliers,
        ...asObject(asObject(input.loyalty).level_multipliers),
      },
    },
    qr: {
      ...base.qr,
      ...asObject(input.qr),
    },
    antifraud: {
      ...base.antifraud,
      ...asObject(input.antifraud),
    },
    raffles: {
      ...base.raffles,
      ...asObject(input.raffles),
    },
    push: {
      ...base.push,
      ...asObject(input.push),
    },
  };
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
