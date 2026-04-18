# Mostacho v3

Plataforma de fidelización para barberías construida con Next.js 16, Supabase y una experiencia PWA mobile-first.

## Estado actual

Esta base parte del avance ya aterrizado en `PLAN.md`:

- Sprint 0 completo: scaffold, diseño base glassmorphism, PWA, Supabase inicial y CI.
- Sprint 1 completo: auth SSR, roles, tenancy, perfil y layouts protegidos.
- Sprint 2 en progreso: servicios, visitas, QR, puntos y settings multi-tenant.

## Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4 + componentes UI custom
- Supabase Auth + Postgres + RLS + Edge Functions
- Serwist para PWA y Service Worker
- Vitest + Playwright para validación

## Scripts principales

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Próximo foco

El roadmap activo está en [PLAN.md](./PLAN.md). La prioridad inmediata es continuar Sprint 2: servicios, visitas, QR, ledger de puntos y pruebas de concurrencia.
