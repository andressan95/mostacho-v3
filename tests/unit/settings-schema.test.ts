import { describe, expect, it } from "vitest";

import {
  buildSettingsPatch,
  defaultTenantSettings,
  parseTenantSettings,
} from "@/lib/domains/settings/schema";

describe("parseTenantSettings", () => {
  it("mezcla defaults con overrides parciales", () => {
    const settings = parseTenantSettings({
      business: { name: "Barber Lab" },
      loyalty: {
        level_thresholds: {
          silver: 150,
        },
      },
    });

    expect(settings.business.name).toBe("Barber Lab");
    expect(settings.business.currency).toBe(defaultTenantSettings.business.currency);
    expect(settings.loyalty.level_thresholds.silver).toBe(150);
    expect(settings.loyalty.level_thresholds.gold).toBe(500);
  });
});

describe("buildSettingsPatch", () => {
  it("construye un patch shallow por sección", () => {
    const patch = buildSettingsPatch("branding", {
      primary_hex: "#111111",
      accent_hex: "#222222",
      logo_url: "",
    });

    expect(patch).toEqual({
      branding: {
        primary_hex: "#111111",
        accent_hex: "#222222",
        logo_url: "",
      },
    });
  });
});
