"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_TENANT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "mostacho-demo";

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  fullName: z.string().min(2, "Ingresa tu nombre"),
});

const otpStartSchema = z.object({
  email: z.string().email("Email inválido"),
});

const otpVerifySchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().regex(/^\d{6}$/, "El código son 6 dígitos"),
});

export type AuthActionState = {
  error?: string;
  message?: string;
};

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");
  const forwardedProto = h.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  const next = (formData.get("next") as string | null) ?? "/client";
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/auth/complete-profile`,
      data: {
        full_name: parsed.data.fullName,
        tenant_slug: DEFAULT_TENANT_SLUG,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message:
      "Cuenta creada. Revisa tu correo para confirmar, o inicia sesión si el tenant no requiere confirmación.",
  };
}

export async function sendEmailOtp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = otpStartSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email inválido" };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/auth/complete-profile`,
      data: { tenant_slug: DEFAULT_TENANT_SLUG },
    },
  });

  if (error) {
    return { error: error.message };
  }
  return {
    message: "Te enviamos un link mágico y un código de 6 dígitos a tu correo.",
  };
}

export async function verifyEmailOtp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = otpVerifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });

  if (error) {
    return { error: "Código incorrecto o expirado" };
  }

  revalidatePath("/", "layout");
  redirect("/auth/complete-profile");
}

const OAUTH_PROVIDERS = ["google", "facebook", "apple"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export async function signInWithOAuth(formData: FormData): Promise<void> {
  const providerRaw = formData.get("provider");
  const provider = OAUTH_PROVIDERS.find((p) => p === providerRaw) as
    | OAuthProvider
    | undefined;

  if (!provider) {
    throw new Error("Proveedor OAuth inválido");
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/auth/complete-profile`,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "No se pudo iniciar OAuth");
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
