import type { AppRole } from "@/lib/supabase/database.types";

export const ROLE_HOME: Record<AppRole, string> = {
  client: "/client",
  barber: "/barber",
  admin: "/admin",
};

export const ROLE_PRIORITY: AppRole[] = ["admin", "barber", "client"];

/**
 * Elige la ruta de inicio según los roles del usuario. Si posee varios,
 * prioriza admin > barber > client. Devuelve `/client` como fallback neutro.
 */
export function pickRoleHome(roles: readonly AppRole[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return ROLE_HOME[role];
  }
  return ROLE_HOME.client;
}

export function hasRole(roles: readonly AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function canAccessPath(
  roles: readonly AppRole[],
  pathname: string,
): boolean {
  if (pathname.startsWith("/admin")) return hasRole(roles, "admin");
  if (pathname.startsWith("/barber")) {
    return hasRole(roles, "barber") || hasRole(roles, "admin");
  }
  if (pathname.startsWith("/client")) {
    return (
      hasRole(roles, "client") ||
      hasRole(roles, "barber") ||
      hasRole(roles, "admin")
    );
  }
  return true;
}
