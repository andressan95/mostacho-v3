import { redirect } from "next/navigation";

import { QrActionForm } from "@/components/qr/QrActionForm";
import { Notice } from "@/components/ui/Notice";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { firstValue } from "@/lib/utils";

import { redeemPrizeTokenAction } from "./actions";

export default async function AdminScanPrizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const success = firstValue(params.success);
  const error = firstValue(params.error);

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Entrega de premio
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Valida el QR del ganador
        </h1>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <QrActionForm
        action={redeemPrizeTokenAction}
        title="Escanea el premio"
        description="Cuando el admin valide este código, el sorteo quedará marcado como entregado."
      />
    </div>
  );
}
