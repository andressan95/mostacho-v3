"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Scan,
  Clock,
  UserRound,
  Scissors,
  Trophy,
  Users,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/supabase/database.types";

type NavItem = { href: string; label: string; icon: LucideIcon };

const ITEMS_BY_ROLE: Record<AppRole, NavItem[]> = {
  client: [
    { href: "/client", label: "Inicio", icon: LayoutDashboard },
    { href: "/client/scan", label: "Escanear", icon: Scan },
    { href: "/client/history", label: "Historial", icon: Clock },
    { href: "/client/profile", label: "Perfil", icon: UserRound },
  ],
  barber: [
    { href: "/barber", label: "Hoy", icon: LayoutDashboard },
    { href: "/barber/new-visit", label: "Nueva", icon: Scissors },
    { href: "/barber/visits", label: "Visitas", icon: Clock },
  ],
  admin: [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/clients", label: "Clientes", icon: Users },
    { href: "/admin/raffles", label: "Sorteos", icon: Trophy },
    { href: "/admin/settings", label: "Ajustes", icon: Settings },
  ],
};

export function BottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = ITEMS_BY_ROLE[role];

  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-0"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-full border border-[color:var(--color-glass-border)] bg-[color:var(--color-glass-bg)] p-1.5 backdrop-blur-xl shadow-[0_8px_32px_rgba(124,58,237,0.18)]">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-[color:var(--color-purple-primary)]/20 text-[color:var(--color-text-primary)]"
                  : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
