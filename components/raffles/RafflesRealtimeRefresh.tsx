"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function RafflesRealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("raffles-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "raffles" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
