import type { CSSProperties } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { parseTenantSettings } from "@/lib/domains/settings/schema";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/database.types";

const ROLE_PRIORITY: AppRole[] = ["admin", "barber", "client"];

function primaryRole(roles: AppRole[]): AppRole {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return "client";
}

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const supabase = await createClient();

  if (!session.phone) {
    redirect("/auth/complete-profile");
  }

  const role = primaryRole(session.roles);
  const { data: settingsRow } = await supabase
    .from("tenant_settings")
    .select("config")
    .eq("tenant_id", session.tenantId)
    .maybeSingle<{ config: unknown }>();

  const settings = parseTenantSettings(settingsRow?.config);
  const themeStyle = {
    "--color-purple-primary": settings.branding.primary_hex,
    "--color-purple-vivid": settings.branding.accent_hex,
  } as CSSProperties;

  return (
    <AppShell
      role={role}
      fullName={session.fullName}
      tenantName={session.tenantName}
      style={themeStyle}
    >
      {children}
    </AppShell>
  );
}
