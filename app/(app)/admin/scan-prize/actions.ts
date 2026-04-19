"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeQrToken } from "@/lib/domains/visits/tokens";
import { createClient } from "@/lib/supabase/server";

export async function redeemPrizeTokenAction(formData: FormData) {
  const token = normalizeQrToken(String(formData.get("token") ?? ""));
  if (!token) {
    redirect("/admin/scan-prize?error=Escanea%20un%20token%20válido.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_prize_token", {
    p_token: token,
  });

  if (error || !data) {
    redirect(
      `/admin/scan-prize?error=${encodeURIComponent(error?.message ?? "No se pudo validar el premio.")}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  revalidatePath("/admin/scan-prize");
  revalidatePath("/raffles");

  redirect("/admin/scan-prize?success=Premio%20entregado.");
}
