# Plan — Mostacho: Plataforma de Fidelización para Barberías

> Documento vivo. El checklist de la sección **Tracking** refleja el estado real del proyecto.
> Repo remoto: <https://github.com/andressan95/mostacho-v3>

---

## 1. Contexto

**Qué estamos construyendo.** Una PWA multi-tenant de fidelización para barberías. Tres roles (cliente, barbero, administrador); un usuario puede combinar varios. Flujo principal: el barbero registra un servicio y genera un QR efímero, el cliente autenticado lo escanea, se valida atómicamente en backend y se le asignan puntos. Se acumulan puntos → nivel (bronze/silver/gold/diamond) → elegibilidad a sorteos. El ganador recibe un QR de canje que el admin valida al entregar el premio.

**Decisiones arquitectónicas.**

- **Multi-tenant desde día 1** — `tenant_id` en todas las tablas + RLS.
- **Token de QR aleatorio en DB + single-use** — revocable, auditable, atómico con `SELECT ... FOR UPDATE`.
- **Vercel + Supabase Cloud** — free tier alcanza el MVP.
- **Puntos fijos por servicio + multiplicadores** — transparente para el cliente, configurable por admin.
- **Sorteos automáticos por elegibilidad** — menor fricción que opt-in.
- **Glassmorphism oscuro (negro + morado)** — mobile-first, Web Push.

**Alcance del MVP.** Fase 1 + PWA instalable + Web Push + sorteos básicos.
Fuera de MVP (Fase 2/3): recomendaciones, referidos, promos automatizadas, analítica avanzada, detección heurística de fraude, OTP por SMS/WhatsApp.

---

## 2. Arquitectura

```
┌──────────────────────────────┐      ┌─────────────────────────────┐
│  Next.js 16 App Router (PWA) │      │  Supabase Cloud             │
│  ─────────────────────────── │      │  ─────────────────────────  │
│  • Rutas públicas (/, /raffles)     │      │  • Postgres (RLS, RPC)      │
│  • /auth (sign-in/sign-up)   │◄────►│  • Auth (password/OTP/OAuth)│
│  • /(app)/client/*           │ JWT  │  • Realtime (sorteos live)  │
│  • /(app)/barber/*           │      │  • Storage (avatars, QR)    │
│  • /(app)/admin/*            │      │  • Edge Functions (push)    │
│  • Server Actions            │      │  • pg_cron (sorteos, decay) │
│  • Service Worker (push, SW) │      └─────────────────────────────┘
└──────────────────────────────┘                   ▲
         ▲                                         │
         └─── Edge Function `send-push` ───────────┘
```

**Principios.**

- Todas las escrituras por RPC `SECURITY DEFINER` (evita race conditions).
- RLS por `tenant_id` con `(select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)`.
- Dominios separados: `loyalty`, `raffles`, `antifraud`, `visits`, `settings`.
- Server Actions para mutaciones; `createBrowserClient` solo para Realtime y lecturas efímeras.

---

## 3. Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, React 19) + TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| State | RSC + `@tanstack/react-query`, Zustand para UI local |
| Forms | `react-hook-form` + `zod` |
| Backend | Supabase (Postgres 15, Auth, Realtime, Storage, Edge Functions, pg_cron) |
| Auth | password, email OTP, OAuth Google/Facebook/Apple (gratis) |
| SDK | `@supabase/ssr` |
| PWA | `@serwist/next` v9 + `app/manifest.ts` |
| Push | `web-push` + VAPID + `push_subscriptions` |
| QR generar | `qrcode` (PNG/dataURL server-side) |
| QR escanear | `BarcodeDetector` + `@zxing/browser` + lector HID + pegar manual |
| Deploy | Vercel + Supabase Cloud |
| CI | GitHub Actions (lint, typecheck, migración dry-run) |
| Tests | Vitest (unit + RPC contract), Playwright (e2e) |

---

## 4. Diseño — Glassmorphism Dark Purple

