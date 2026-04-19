import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Palette,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import { GlassCard } from "@/components/glass";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

const SECTIONS = [
  {
    href: "/admin/settings/business",
    title: "Negocio",
    description: "Nombre, slug, zona horaria, moneda y datos de contacto.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/admin/settings/branding",
    title: "Branding",
    description: "Colores y logo del tenant usados en la UI privada.",
    icon: Palette,
  },
  {
    href: "/admin/settings/loyalty",
    title: "Lealtad",
    description: "Thresholds y multiplicadores por nivel.",
    icon: Sparkles,
  },
  {
    href: "/admin/settings/antifraud",
    title: "Anti-fraude",
    description: "TTL del QR, intervalo mínimo y límite diario.",
    icon: ShieldCheck,
  },
  {
    href: "/admin/settings/raffles",
    title: "Sorteos",
    description: "Nivel mínimo por defecto y cierre automático.",
    icon: Trophy,
  },
  {
    href: "/admin/settings/notifications",
    title: "Notificaciones",
    description: "Toggles de Web Push y ventana de inactividad.",
    icon: Bell,
  },
];

export default async function AdminSettingsIndexPage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-2">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          Settings
        </span>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Configuración del tenant
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <GlassCard className="h-full space-y-3 transition-transform hover:-translate-y-0.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-purple-primary)]/15 text-[color:var(--color-purple-vivid)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
                  {title}
                </h2>
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  {description}
                </p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
