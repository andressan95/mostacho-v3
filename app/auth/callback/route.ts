import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth / magic-link. Supabase redirige aquí con `?code=...&next=...`.
 * Intercambia el code por una sesión y lanza al usuario al destino.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/client";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const isLocal = process.env.NODE_ENV === "development";

      if (isLocal) return NextResponse.redirect(`${origin}${next}`);
      if (forwardedHost) return NextResponse.redirect(`${proto}://${forwardedHost}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const errorUrl = new URL("/auth/sign-in", origin);
  errorUrl.searchParams.set(
    "error",
    "No se pudo completar la autenticación. Intenta de nuevo.",
  );
  return NextResponse.redirect(errorUrl);
}