Fondo negro profundo con blobs morados difusos; capas traslúcidas con `backdrop-filter: blur(20px)`; acentos neón sólo en CTAs críticos.

- Paleta: `--bg-base #08060F`, `--purple-primary #7C3AED`, `--purple-vivid #A78BFA`, `--text-primary #F5F3FF`.
- Tipografía: `Inter` (UI) + `Space Grotesk` (headings) — `next/font/google`.
- Componentes: `GlassCard`, `PurpleBlob`, `NeonButton`, `PointsBadge`.
- Mobile-first 375 px; `BottomNav` floating `bottom-4 left-4 right-4`.
- A11y: contraste ≥ 4.5:1, focus rings visibles, `prefers-reduced-motion`, touch ≥ 44×44 px, sin emojis como iconos.

---

## 5. Modelo de datos (Postgres)

Todas las tablas (excepto `tenants` y `push_subscriptions`) llevan `tenant_id uuid not null references tenants(id)`. PK `id uuid default gen_random_uuid()`.

```
tenants              (id, name, slug, settings jsonb, created_at)
profiles             (id, user_id fk auth.users, tenant_id, full_name,
                      phone text E.164 (unique por tenant), phone_verified bool,
                      email, avatar_url, birthday)
profile_roles        (id, profile_id, tenant_id, role enum('client','barber','admin'))

clients              (id, profile_id unique, tenant_id, points int, loyalty_level enum,
                      joined_at, last_visit_at)
barbers              (id, profile_id unique, tenant_id, bio, active bool)

services             (id, tenant_id, name, duration_min, base_points, price_cents, active)

visits               (id, tenant_id, client_id, barber_id,
                      status enum('pending','confirmed','expired','cancelled'),
                      price_cents_total, points_awarded, created_at, confirmed_at)
visit_services       (visit_id, service_id, qty, unit_price_cents)

qr_tokens            (id, tenant_id, kind enum('visit','raffle_prize'),
                      ref_id, token unique, expires_at, used_at, used_by)

points_ledger        (id, tenant_id, client_id, delta, reason,
                      source enum('visit','raffle','admin_adjust','decay'),
                      source_id, created_at)

raffles              (id, tenant_id, name, description, starts_at, ends_at,
                      status enum('draft','open','running','completed'),
                      eligibility jsonb, prize_name, prize_description,
                      winner_client_id, drawn_at, delivered_at)

push_subscriptions   (id, profile_id, tenant_id, endpoint, keys jsonb, ua)

tenant_settings      (tenant_id pk, config jsonb)  -- business/branding/loyalty/qr/
                                                   -- antifraud/raffles/push

audit_log            (id, tenant_id, actor_user_id, action, target_type, target_id,
                      payload jsonb, created_at)
```

**Invariantes.**

- `clients.points` == `SUM(points_ledger.delta)` — enforced por trigger.
- `qr_tokens.used_at` se setea una única vez (CHECK + `UPDATE ... WHERE used_at IS NULL`).
- `visits.status='confirmed'` requiere `confirmed_at` y entrada ligada en `points_ledger`.

---

## 6. RPCs

Todas `SECURITY DEFINER`, `SET search_path = ''`, verifican rol vía `private.has_role()`.

| RPC | Caller | Acción |
|-----|--------|--------|
| `rpc.create_visit(services, client_id?)` | barber | Crea visita pending + `qr_tokens` (TTL config), devuelve `{visit_id, token}` |
| `rpc.redeem_visit_token(token)` | client | `SELECT FOR UPDATE`, calcula puntos × multiplicador, inserta `points_ledger`, confirma visita y token |
| `rpc.create_raffle(payload)` | admin | Insert draft/open |
| `rpc.draw_raffle(id)` | admin/cron | Selección random sobre `eligibility`, QR premio 7 días, dispara realtime |
| `rpc.redeem_prize_token(token)` | admin | Marca `delivered_at` |
| `rpc.adjust_points(client_id, delta, reason)` | admin | `points_ledger source='admin_adjust'` |
| `rpc.upsert_push_subscription(endpoint, keys, ua)` | auth | Idempotente por endpoint |
| `rpc.update_tenant_settings(patch)` | admin | Shallow merge en `config` + audit |
| `rpc.upsert_service(payload)` / `rpc.archive_service(id)` | admin | CRUD |

