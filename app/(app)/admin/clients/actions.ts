"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const adjustPointsSchema = z.object({
  clientId: z.string().uuid(),
  delta: z.coerce.number().int().refine((value) => value !== 0, {
    message: "El ajuste no puede ser 0.",
  }),
  reason: z.string().trim().min(3).max(120),
});

export async function adjustClientPointsAction(formData: FormData) {
  const parsed = adjustPointsSchema.safeParse({
    clientId: formData.get("clientId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/clients?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_points", {
    p_client_id: parsed.data.clientId,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
  });

  if (error) {
    redirect(
      `/admin/clients?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/client");
  revalidatePath("/client/history");

  redirect("/admin/clients?success=Ajuste%20registrado.");
}
