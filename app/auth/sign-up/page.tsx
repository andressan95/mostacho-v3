import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Crear cuenta · Mostacho",
  description: "Únete al programa de fidelidad de Mostacho.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Suma puntos desde tu primera visita."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/sign-in"
            className="text-[color:var(--color-purple-vivid)] underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <SignUpForm />

        <div className="relative flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
          o regístrate con
          <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
        </div>

        <OAuthButtons />
      </div>
    </AuthShell>
  );
}
