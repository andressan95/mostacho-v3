"use server";

import { revalidatePath } from "next/cache";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ProfileState = {
  error?: string;
  message?: string;
  fieldErrors?: { fullName?: string; phone?: string; birthday?: string };
};

export type PushState = {
  error?: string;
  message?: string;
};

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(4),
  birthday: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    birthday: formData.get("birthday") ?? undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: {
        fullName: flat.fieldErrors.fullName?.[0],
        phone: flat.fieldErrors.phone?.[0],
        birthday: flat.fieldErrors.birthday?.[0],
      },
    };
  }

  const phoneNumber = parsePhoneNumberFromString(parsed.data.phone, "CL");
  if (!phoneNumber || !phoneNumber.isValid()) {
    return { fieldErrors: { phone: "Teléfono inválido. Usa formato +56 9 1234 5678." } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: phoneNumber.number as string,
      birthday: parsed.data.birthday ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { phone: "Ese teléfono ya está registrado." } };
    }
    return { error: error.message };
  }

  revalidatePath("/client/profile");
  revalidatePath("/client");
  return { message: "Perfil actualizado." };
}

export async function savePushSubscription(
  _prev: PushState,
  formData: FormData,
): Promise<PushState> {
  const rawSubscription = String(formData.get("subscription") ?? "");
  const userAgent = String(formData.get("userAgent") ?? "");

  if (!rawSubscription) {
    return { error: "No se recibió ninguna suscripción push." };
  }

  let parsedSubscription: {
    endpoint?: string;
    keys?: Record<string, string | undefined>;
  };

  try {
    parsedSubscription = JSON.parse(rawSubscription) as {
      endpoint?: string;
      keys?: Record<string, string | undefined>;
    };
  } catch {
    return { error: "La suscripción push no tiene un formato válido." };
  }

  if (!parsedSubscription.endpoint || !parsedSubscription.keys) {
    return { error: "La suscripción está incompleta." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_push_subscription", {
    p_endpoint: parsedSubscription.endpoint,
    p_keys: parsedSubscription.keys,
    p_user_agent: userAgent || "unknown-device",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/client/profile");
  return { message: "Notificaciones activadas para este dispositivo." };
}
