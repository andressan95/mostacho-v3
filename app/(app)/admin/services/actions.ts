"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const saveServiceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  durationMin: z.coerce.number().int().min(1).max(240),
  basePoints: z.coerce.number().int().min(0).max(10000),
  priceCents: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export async function saveServiceAction(formData: FormData) {
  const parsed = saveServiceSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    durationMin: formData.get("durationMin"),
    basePoints: formData.get("basePoints"),
    priceCents: formData.get("priceCents"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    redirect(
      `/admin/services?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_service", {
    p_id: parsed.data.id || null,
    p_name: parsed.data.name,
    p_duration_min: parsed.data.durationMin,
    p_base_points: parsed.data.basePoints,
    p_price_cents: parsed.data.priceCents,
    p_active: parsed.data.active,
  });

  if (error) {
    redirect(`/admin/services?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/barber/new-visit");

  redirect("/admin/services?success=Servicio%20guardado.");
}

export async function archiveServiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/services?error=Falta%20el%20servicio%20a%20archivar.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_service", { p_id: id });

  if (error) {
    redirect(`/admin/services?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/barber/new-visit");

  redirect("/admin/services?success=Servicio%20archivado.");
}
