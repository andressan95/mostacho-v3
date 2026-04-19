# Mostacho v3

Plataforma de fidelización para barberías construida con Next.js 16, Supabase y una experiencia PWA mobile-first.

## Qué incluye hoy

- Auth SSR con Supabase: password, OTP y OAuth.
- Multi-tenant desde la base con `tenant_id`, RLS y RPCs `SECURITY DEFINER`.
- Flujo de visitas con QR efímero: creación por barbero y canje por cliente.
- Dashboard por rol: cliente, barbero y admin.
- Sorteos con draw manual, QR de premio y validación por admin.
- Módulo de settings por tenant: negocio, branding, loyalty, antifraud, raffles y push.
- PWA con Serwist, manifest, offline fallback y listeners de Web Push.

## Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4 + sistema visual glassmorphism
- Supabase Auth + Postgres + RLS + Edge Functions
- `@serwist/next` para PWA
- `qrcode`, `@zxing/browser` y `BarcodeDetector` para QR
- Vitest para pruebas unitarias

## Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Genera las claves VAPID con:

```bash
pnpm vapid:generate
```

## Scripts principales

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Rutas clave

- `/services`: catálogo público de servicios
- `/raffles`: sorteos públicos con refresco live
- `/client`: dashboard del cliente
- `/client/scan`: canje de QR por cámara, HID o input manual
- `/barber/new-visit`: creación de visita y QR efímero
- `/admin/services`: CRUD de servicios
- `/admin/raffles`: creación y draw de sorteos
- `/admin/settings/*`: configuración del tenant

## Estado del plan

El estado real del roadmap y el checklist activo viven en [PLAN.md](./PLAN.md).

## Pendientes externos

Todavía faltan tareas que dependen de infraestructura real:

- E2E completo con Supabase corriendo y cuentas seed reales
- Deploy Vercel + Supabase prod
- Pruebas manuales de Web Push en iOS/Android
- Automatización `pg_cron`/scheduler en cloud
