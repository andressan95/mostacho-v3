/**
 * Variables de entorno Supabase.
 *
 * Se leen sin lanzar errores al importar, para permitir que el módulo esté
 * disponible durante `next build` (antes de que `.env.local` esté cargado en
 * todos los puntos de la pipeline). Los helpers `requireUrl` / `requireAnonKey`
 * validan en runtime cuando se usan para crear un cliente.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function requireSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas. Copia .env.local.example a .env.local.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
