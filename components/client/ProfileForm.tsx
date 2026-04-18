"use client";

import { useActionState } from "react";
import { CalendarDays, Phone, UserRound } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { NeonButton } from "@/components/glass";
import {
  updateProfile,
  type ProfileState,
} from "@/app/(app)/client/profile/actions";

const initial: ProfileState = {};

type Props = {
  fullName: string;
  phone: string;
  birthday: string | null;
};

export function ProfileForm({ fullName, phone, birthday }: Props) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="fullName"
        type="text"
        autoComplete="name"
        required
        label="Nombre completo"
        defaultValue={fullName}
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
        defaultValue={phone}
        leading={<Phone className="h-4 w-4" />}
        error={state.fieldErrors?.phone}
      />
      <Input
        name="birthday"
        type="date"
        label="Cumpleaños"
        defaultValue={birthday ?? ""}
        leading={<CalendarDays className="h-4 w-4" />}
        hint="Opcional. Úsalo para recibir regalos en tu cumpleaños."
        error={state.fieldErrors?.birthday}
      />

      {state.error ? (
        <p className="rounded-xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 px-3 py-2 text-sm text-[color:var(--color-success)]">
          {state.message}
        </p>
      ) : null}

      <NeonButton type="submit" fullWidth disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </NeonButton>
    </form>
  );
}
