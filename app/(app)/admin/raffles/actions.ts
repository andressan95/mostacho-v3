"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  buildRafflePayload,
  createRaffleSchema,
} from "@/lib/domains/raffles/schema";
import { createClient } from "@/lib/supabase/server";

const drawSchema = z.object({
  raffleId: z.string().uuid(),
});

export async function createRaffleAction(formData: FormData) {
  const parsed = createRaffleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    prize_name: formData.get("prize_name"),
    prize_description: formData.get("prize_description"),
    min_level: formData.get("min_level"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/raffles?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos.")}`,
    );
  }

  const payload = buildRafflePayload(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_raffle", { payload });

  if (error) {
    redirect(`/admin/raffles?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  revalidatePath("/raffles");

  redirect("/admin/raffles?success=Sorteo%20creado.");
}

export async function drawRaffleAction(formData: FormData) {
  const parsed = drawSchema.safeParse({
    raffleId: formData.get("raffleId"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/raffles?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Sorteo inválido.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("draw_raffle", {
    p_raffle_id: parsed.data.raffleId,
  });

  if (error) {
    redirect(`/admin/raffles?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/raffles");
  revalidatePath("/raffles");

  redirect("/admin/raffles?success=Ganador%20seleccionado.");
}
