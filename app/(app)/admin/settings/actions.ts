"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  antifraudSettingsSchema,
  brandingSettingsSchema,
  buildSettingsPatch,
  businessSettingsSchema,
  loyaltySettingsSchema,
  pushSettingsSchema,
  raffleDefaultsSchema,
  TenantSettingsSection,
} from "@/lib/domains/settings/schema";
import { createClient } from "@/lib/supabase/server";

const sectionSchema = z.enum([
  "business",
  "branding",
  "loyalty",
  "antifraud",
  "raffles",
  "push",
]);

export async function updateSettingsSectionAction(formData: FormData) {
  const sectionResult = sectionSchema.safeParse(formData.get("section"));
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/settings");

  if (!sectionResult.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent("Sección inválida.")}`,
    );
  }

  const section = sectionResult.data;

  const patch = parseSectionPatch(section, formData);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_tenant_settings", {
    patch,
  });

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath(redirectTo);
  revalidatePath("/client");
  revalidatePath("/barber");

  redirect(`${redirectTo}?success=${encodeURIComponent("Configuración guardada.")}`);
}

function parseSectionPatch(
  section: TenantSettingsSection,
  formData: FormData,
) {
  switch (section) {
    case "business":
      return buildSettingsPatch(
        section,
        businessSettingsSchema.parse({
          name: formData.get("name"),
          slug: formData.get("slug"),
          timezone: formData.get("timezone"),
          currency: formData.get("currency"),
          contact_phone: formData.get("contact_phone"),
          contact_email: formData.get("contact_email"),
          address: formData.get("address"),
        }),
      );
    case "branding":
      return buildSettingsPatch(
        section,
        brandingSettingsSchema.parse({
          primary_hex: formData.get("primary_hex"),
          accent_hex: formData.get("accent_hex"),
          logo_url: formData.get("logo_url"),
        }),
      );
    case "loyalty":
      return buildSettingsPatch(
        section,
        loyaltySettingsSchema.parse({
          level_thresholds: {
            silver: Number(formData.get("silver")),
            gold: Number(formData.get("gold")),
            diamond: Number(formData.get("diamond")),
          },
          level_multipliers: {
            bronze: Number(formData.get("bronze_multiplier")),
            silver: Number(formData.get("silver_multiplier")),
            gold: Number(formData.get("gold_multiplier")),
            diamond: Number(formData.get("diamond_multiplier")),
          },
        }),
      );
    case "antifraud":
      return buildSettingsPatch(
        section,
        antifraudSettingsSchema.parse({
          min_seconds_between_visits: Number(
            formData.get("min_seconds_between_visits"),
          ),
          max_visits_per_day: Number(formData.get("max_visits_per_day")),
        }),
      );
    case "raffles":
      return buildSettingsPatch(
        section,
        raffleDefaultsSchema.parse({
          default_min_level: formData.get("default_min_level"),
          auto_close_on_ends_at: formData.get("auto_close_on_ends_at") === "on",
        }),
      );
    case "push":
      return buildSettingsPatch(
        section,
        pushSettingsSchema.parse({
          notify_on_visit_confirm: formData.get("notify_on_visit_confirm") === "on",
          notify_on_raffle_win: formData.get("notify_on_raffle_win") === "on",
          notify_on_inactivity_days: Number(
            formData.get("notify_on_inactivity_days"),
          ),
        }),
      );
    default:
      throw new Error(`Sección no soportada: ${String(section)}`);
  }
}
