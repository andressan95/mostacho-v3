-- ============================================================================
-- 0004_points_qr_ledger.sql
-- QR tokens de un solo uso y ledger de puntos con trigger a clients.
-- ============================================================================

-- ── Enums adicionales ────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'qr_token_kind') then
    create type public.qr_token_kind as enum ('visit', 'raffle_prize');
  end if;
  if not exists (select 1 from pg_type where typname = 'ledger_source') then
    create type public.ledger_source as enum (
      'visit', 'raffle', 'admin_adjust', 'decay'
    );
  end if;
end$$;

-- ── QR Tokens ────────────────────────────────────────────────────────────────
-- Token de un solo uso: se setea used_at exactamente una vez.
create table public.qr_tokens (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  kind       public.qr_token_kind not null,
  ref_id     uuid not null,           -- visit_id o raffle_winner_id
  token      text not null unique,    -- 32 bytes random base64url
  expires_at timestamptz not null,
  used_at    timestamptz,
  used_by    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index qr_tokens_token_idx on public.qr_tokens (token);
create index qr_tokens_tenant_idx on public.qr_tokens (tenant_id);
create index qr_tokens_ref_id_idx on public.qr_tokens (ref_id);

alter table public.qr_tokens enable row level security;

-- Solo el barbero (creator vía RPC) y admins del tenant ven sus tokens.
-- El cliente NO necesita SELECT directo; la RPC redeem lee con SECURITY DEFINER.
create policy "qr_tokens_barber_admin_select" on public.qr_tokens
  for select to authenticated
  using (
    tenant_id = private.current_tenant_id()
    and (private.has_role('barber') or private.has_role('admin'))
  );

create policy "qr_tokens_no_direct_writes_ins" on public.qr_tokens
  for insert to authenticated with check (false);
create policy "qr_tokens_no_direct_writes_upd" on public.qr_tokens
  for update to authenticated using (false);
create policy "qr_tokens_no_direct_writes_del" on public.qr_tokens
  for delete to authenticated using (false);

-- ── Points Ledger ────────────────────────────────────────────────────────────
-- Única fuente de verdad. clients.points es derivado (trigger).
create table public.points_ledger (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  delta     int not null,    -- positivo o negativo
  reason    text not null default '',
  source    public.ledger_source not null,
  source_id uuid,            -- visit_id / raffle_id / etc.
  created_at timestamptz not null default now()
);

create index points_ledger_client_id_idx on public.points_ledger (client_id);
create index points_ledger_tenant_id_idx on public.points_ledger (tenant_id);
create index points_ledger_source_idx on public.points_ledger (source, source_id);

alter table public.points_ledger enable row level security;

-- Cliente ve su propio ledger; admin ve todo el tenant.
create policy "points_ledger_client_select" on public.points_ledger
  for select to authenticated
  using (
    client_id = (
      select c.id from public.clients c where c.profile_id = private.current_profile_id() limit 1
    )
    or (tenant_id = private.current_tenant_id() and private.has_role('admin'))
  );

create policy "points_ledger_no_direct_writes_ins" on public.points_ledger
  for insert to authenticated with check (false);
create policy "points_ledger_no_direct_writes_upd" on public.points_ledger
  for update to authenticated using (false);
create policy "points_ledger_no_direct_writes_del" on public.points_ledger
  for delete to authenticated using (false);

-- ── Trigger: mantener clients.points + loyalty_level sincronizados ───────────
-- Se ejecuta después de cada INSERT en points_ledger.
-- loyalty_level se recalcula con thresholds hardcoded aquí como defaults;
-- en Sprint 5 se leerá de tenant_settings cuando existan.
create or replace function private.sync_client_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_points int;
  new_level  public.loyalty_level;
begin
  -- Sumar todo el ledger del cliente (fuente de verdad).
  select coalesce(sum(delta), 0)
  into new_points
  from public.points_ledger
  where client_id = new.client_id;

  -- Asegurar no negativos.
  new_points := greatest(new_points, 0);

  -- Calcular nivel con thresholds por defecto (se sobreescribirán desde tenant_settings en Sprint 5).
  new_level := case
    when new_points >= 2000 then 'diamond'::public.loyalty_level
    when new_points >= 500  then 'gold'::public.loyalty_level
    when new_points >= 100  then 'silver'::public.loyalty_level
    else 'bronze'::public.loyalty_level
  end;

  update public.clients
  set
    points        = new_points,
    loyalty_level = new_level,
    last_visit_at = case when new.source = 'visit' then now() else last_visit_at end,
    updated_at    = now()
  where id = new.client_id;

  return new;
end;
$$;

create trigger points_ledger_sync_client
  after insert on public.points_ledger
  for each row execute function private.sync_client_points();

-- ── Audit log ────────────────────────────────────────────────────────────────
create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action        text not null,
  target_type   text,
  target_id     uuid,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create index audit_log_tenant_idx on public.audit_log (tenant_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id);

alter table public.audit_log enable row level security;

-- Solo admins del tenant pueden leer el audit log.
create policy "audit_log_admin_select" on public.audit_log
  for select to authenticated
  using (tenant_id = private.current_tenant_id() and private.has_role('admin'));

create policy "audit_log_no_direct_writes_ins" on public.audit_log
  for insert to authenticated with check (false);
create policy "audit_log_no_direct_writes_upd" on public.audit_log
  for update to authenticated using (false);
create policy "audit_log_no_direct_writes_del" on public.audit_log
  for delete to authenticated using (false);
