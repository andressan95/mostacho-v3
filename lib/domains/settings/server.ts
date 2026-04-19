import { parseTenantSettings } from "@/lib/domains/settings/schema";
import { createClient } from "@/lib/supabase/server";

export async function getTenantSettingsForTenant(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_settings")
    .select("config")
    .eq("tenant_id", tenantId)
    .maybeSingle<{ config: unknown }>();

  return parseTenantSettings(data?.config);
}
