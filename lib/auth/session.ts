import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/database.types";

export type SessionContext = {
  userId: string;
  email: string | null;
  profileId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  fullName: string;
  roles: AppRole[];
  phone: string | null;
};

/**
 * Carga el contexto de sesión combinando `auth.getUser()` con el `profile`
 * y sus `profile_roles`. Si no hay usuario, redirige a sign-in.
 * Si no hay profile (estado transitorio post-signup) o no hay teléfono,
 * lo señala con campos nulos para que el layout decida el redirect.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, tenant_id, phone, full_name, tenants:tenant_id (slug, name), profile_roles(role)",
    )
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      tenant_id: string;
      phone: string | null;
      full_name: string | null;
      tenants: { slug: string; name: string } | null;
      profile_roles: { role: AppRole }[] | null;
    }>();

  if (!profile) {
    redirect("/auth/complete-profile");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profileId: profile.id,
    tenantId: profile.tenant_id,
    tenantSlug: profile.tenants?.slug ?? "",
    tenantName: profile.tenants?.name ?? "Mostacho",
    fullName: profile.full_name ?? user.email?.split("@")[0] ?? "Tú",
    roles: (profile.profile_roles ?? []).map((r) => r.role),
    phone: profile.phone,
  };
}

/**
 * Variante que no redirige — útil para Server Components del área pública que
 * quieren saber si hay sesión (para mostrar "Mi cuenta" vs "Iniciar sesión").
 */
export async function getOptionalSession(): Promise<SessionContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, tenant_id, phone, full_name, tenants:tenant_id (slug, name), profile_roles(role)",
    )
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      tenant_id: string;
      phone: string | null;
      full_name: string | null;
      tenants: { slug: string; name: string } | null;
      profile_roles: { role: AppRole }[] | null;
    }>();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profileId: profile.id,
    tenantId: profile.tenant_id,
    tenantSlug: profile.tenants?.slug ?? "",
    tenantName: profile.tenants?.name ?? "Mostacho",
    fullName: profile.full_name ?? user.email?.split("@")[0] ?? "Tú",
    roles: (profile.profile_roles ?? []).map((r) => r.role),
    phone: profile.phone,
  };
}
