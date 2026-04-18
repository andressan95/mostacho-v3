"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, KeyRound } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { NeonButton } from "@/components/glass";
import {
  signInWithPassword,
  sendEmailOtp,
  verifyEmailOtp,
  type AuthActionState,
} from "@/app/auth/actions";

const initial: AuthActionState = {};

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/client";
  const initialError = searchParams.get("error") ?? undefined;

  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialError ? { error: initialError } : initial,
  );
  const [otpStartState, otpStartAction, otpStartPending] = useActionState(
    sendEmailOtp,
    initial,
  );
  const [otpVerifyState, otpVerifyAction, otpVerifyPending] = useActionState(
    verifyEmailOtp,
    initial,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={passwordAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
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
          autoComplete="current-password"
          required
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          leading={<Lock className="h-4 w-4" />}
          error={passwordState.error}
        />
        <NeonButton type="submit" fullWidth disabled={passwordPending}>
          {passwordPending ? "Entrando…" : "Entrar"}
        </NeonButton>
      </form>

      <div className="relative flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
        <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
        o código por email
        <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
      </div>

      <form action={otpStartAction} className="flex flex-col gap-3">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          label="Email"
          placeholder="tu@correo.com"
          leading={<Mail className="h-4 w-4" />}
          hint={otpStartState.message}
          error={otpStartState.error}
        />
        <NeonButton
          type="submit"
          variant="outline"
          fullWidth
          disabled={otpStartPending}
        >
          {otpStartPending ? "Enviando…" : "Enviarme un código"}
        </NeonButton>
      </form>

      {otpStartState.message ? (
        <form action={otpVerifyAction} className="flex flex-col gap-3">
          <Input
            name="email"
            type="email"
            required
            label="Email"
            placeholder="tu@correo.com"
            leading={<Mail className="h-4 w-4" />}
          />
          <Input
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            label="Código de 6 dígitos"
            placeholder="123456"
            leading={<KeyRound className="h-4 w-4" />}
            error={otpVerifyState.error}
          />
          <NeonButton type="submit" fullWidth disabled={otpVerifyPending}>
            {otpVerifyPending ? "Verificando…" : "Verificar código"}
          </NeonButton>
        </form>
      ) : null}

      <p className="text-center text-sm text-[color:var(--color-text-muted)]">
        ¿Sin cuenta?{" "}
        <Link
          href="/auth/sign-up"
          className="text-[color:var(--color-purple-vivid)] underline-offset-4 hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
