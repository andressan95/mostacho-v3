"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, Keyboard, ScanLine, Type } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { normalizeQrToken } from "@/lib/domains/visits/tokens";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect(source: ImageBitmapSource): Promise<
          Array<{ rawValue?: string | null }>
        >;
      };
    };
  }
}

type ScannerMode = "camera" | "hid" | "manual";

type QrScannerProps = {
  title: string;
  description: string;
  onDetected: (token: string) => void;
};

const MODES: Array<{
  id: ScannerMode;
  label: string;
  icon: typeof Camera;
}> = [
  { id: "camera", label: "Cámara", icon: Camera },
  { id: "hid", label: "Lector HID", icon: Keyboard },
  { id: "manual", label: "Manual", icon: Type },
];

export function QrScanner({
  title,
  description,
  onDetected,
}: QrScannerProps) {
  const [mode, setMode] = useState<ScannerMode>("camera");
  const [manualValue, setManualValue] = useState("");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hidInputRef = useRef<HTMLInputElement | null>(null);

  const hasCameraSupport = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function",
    [],
  );

  function handleDetected(raw: string) {
    const token = normalizeQrToken(raw);
    if (!token) return;

    setManualValue(token);
    onDetected(token);
  }

  const handleDetectedFromEffect = useEffectEvent(handleDetected);

  useEffect(() => {
    if (mode === "hid") {
      hidInputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "camera" || !hasCameraSupport) {
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let intervalId: number | undefined;
    let stopZxing: (() => void) | undefined;

    async function startCamera() {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (disposed) return;

        videoElement.srcObject = stream;
        await videoElement.play();

        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: ["qr_code"],
          });

          intervalId = window.setInterval(async () => {
            if (!videoRef.current || disposed) return;

            try {
              const results = await detector.detect(videoRef.current);
              const value = results[0]?.rawValue ?? "";
              if (value) {
                handleDetectedFromEffect(value);
              }
            } catch {
              // El detector nativo falla con ciertos frames; seguimos escuchando.
            }
          }, 450);
        } else {
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoDevice(
            undefined,
            videoElement,
            (result) => {
              if (result) {
                handleDetectedFromEffect(result.getText());
              }
            },
          );

          stopZxing = () => {
            controls.stop();
          };
        }
      } catch (error) {
        setCameraMessage(
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la cámara.",
        );
      }
    }

    void startCamera();

    return () => {
      disposed = true;
      if (intervalId) window.clearInterval(intervalId);
      stopZxing?.();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [hasCameraSupport, mode]);

  return (
    <GlassCard variant="strong" className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1.5">
        {MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
              mode === id
                ? "bg-[color:var(--color-purple-primary)]/20 text-[color:var(--color-text-primary)]"
                : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === "camera" ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
            <video
              ref={videoRef}
              className="aspect-square w-full object-cover"
              muted
              playsInline
              autoPlay
            />
          </div>
          {cameraMessage ? <Notice tone="danger">{cameraMessage}</Notice> : null}
          {!hasCameraSupport ? (
            <Notice tone="info">
              Este navegador no expone cámara. Usa el lector HID o pega el código.
            </Notice>
          ) : null}
        </div>
      ) : null}

      {mode === "hid" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleDetected(manualValue);
          }}
          className="space-y-3"
        >
          <Input
            ref={hidInputRef}
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Escanea con tu lector y presiona Enter"
            label="Entrada del lector"
            leading={<ScanLine className="h-4 w-4" />}
          />
          <NeonButton type="submit" fullWidth>
            Validar código
          </NeonButton>
        </form>
      ) : null}

      {mode === "manual" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleDetected(manualValue);
          }}
          className="space-y-3"
        >
          <Input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Pega aquí el token del QR"
            label="Token manual"
            leading={<Type className="h-4 w-4" />}
          />
          <NeonButton type="submit" fullWidth>
            Canjear
          </NeonButton>
        </form>
      ) : null}
    </GlassCard>
  );
}
