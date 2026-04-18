import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Rutas que no requieren sesión activa. Cualquier otra ruta dentro de `/(app)`
 * obliga a iniciar sesión. El matcher del middleware raíz ya excluye assets.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/auth",
  "/raffles",
  "/services",
  "/offline",
  "/manifest.webmanifest",
  "/sw.js",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix),
  );
}

function isAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/client") ||
    pathname.startsWith("/barber") ||
    pathname.startsWith("/admin")
  );
}

/**
 * Refresca la sesión de Supabase en cada request y aplica redirects de auth.
 * Sigue el contrato recomendado: `createServerClient` → `auth.getUser()` →
 * devolver el `NextResponse` con las cookies aplicadas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url: supabaseUrl, anonKey } = requireSupabaseEnv();

  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANTE: no meter código entre `createServerClient` y `getUser()`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isAppPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = "/client";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Si llega al área privada con sesión pero sin teléfono, fuerza completar perfil.
  if (user && isAppPath(pathname) && pathname !== "/auth/complete-profile") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("user_id", user.id)
      .maybeSingle<{ phone: string | null }>();

    if (profile && !profile.phone) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/complete-profile";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export { isPublicPath, isAppPath };
