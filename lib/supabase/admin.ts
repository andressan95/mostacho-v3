import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_SERVICE_ROLE_KEY, requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Cliente con `service_role`. Úsalo SOLO desde Server Actions o Route Handlers
 * que corren en el servidor (nunca expuesto al cliente) para tareas privilegiadas:
 * setear `app_metadata`, escribir auditoría, llamadas administrativas al API.
 *
 * Sin `SUPABASE_SERVICE_ROLE_KEY` devuelve un cliente con la anon key — útil en
 * build-time, pero las llamadas privilegiadas fallarán en runtime.
 */
export function createAdminClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const key = SUPABASE_SERVICE_ROLE_KEY ?? anonKey;

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