**Anti-fraude MVP.** TTL del QR en settings, rate-limit por cliente, todo canje (éxito/fallo) en `audit_log`.

**Concurrencia.** Token único (32 bytes) + row-level lock + `UPDATE ... WHERE used_at IS NULL`. Soporta N barberos/canjes simultáneos sin colisión.

---

## 7. Seguridad

**Auth multi-método** en `/auth/sign-in`:

1. Email + password.
2. Email OTP (magic link o 6 dígitos).
3. OAuth Google / Facebook / Apple — gratuitos.
4. Phone E.164 como **dato obligatorio de perfil** tras signup (`/complete-profile`). OTP SMS/WhatsApp diferido.

Trigger `handle_new_user` crea profile + `profile_roles.role='client'` y resuelve `tenant_id` desde `raw_user_meta_data.tenant_slug`.

Una Edge Function (`on-auth-user-created`) escribe `app_metadata.tenant_id` y `roles` en el JWT.

**RLS.** Policies genéricas `tenant_isolation_*` por tabla; escrituras sólo vía RPC (`with check (false)` en INSERT/UPDATE/DELETE directos). Lecturas públicas `anon` explícitas para raffles activos, services activos y campos públicos de tenants.

---

## 8. PWA + Push

- Manifest en [`app/manifest.ts`](app/manifest.ts); iconos SVG en `public/` (reemplazar por PNG antes de prod).
- Service Worker con Serwist: precache shell, NetworkFirst para APIs, listeners `push` + `notificationclick`.
- VAPID vía `pnpm vapid:generate`; `push_subscriptions` upsert por endpoint.
- Edge Function `send-push`: `{profile_ids, title, body, url}` → envía con firma VAPID.
- Triggers: confirmación de visita → push al barbero; ganador de sorteo → push al cliente; inactividad (cron) → push al cliente.
- iOS 16.4+ requiere PWA instalada en home screen: UI educativa.

---

## 9. Estructura de directorios

```
mostacho/
├─ app/
│  ├─ (public)/                     # sin auth
│  ├─ auth/                         # sign-in, sign-up, callback, complete-profile
│  ├─ (app)/                        # autenticado (client/barber/admin)
│  │  └─ admin/settings/            # módulo de configuración UI (Sprint 5)
│  ├─ manifest.ts · sw.ts · globals.css · layout.tsx
├─ components/{ui,glass,qr,providers}/
├─ lib/
│  ├─ supabase/{server,browser,admin}.ts
│  ├─ domains/{loyalty,raffles,antifraud,visits,settings}/
│  ├─ push/ · utils/
├─ supabase/
│  ├─ migrations/   seed.sql
│  └─ functions/{send-push,draw-raffle-cron,on-auth-user-created}/
├─ tests/{unit,rpc,e2e}/
├─ .github/workflows/ci.yml
└─ PLAN.md
```

---

## 10. Roadmap — Sprints

Cada sprint ≈ 1 semana.

### Sprint 0 — Scaffold
`create-next-app` + TS strict + Tailwind v4 + glassmorphism base + PWA (Serwist/manifest) + Supabase (config + migración 0001) + CI.

### Sprint 1 — Auth + Tenancy + Roles
`@supabase/ssr`; providers (password/OTP/OAuth); `handle_new_user`; Edge Function para JWT metadata; `/complete-profile`; RLS base; layouts + BottomNav + redirects por rol.

### Sprint 2 — Servicios + Visitas + QR
Migraciones `services/visits/visit_services/qr_tokens/points_ledger/tenant_settings`; RPC `create_visit`/`redeem_visit_token`; pantalla barbero 3 pasos; scanner triple (cámara/HID/pegar); test de 20 canjes paralelos.

