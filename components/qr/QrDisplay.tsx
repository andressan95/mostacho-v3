"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { GlassCard } from "@/components/glass";

type QrDisplayProps = {
  value: string;
  title?: string;
  description?: string;
};

export function QrDisplay({
  value,
  title = "Código QR",
  description,
}: QrDisplayProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(value, {
      margin: 1,
      width: 320,
      color: {
        dark: "#F5F3FF",
        light: "#08060F",
      },
    }).then((nextDataUrl) => {
      if (active) setDataUrl(nextDataUrl);
    });

    return () => {
      active = false;
    };
  }, [value]);

  return (
    <GlassCard variant="strong" className="flex flex-col items-center gap-4">
      <div className="space-y-1 text-center">
        <h3 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[color:var(--color-bg-base)] p-4 shadow-[0_0_40px_rgba(124,58,237,0.15)]">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="Código QR"
            className="h-64 w-64 rounded-2xl object-contain"
          />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-2xl bg-white/5" />
        )}
      </div>

      <code className="max-w-full rounded-full bg-white/5 px-4 py-2 text-center text-xs text-[color:var(--color-text-secondary)]">
        {value}
      </code>
    </GlassCard>
  );
}
