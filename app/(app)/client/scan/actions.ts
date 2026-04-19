"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeQrToken } from "@/lib/domains/visits/tokens";
import { createClient } from "@/lib/supabase/server";

export async function redeemVisitTokenAction(formData: FormData) {
  const rawToken = String(formData.get("token") ?? "");
  const token = normalizeQrToken(rawToken);

  if (!token) {
    redirect("/client/scan?error=Ingresa o escanea un%20token%20válido.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_visit_token", {
    p_token: token,
  });

  if (error || !data) {
    redirect(
      `/client/scan?error=${encodeURIComponent(error?.message ?? "No se pudo canjear el QR.")}`,
    );
  }

  const result = data as {
    points_awarded: number;
    new_total: number;
    loyalty_level: string;
  };

  revalidatePath("/client");
  revalidatePath("/client/history");
  revalidatePath("/client/scan");

  redirect(
    `/client/scan?success=${encodeURIComponent(
      `Canje listo: +${result.points_awarded} puntos. Total ${result.new_total}. Nivel ${result.loyalty_level.toUpperCase()}.`,
    )}`,
  );
}
