import { GlassCard, PurpleBlob } from "@/components/glass";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      <PurpleBlob position="top-right" size="md" intensity="soft" />
      <GlassCard className="relative z-10 flex max-w-sm flex-col items-center gap-4 text-center">
        <WifiOff className="h-10 w-10 text-purple-vivid" aria-hidden />
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Sin conexión
        </h1>
        <p className="text-sm text-text-secondary">
          No detectamos internet ahora mismo. Vuelve a intentarlo cuando recuperes la señal — tu última navegación sigue disponible.
        </p>
      </GlassCard>
    </main>
  );
}