### Sprint 3 — PWA + Push
VAPID + `push_subscriptions`; Edge Function `send-push`; triggers en canje y draw; UI educativa iOS.

### Sprint 4 — Sorteos
Migraciones `raffles`; RPCs crear/sortear/canjear; admin UI + página pública con Realtime; `pg_cron` de cierre.

### Sprint 5 — Admin Settings (config por UI)
`/admin/settings/{business,branding,loyalty,antifraud,raffles,notifications}`; CRUD services; audit log.

### Sprint 6 — Pulido + E2E + Deploy
Skeletons, estados vacíos, `prefers-reduced-motion`, Playwright golden path, `@axe-core/playwright`, deploy Vercel + Supabase prod.

---

## 11. Verificación

**Local antes de cada PR.** `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e` · `pnpm build`.

**PWA manual.** Install a home screen Android + iOS 16.4+, activar push, probar offline.

**Flujo QR multi-dispositivo.** 3 barberos crean visitas en paralelo, 3 clientes escanean simultáneamente — todos confirman <1 s y sin interferencia.

**Doble canje.** El segundo intento de un token ya usado devuelve error claro; `audit_log` registra ambos intentos.

**Seguridad.** Cliente del tenant A no ve visitas del tenant B; `INSERT` directo denegado; tokens no expuestos por policy de select salvo al dueño.

---

## 12. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| iOS Web Push requiere install | UI educativa + deep link |
| `backdrop-filter` en gama baja | `@supports` fallback sólido |
| Lector HID en campos de texto | Input HID invisible sólo en rutas `/scan` |
| OAuth necesita dominios verificados | README con callbacks Supabase |
| `pg_cron` falla silencioso | Edge Function alternativa + health check |

---

## 13. Tracking de actividades

Checklist vivo. Cada ítem se marca al completarse.

### Sprint 0 — Scaffold · Completado

- [x] 0.1 Entorno verificado (Node, pnpm) y repo inicializado
- [x] 0.2 `create-next-app` Next 16 + TS strict + Tailwind v4
- [x] 0.3 Dependencias del stack instaladas
- [x] 0.4 Tokens glassmorphism en `globals.css` (`@theme`, `@utility glass-panel`)
- [x] 0.5 Componentes glass base: `GlassCard`, `PurpleBlob`, `NeonButton`, `PointsBadge`
- [x] 0.6 PWA: Serwist SW, `manifest.ts`, iconos SVG, `/offline`
- [x] 0.7 Supabase: `config.toml`, migración `0001_init` (tenants/profiles/profile_roles + RLS + trigger), seed `mostacho-demo`
- [x] 0.8 GitHub Actions CI (lint + typecheck + migración dry-run)
- [x] 0.9 Verificación local: `pnpm typecheck` · `pnpm lint` · `pnpm build` pasan

### Sprint 1 — Auth + Tenancy + Roles

- [x] 1.1 Clientes Supabase SSR: `lib/supabase/{server,browser,admin}.ts` + `middleware.ts`
- [x] 1.2 Server Actions de auth (`sign-in`, `sign-up`, `sign-out`, `send-otp`, `verify-otp`, `oauth`)
- [x] 1.3 Pantallas `/auth/sign-in` y `/auth/sign-up` (password + OTP + botones OAuth) + `/auth/callback/route.ts`
- [x] 1.4 Edge Function `sync-app-metadata` — setea `app_metadata.tenant_id` / `tenant_slug` / `roles`
- [x] 1.5 Migración `0002_auth_hook`: extiende `handle_new_user`, trigger re-sync, RLS afinada por rol
- [x] 1.6 Pantalla `/auth/complete-profile` — captura teléfono E.164 (`libphonenumber-js`)
- [x] 1.7 Layouts `(app)` con AppShell + BottomNav + pages `/client` `/barber` `/admin` (redirect por rol)
- [x] 1.8 Pantalla `/(app)/client/profile` con edición (nombre, teléfono, cumpleaños)
- [x] 1.9 Tests unit de helpers de rol (`lib/auth/roles.ts`) — 11/11 pasan
- [x] 1.10 Verificación: `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` pasan

