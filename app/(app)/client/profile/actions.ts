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
