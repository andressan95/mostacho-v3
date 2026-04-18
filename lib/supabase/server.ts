import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Lee y escribe cookies desde `next/headers`. Si `setAll` falla porque el
 * contexto no permite mutar cookies (por ejemplo, un Server Component puro),
 * el middleware raíz (ver `middleware.ts`) se encarga de refrescar la sesión.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Invocado desde un Server Component sin acceso a mutación; el
          // proxy/middleware ya refresca la sesión.
        }
      },
    },
  });
}
