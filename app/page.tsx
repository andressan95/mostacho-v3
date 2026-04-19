import Link from "next/link";
import { GlassCard, NeonButton, PointsBadge, PurpleBlob } from "@/components/glass";
import { Scissors, Sparkles, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-10 sm:py-16">
      <PurpleBlob position="top-right" size="lg" intensity="strong" />
      <PurpleBlob position="bottom-left" size="md" intensity="soft" />

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-10 sm:max-w-2xl">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-vivid/30 bg-purple-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-purple-soft">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Programa de fidelidad
          </span>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-text-primary sm:text-6xl">
            Mostacho
          </h1>
          <p className="max-w-md text-balance text-lg text-text-secondary">
            Fidelidad que corta. Acumula puntos con cada visita, sube de nivel y gana premios exclusivos.
          </p>
        </header>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          <GlassCard className="flex flex-col items-start gap-2">
            <Scissors className="h-5 w-5 text-purple-vivid" aria-hidden />
            <h2 className="text-sm font-semibold text-text-primary">Escanea tu visita</h2>
            <p className="text-xs text-text-muted">Código QR seguro por cada servicio.</p>
          </GlassCard>
          <GlassCard className="flex flex-col items-start gap-2">
            <Sparkles className="h-5 w-5 text-purple-vivid" aria-hidden />
            <h2 className="text-sm font-semibold text-text-primary">Suma puntos</h2>
            <p className="text-xs text-text-muted">Multiplicadores al subir de nivel.</p>
          </GlassCard>
          <GlassCard className="flex flex-col items-start gap-2">
            <Trophy className="h-5 w-5 text-purple-vivid" aria-hidden />
            <h2 className="text-sm font-semibold text-text-primary">Gana sorteos</h2>
            <p className="text-xs text-text-muted">Premios reales cada mes.</p>
          </GlassCard>
        </div>

        <GlassCard variant="strong" className="flex w-full flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Niveles de fidelidad
          </h3>
          <div className="flex flex-wrap gap-2">
            <PointsBadge level="bronze" points={0} />
            <PointsBadge level="silver" points={100} />
            <PointsBadge level="gold" points={500} />
            <PointsBadge level="diamond" points={2000} />
          </div>
        </GlassCard>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link href="/auth/sign-in" className="w-full">
            <NeonButton fullWidth size="lg">
              Iniciar sesión
            </NeonButton>
          </Link>
          <Link href="/raffles" className="w-full">
            <NeonButton variant="ghost" fullWidth size="lg">
              Ver sorteos activos
            </NeonButton>
          </Link>
        </div>

        <Link
          href="/services"
          className="text-sm text-[color:var(--color-purple-vivid)] transition-opacity hover:opacity-85"
        >
          Ver servicios y puntos por corte
        </Link>
      </section>
    </main>
  );
}