### Sprint 2 — Servicios + Visitas + QR

- [ ] 2.1 Migración `0003_services_visits` (tablas + triggers + índices)
- [ ] 2.2 Migración `0004_points_qr_ledger` (`qr_tokens`, `points_ledger`, trigger a `clients`)
- [ ] 2.3 Migración `0005_tenant_settings` (config jsonb + defaults por trigger)
- [ ] 2.4 RPC `rpc.create_visit` + test contract
- [ ] 2.5 RPC `rpc.redeem_visit_token` atómica + test contract + test de concurrencia (20 paralelos)
- [ ] 2.6 Pantalla `/(app)/barber/new-visit` 3 pasos + auto-refresh on confirm
- [ ] 2.7 Scanner cliente `/(app)/client/scan`: cámara (`BarcodeDetector` + `@zxing`), HID, pegar
- [ ] 2.8 Pantalla `/(app)/client/history` con visitas confirmadas
- [ ] 2.9 Cálculo de `loyalty_level` leyendo thresholds desde `tenant_settings`

### Sprint 3 — PWA + Push

- [ ] 3.1 Generar VAPID y documentar en README
- [ ] 3.2 Migración `0006_push_subscriptions` + RPC upsert
- [ ] 3.3 `lib/push/subscribe.ts` + Server Action de suscripción
- [ ] 3.4 Edge Function `send-push` (Deno)
- [ ] 3.5 Triggers: canje confirmado (barbero) + ganador sorteo (cliente) + inactividad (cron)
- [ ] 3.6 UI educativa para install PWA en iOS 16.4+

### Sprint 4 — Sorteos

- [ ] 4.1 Migración `0007_raffles` (tabla + estado + eligibility jsonb)
- [ ] 4.2 RPCs `create_raffle` / `draw_raffle` / `redeem_prize_token`
- [ ] 4.3 Admin UI `/(app)/admin/raffles`
- [ ] 4.4 Pública `/raffles` con Supabase Realtime
- [ ] 4.5 QR premio + `/(app)/admin/scan-prize`
- [ ] 4.6 `pg_cron` de cierre automático

### Sprint 5 — Admin Settings (UI)

- [ ] 5.1 `/(app)/admin/settings/business`
- [ ] 5.2 `/(app)/admin/settings/branding` (colores + logo + inyección CSS vars)
- [ ] 5.3 `/(app)/admin/settings/loyalty` (thresholds + multiplicadores)
- [ ] 5.4 `/(app)/admin/settings/antifraud` (TTL + límites)
- [ ] 5.5 `/(app)/admin/settings/raffles` (defaults elegibilidad)
- [ ] 5.6 `/(app)/admin/settings/notifications` (toggles push)
- [ ] 5.7 `/(app)/admin/services` CRUD
- [ ] 5.8 Audit log con actor + diff en cada cambio

### Sprint 6 — Pulido + E2E + Deploy

- [ ] 6.1 Loading skeletons glass en todas las rutas
- [ ] 6.2 Estados vacíos ilustrados
- [ ] 6.3 Compliance `prefers-reduced-motion`
- [ ] 6.4 Playwright golden path completo
- [ ] 6.5 `@axe-core/playwright` audit
- [ ] 6.6 Deploy Vercel prod + Supabase prod
- [ ] 6.7 Prueba push real en iOS 16.4+

---

## 14. Fuera del MVP (Fase 2/3)

Recomendaciones, referidos, promos automatizadas por cumpleaños/inactividad, dashboard analytics para barberos, detección heurística de fraude, i18n, onboarding self-service multi-tenant, **OTP por SMS/WhatsApp** (Twilio/WhatsApp Business API, pago).

