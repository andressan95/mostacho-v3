-- ============================================================================
-- 0003_services_visits.sql
-- Barberos, servicios, visitas y tabla intermedia visit_services.
-- ============================================================================

-- ── Enums adicionales ────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'visit_status') then
    create type public.visit_status as enum (
      'pending', 'confirmed', 'expired', 'cancelled'
    );
  end if;
end$$;

-- ── Barbers ─────────────────────────────────────────────────────────────────
create table public.barbers (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  bio        text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index barbers_tenant_id_idx on public.barbers (tenant_id);

alter table public.barbers enable row level security;

create policy "barbers_tenant_select" on public.barbers
  for select to authenticated
  using (tenant_id = private.current_tenant_id());

create policy "barbers_anon_select" on public.barbers
  for select to anon
  using (active = true);

create policy "barbers_no_direct_writes_ins" on public.barbers
  for insert to authenticated with check (false);
create policy "barbers_no_direct_writes_upd" on public.barbers
  for update to authenticated using (false);
create policy "barbers_no_direct_writes_del" on public.barbers
  for delete to authenticated using (false);

create trigger barbers_set_updated_at
  before update on public.barbers
  for each row execute function private.set_updated_at();

-- ── Clients ─────────────────────────────────────────────────────────────────
create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null unique references public.profiles(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  points         int not null default 0 check (points >= 0),
  loyalty_level  public.loyalty_level not null default 'bronze',
  joined_at      timestamptz default now(),
  last_visit_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index clients_tenant_id_idx on public.clients (tenant_id);
create index clients_loyalty_level_idx on public.clients (tenant_id, loyalty_level);

alter table public.clients enable row level security;

-- Cada cliente ve su propio registro; barberos/admins ven todos del tenant.
create policy "clients_self_select" on public.clients
  for select to authenticated
  using (
    profile_id = private.current_profile_id()
    or (tenant_id = private.current_tenant_id() and (private.has_role('barber') or private.has_role('admin')))
  );

create policy "clients_no_direct_writes_ins" on public.clients
  for insert to authenticated with check (false);
create policy "clients_no_direct_writes_upd" on public.clients
  for update to authenticated using (false);
create policy "clients_no_direct_writes_del" on public.clients
  for delete to authenticated using (false);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function private.set_updated_at();

-- ── Services ─────────────────────────────────────────────────────────────────
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  duration_min int not null default 30 check (duration_min > 0),
  base_points  int not null default 0 check (base_points >= 0),
  price_cents  int not null default 0 check (price_cents >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index services_tenant_active_idx on public.services (tenant_id, active);

alter table public.services enable row level security;

-- Servicios activos visibles para anon (landing pública); todos para autenticados del tenant.
create policy "services_anon_select" on public.services
  for select to anon
  using (active = true);

create policy "services_tenant_select" on public.services
  for select to authenticated
  using (tenant_id = private.current_tenant_id());

create policy "services_no_direct_writes_ins" on public.services
  for insert to authenticated with check (false);
create policy "services_no_direct_writes_upd" on public.services
  for update to authenticated using (false);
create policy "services_no_direct_writes_del" on public.services
  for delete to authenticated using (false);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function private.set_updated_at();

-- ── Visits ───────────────────────────────────────────────────────────────────
create table public.visits (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  barber_id        uuid not null references public.barbers(id) on delete restrict,
  status           public.visit_status not null default 'pending',
  price_cents_total int not null default 0 check (price_cents_total >= 0),
  points_awarded   int not null default 0 check (points_awarded >= 0),
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  -- Invariante: confirmed implica confirmed_at set (verificado en RPC, no constraint defer)
  constraint visits_confirmed_has_timestamp check (
    status <> 'confirmed' or confirmed_at is not null
  )
);

create index visits_tenant_id_idx on public.visits (tenant_id);
create index visits_barber_id_idx on public.visits (barber_id);
create index visits_client_id_idx on public.visits (client_id);
create index visits_tenant_status_idx on public.visits (tenant_id, status);

alter table public.visits enable row level security;

-- Cliente ve sus propias visitas; barbero ve las que creó; admin todas del tenant.
create policy "visits_client_select" on public.visits
  for select to authenticated
  using (
    (client_id is not null and client_id = (
      select c.id from public.clients c where c.profile_id = private.current_profile_id() limit 1
    ))
    or (barber_id = (
      select b.id from public.barbers b where b.profile_id = private.current_profile_id() limit 1
    ))
    or (tenant_id = private.current_tenant_id() and private.has_role('admin'))
  );

create policy "visits_no_direct_writes_ins" on public.visits
  for insert to authenticated with check (false);
create policy "visits_no_direct_writes_upd" on public.visits
  for update to authenticated using (false);
create policy "visits_no_direct_writes_del" on public.visits
  for delete to authenticated using (false);

-- ── Visit services (línea de detalle) ───────────────────────────────────────
create table public.visit_services (
  visit_id        uuid not null references public.visits(id) on delete cascade,
  service_id      uuid not null references public.services(id) on delete restrict,
  qty             int not null default 1 check (qty > 0),
  unit_price_cents int not null default 0 check (unit_price_cents >= 0),
  primary key (visit_id, service_id)
);

create index visit_services_visit_id_idx on public.visit_services (visit_id);

alter table public.visit_services enable row level security;

create policy "visit_services_select" on public.visit_services
  for select to authenticated
  using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id
        and (
          (v.client_id = (
            select c.id from public.clients c where c.profile_id = private.current_profile_id() limit 1
          ))
          or (v.barber_id = (
            select b.id from public.barbers b where b.profile_id = private.current_profile_id() limit 1
          ))
          or (v.tenant_id = private.current_tenant_id() and private.has_role('admin'))
        )
    )
  );

create policy "visit_services_no_direct_writes_ins" on public.visit_services
  for insert to authenticated with check (false);
create policy "visit_services_no_direct_writes_upd" on public.visit_services
  for update to authenticated using (false);
create policy "visit_services_no_direct_writes_del" on public.visit_services
  for delete to authenticated using (false);

-- ── Trigger: auto-crear clients al crear profile_roles con role='client' ────
create or replace function private.ensure_client_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'client' then
    insert into public.clients (profile_id, tenant_id)
    values (new.profile_id, new.tenant_id)
    on conflict (profile_id) do nothing;
  end if;
  if new.role = 'barber' then
    insert into public.barbers (profile_id, tenant_id)
    values (new.profile_id, new.tenant_id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profile_roles_ensure_domain_record
  after insert on public.profile_roles
  for each row execute function private.ensure_client_record();
