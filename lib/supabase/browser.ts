"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Cliente Supabase para Client Components (Realtime, listeners de auth,
 * fetches optimistas). Las mutaciones de negocio deben hacerse vía Server
 * Actions llamando a `createClient()` de `./server`.
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
