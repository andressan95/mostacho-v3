import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye assets estáticos, imágenes, favicon, el manifest y el SW.
     * Cualquier otra ruta pasa por `updateSession` para refrescar la sesión.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|manifest.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
