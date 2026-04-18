"use client";

import { useTransition } from "react";

import { NeonButton } from "@/components/glass";
import { signInWithOAuth } from "@/app/auth/actions";

type Provider = {
  id: "google" | "facebook" | "apple";
  label: string;
  icon: React.ReactNode;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.8h5.3c-.2 1.4-1.6 4.2-5.3 4.2-3.2 0-5.8-2.6-5.8-5.9S8.8 6.4 12 6.4c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 4 14.5 3 12 3 6.9 3 2.7 7.2 2.7 12.3S6.9 21.6 12 21.6c6.9 0 9.5-4.9 9.5-7.4 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#1877F2"
        d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M19.3 17.3c-.4.9-.9 1.7-1.4 2.4-.8 1-1.8 1.5-2.9 1.5-1 0-1.7-.3-2.7-.3s-1.7.3-2.7.3c-1.2 0-2.2-.6-2.9-1.5-2-2.4-3.5-6.9-1.5-9.8.9-1.4 2.5-2.3 4.2-2.3 1.1 0 2.2.4 2.9.4.8 0 1.9-.4 3.2-.4 1.4 0 2.9.8 3.8 2-3.3 1.8-2.8 6.5.0 7.7zM15.3 4.6c.7-.8 1.1-2 1-3.2-1.1.1-2.3.7-3 1.6-.7.7-1.2 1.9-1.1 3 1.2.1 2.4-.6 3.1-1.4z" />
    </svg>
  );
}

const PROVIDERS: Provider[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "facebook", label: "Facebook", icon: <FacebookIcon /> },
  { id: "apple", label: "Apple", icon: <AppleIcon /> },
];

export function OAuthButtons() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-3 gap-2">
      {PROVIDERS.map((p) => (
        <form
          key={p.id}
          action={(fd) => startTransition(() => signInWithOAuth(fd))}
        >
          <input type="hidden" name="provider" value={p.id} />
          <NeonButton
            type="submit"
            variant="ghost"
            size="md"
            fullWidth
            disabled={pending}
            aria-label={`Continuar con ${p.label}`}
          >
            <span className="flex items-center gap-2 text-sm">
              {p.icon}
              <span className="hidden sm:inline">{p.label}</span>
            </span>
          </NeonButton>
        </form>
      ))}
    </div>
  );
}
