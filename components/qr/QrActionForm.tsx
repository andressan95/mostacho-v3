"use client";

import { useRef, useState } from "react";

import { Notice } from "@/components/ui/Notice";
import { QrScanner } from "@/components/qr/QrScanner";

type QrActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  inputName?: string;
  title: string;
  description: string;
};

export function QrActionForm({
  action,
  inputName = "token",
  title,
  description,
}: QrActionFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [token, setToken] = useState("");

  function handleDetected(nextToken: string) {
    setToken(nextToken);

    requestAnimationFrame(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name={inputName} value={token} />
      <QrScanner
        title={title}
        description={description}
        onDetected={handleDetected}
      />
      {token ? (
        <Notice tone="info">
          Procesando el token escaneado. Si no ves cambios, vuelve a intentar con
          el mismo código.
        </Notice>
      ) : null}
    </form>
  );
}
