"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, UserRound } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { NeonButton } from "@/components/glass";
import {
  completeProfile,
  type CompleteProfileState,
} from "@/app/auth/complete-profile/actions";

const initial: CompleteProfileState = {};

type Props = {
  defaultFullName?: string;
  defaultPhone?: string;
};

export function CompleteProfileForm({ defaultFullName, defaultPhone }: Props) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/client";

  const [state, action, pending] = useActionState(completeProfile, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Input
        name="fullName"
        type="text"
        autoComplete="name"
        required
        label="Nombre completo"
        placeholder="Carlos Pérez"
        defaultValue={defaultFullName}
        leading={<UserRound className="h-4 w-4" />}
        error={state.fieldErrors?.fullName}
      />
      <Input
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        label="Teléfono"
        placeholder="+56 9 1234 5678"
        defaultValue={defaultPhone}
        leading={<Phone className="h-4 w-4" />}
        hint="Formato internacional (E.164). Te lo pediremos para reclamar premios."
        error={state.fieldErrors?.phone}
      />

      {state.error ? (
        <p className="rounded-xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <NeonButton type="submit" fullWidth disabled={pending}>
        {pending ? "Guardando…" : "Guardar y continuar"}
      </NeonButton>
    </form>
  );
}
