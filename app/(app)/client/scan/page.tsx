import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";

import { QrActionForm } from "@/components/qr/QrActionForm";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { firstValue } from "@/lib/utils";

import { redeemVisitTokenAction } from "./actions";

export default async function ClientScanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const success = firstValue(params.success);
  const error = firstValue(params.error);

  if (!hasRole(session.roles, "client")) {
    redirect("/barber");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Confirmar visita
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Escanea el QR del barbero
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Puedes usar la cámara, un lector HID o pegar el token manualmente.
        </p>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <QrActionForm
        action={redeemVisitTokenAction}
        title="Captura tu visita"
        description="El canje se valida atómicamente. Si el QR ya fue usado o expiró, verás el motivo aquí."
      />

      <Notice tone="info">
        <span className="inline-flex items-center gap-2">
          <ScanLine className="h-4 w-4" />
          Los lectores USB/Bluetooth suelen terminar el escaneo con Enter. En
          modo HID el formulario se enviará al terminar.
        </span>
      </Notice>
    </div>
  );
}
