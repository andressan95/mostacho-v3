"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { parseNumber } from "@/lib/utils";

const clientIdSchema = z.string().uuid().nullable();

export async function createVisitAction(formData: FormData) {
  const serviceIds = formData
    .getAll("serviceIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!serviceIds.length) {
    redirect("/barber/new-visit?error=Selecciona%20al%20menos%20un%20servicio.");
  }

  const services = serviceIds.map((serviceId) => ({
    service_id: serviceId,
    qty: Math.max(parseNumber(formData.get(`qty:${serviceId}`), 1), 1),
  }));

  const rawClientId = String(formData.get("clientId") ?? "").trim();
  const clientId = rawClientId
    ? clientIdSchema.parse(rawClientId)
    : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_visit", {
    p_services: services,
    p_client_id: clientId,
  });

  if (error || !data) {
    redirect(
      `/barber/new-visit?error=${encodeURIComponent(error?.message ?? "No se pudo crear la visita.")}`,
    );
  }

  const result = data as {
    visit_id: string;
    expires_at: string;
  };

  revalidatePath("/barber");
  revalidatePath("/barber/visits");
  revalidatePath("/barber/new-visit");

  redirect(
    `/barber/new-visit?created=${result.visit_id}&success=${encodeURIComponent("Visita creada. Comparte el QR con el cliente.")}`,
  );
}
