import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Sparkles, Trophy, Users } from "lucide-react";

import { GlassCard, NeonButton } from "@/components/glass";
import { hasRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const session = await requireSession();

  if (!hasRole(session.roles, "admin")) {
    redirect("/client");
  }

  const supabase = await createClient();
  const [{ count: clientCount }, { count: barberCount }, { count: serviceCount }, { count: openRaffles }] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("barbers").select("*", { count: "exact", head: true }),
      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("raffles")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
            Admin
          </span>
          <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
            Operación del tenant
          </h1>
        </div>
        <Link href="/admin/settings">
          <NeonButton>
            <Settings className="h-4 w-4" />
            Configurar tenant
          </NeonButton>
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Clientes" value={clientCount ?? 0} icon={Users} />
        <MetricCard label="Barberos" value={barberCount ?? 0} icon={Sparkles} />
        <MetricCard label="Servicios activos" value={serviceCount ?? 0} icon={Settings} />
        <MetricCard label="Sorteos abiertos" value={openRaffles ?? 0} icon={Trophy} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <QuickLink
          href="/admin/clients"
          title="Clientes"
          description="Ajusta puntos manualmente y revisa el estado de fidelidad."
        />
        <QuickLink
          href="/admin/services"
          title="Servicios"
          description="Activa o ajusta el catálogo usado por los barberos."
        />
        <QuickLink
          href="/admin/raffles"
          title="Sorteos"
          description="Crea sorteos, ejecuta el draw y revisa sus estados."
        />
        <QuickLink
          href="/admin/scan-prize"
          title="Validar premio"
          description="Escanea el QR del ganador para marcar la entrega."
        />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <GlassCard className="space-y-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-purple-primary)]/15 text-[color:var(--color-purple-vivid)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
        {label}
      </p>
      <p className="font-display text-4xl font-semibold text-[color:var(--color-text-primary)]">
        {value}
      </p>
    </GlassCard>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <GlassCard className="h-full space-y-2 transition-transform hover:-translate-y-0.5">
        <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {description}
        </p>
      </GlassCard>
    </Link>
  );
}
