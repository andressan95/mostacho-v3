"use client";

import { useActionState, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { Notice } from "@/components/ui/Notice";
import { createPushSubscription } from "@/lib/push/subscribe";
import {
  savePushSubscription,
  type PushState,
} from "@/app/(app)/client/profile/actions";

const initial: PushState = {};

export function PushNotificationsCard() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const subscriptionInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    savePushSubscription,
    initial,
  );

  async function handleEnable() {
    setLocalError(null);

    try {
      const subscription = await createPushSubscription();
      const payload = JSON.stringify(subscription.toJSON());

      if (subscriptionInputRef.current) {
        subscriptionInputRef.current.value = payload;
      }

      formRef.current?.requestSubmit();
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "No fue posible activar notificaciones.",
      );
    }
  }

  return (
    <GlassCard variant="strong" className="space-y-4">
      <div className="space-y-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-purple-primary)]/15 text-[color:var(--color-purple-vivid)]">
          <Bell className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
          Web Push
        </h3>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Recibe avisos cuando confirmes una visita o cuando ganes un sorteo.
          En iPhone debes instalar la PWA en la pantalla de inicio.
        </p>
      </div>

      {localError ? <Notice tone="danger">{localError}</Notice> : null}
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.message ? <Notice tone="success">{state.message}</Notice> : null}

      <form ref={formRef} action={formAction} className="space-y-3">
        <input ref={subscriptionInputRef} type="hidden" name="subscription" />
        <input
          type="hidden"
          name="userAgent"
          value={typeof navigator === "undefined" ? "" : navigator.userAgent}
        />
        <NeonButton type="button" onClick={handleEnable} disabled={pending}>
          {pending ? "Activando…" : "Activar notificaciones"}
        </NeonButton>
      </form>

      <Notice tone="info">
        Android permite el prompt directo desde el navegador. En iOS 16.4+ primero
        debes instalar Mostacho como app web.
      </Notice>
    </GlassCard>
  );
}
