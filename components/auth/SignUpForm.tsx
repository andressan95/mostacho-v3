"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, UserRound } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { NeonButton } from "@/components/glass";
import {
  signUpWithPassword,
  type AuthActionState,
} from "@/app/auth/actions";

const initial: AuthActionState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="fullName"
        type="text"
        autoComplete="name"
        required
        label="Nombre completo"
        placeholder="Carlos Pérez"
        leading={<UserRound className="h-4 w-4" />}
      />
      <Input
        name="email"
        type="email"
        autoComplete="email"
        required
        label="Email"
        placeholder="tu@correo.com"
        leading={<Mail className="h-4 w-4" />}
      />
      <Input
        name="password"
        type="password"
        autoComplete="new-password"
        required
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        leading={<Lock className="h-4 w-4" />}
        hint="Al menos 8 caracteres. Puedes cambiarla luego."
        error={state.error}
      />

      {state.message ? (
        <p className="rounded-xl border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 px-3 py-2 text-sm text-[color:var(--color-success)]">
          {state.message}
        </p>
      ) : null}

      <NeonButton type="submit" fullWidth disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </NeonButton>

      <p className="text-center text-sm text-[color:var(--color-text-muted)]">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/sign-in"
          className="text-[color:var(--color-purple-vivid)] underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
