// ============================================================================
// Edge Function: sync-app-metadata
// ----------------------------------------------------------------------------
// Sincroniza `app_metadata.tenant_id` y `app_metadata.roles` en auth.users
// a partir de las tablas `profiles` + `profile_roles`.
//
// Invocación:
//   POST { user_id: string }
//   Headers: Authorization: Bearer <service_role_key> (o JWT de admin)
//
// Úsalo cuando:
//   - Un admin cambia roles de un usuario (re-sincronizar su JWT en el próximo refresh).
//   - Post-signup si no confías en el trigger plpgsql para setear metadata.
//
// El trigger `handle_new_user` (migración 0001) ya setea metadata al crear el
// usuario. Esta función es la vía "admin" para re-sincronizar a demanda.
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

interface Payload {
  user_id?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const userId = payload.user_id;
  if (!userId) {
    return jsonResponse({ error: "user_id_required" }, 400);
  }

  // Lee profile + roles.
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, tenant_id, tenants:tenant_id (slug)")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }
  if (!profile) {
    return jsonResponse({ error: "profile_not_found" }, 404);
  }

  const { data: roleRows, error: rolesError } = await admin
    .from("profile_roles")
    .select("role")
    .eq("profile_id", profile.id);

  if (rolesError) {
    return jsonResponse({ error: rolesError.message }, 500);
  }

  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  const tenantId = profile.tenant_id;
  const tenantSlug =
    (profile as unknown as { tenants: { slug: string } | null }).tenants
      ?.slug ?? null;

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      roles,
    },
  });

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({
    ok: true,
    user_id: userId,
    tenant_id: tenantId,
    tenant_slug: tenantSlug,
    roles,
  });
});
