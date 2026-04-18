import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Entrar · Mostacho",
  description: "Accede a tu programa de fidelidad.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Bienvenido de vuelta a Mostacho."
      footer={
        <>
          ¿Primera vez aquí?{" "}
          <Link
            href="/auth/sign-up"
            className="text-[color:var(--color-purple-vivid)] underline-offset-4 hover:underline"
          >
            Crea tu cuenta
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>

        <div className="relative flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
          o continúa con
          <span className="h-px flex-1 bg-[color:var(--color-glass-border)]" />
        </div>

        <OAuthButtons />
      </div>
    </AuthShell>
  );
}
