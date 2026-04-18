import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { requireSession } from "@/lib/auth/session";
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

  if (!session.phone) {
    redirect("/auth/complete-profile");
  }

  const role = primaryRole(session.roles);

  return (
    <AppShell
      role={role}
      fullName={session.fullName}
      tenantName={session.tenantName}
    >
      {children}
    </AppShell>
  );
}
