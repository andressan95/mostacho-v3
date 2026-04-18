"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type CompleteProfileState = {
  error?: string;
  fieldErrors?: { fullName?: string; phone?: string };
};

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre completo.")
    .max(120, "Nombre demasiado largo."),
  phone: z.string().trim().min(4, "Ingresa un teléfono válido."),
  next: z.string().optional(),
});

function sanitizeNext(next: string | undefined): string {
  if (!next) return "/client";
  if (!next.startsWith("/")) return "/client";
  if (next.startsWith("//")) return "/client";
  return next;
}

export async function completeProfile(
  _prev: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: {
        fullName: flat.fieldErrors.fullName?.[0],
        phone: flat.fieldErrors.phone?.[0],
      },
    };
  }

  const phoneNumber = parsePhoneNumberFromString(parsed.data.phone, "CL");
  if (!phoneNumber || !phoneNumber.isValid()) {
    return { fieldErrors: { phone: "Teléfono inválido. Usa formato +56 9 1234 5678." } };
  }

  const e164 = phoneNumber.number as string;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: e164,
    })
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { fieldErrors: { phone: "Ese teléfono ya está registrado." } };
    }
    return { error: updateError.message };
  }

  revalidatePath("/client");
  redirect(sanitizeNext(parsed.data.next));
}
