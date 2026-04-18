-- ============================================================================
-- 0001_init.sql
-- Fundaciones: tenants, roles, perfiles, helpers privados, RLS base.
-- ============================================================================

create extension if not exists "pgcrypto" with schema extensions;

-- ── Schemas ─────────────────────────────────────────────────────────────────
create schema if not exists private;
create schema if not exists rpc;

revoke all on schema private from public, anon, authenticated;
grant usage on schema rpc to anon, authenticated;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('client', 'barber', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'loyalty_level') then
    create type public.loyalty_level as enum ('bronze', 'silver', 'gold', 'diamond');
  end if;
end$$;

-- ── Tenants ─────────────────────────────────────────────────────────────────
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- El slug público se puede leer sin auth (para onboarding y landing).
create policy "tenants_public_select" on public.tenants
  for select to anon, authenticated
  using (true);

-- Escrituras solo vía RPC.
create policy "tenants_no_direct_writes_ins" on public.tenants
  for insert to authenticated with check (false);
create policy "tenants_no_direct_writes_upd" on public.tenants
  for update to authenticated using (false);
create policy "tenants_no_direct_writes_del" on public.tenants
  for delete to authenticated using (false);

-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  full_name text not null default '',
  phone text,
  phone_verified boolean not null default false,
  email text,
  avatar_url text,
  birthday date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index profiles_tenant_id_idx on public.profiles (tenant_id);

alter table public.profiles enable row level security;

-- ── Profile roles (multi-rol por tenant) ────────────────────────────────────
create table public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (profile_id, tenant_id, role)
);

create index profile_roles_profile_id_idx on public.profile_roles (profile_id);
create index profile_roles_tenant_role_idx on public.profile_roles (tenant_id, role);

alter table public.profile_roles enable row level security;

-- ── Helpers privados ────────────────────────────────────────────────────────
-- Tenant activo del caller, leído del JWT (cacheado por statement con subquery).
create or replace function private.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(
    (current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::uuid;
$$;

-- ¿El caller tiene `r` en el tenant activo?
create or replace function private.has_role(r public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles pr
    join public.profiles p on p.id = pr.profile_id
    where p.user_id = (select auth.uid())
      and pr.tenant_id = private.current_tenant_id()
      and pr.role = r
  );
$$;

-- Profile_id del caller en el tenant activo.
create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and p.tenant_id = private.current_tenant_id()
  limit 1;
$$;

-- ── Policies: profiles ──────────────────────────────────────────────────────
-- Ver tu propio perfil + admins pueden ver todos los del tenant.
create policy "profiles_self_or_admin_select" on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      tenant_id = private.current_tenant_id()
      and private.has_role('admin')
    )
  );

-- Update solo el propio perfil (full_name, phone, avatar, birthday).
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Insert/delete siempre vía RPC o trigger.
create policy "profiles_no_direct_ins" on public.profiles
  for insert to authenticated with check (false);
create policy "profiles_no_direct_del" on public.profiles
  for delete to authenticated using (false);

-- ── Policies: profile_roles ─────────────────────────────────────────────────
-- Ves los roles de tu tenant (para saber permisos UI); admin edita vía RPC.
create policy "profile_roles_tenant_select" on public.profile_roles
  for select to authenticated
  using (tenant_id = private.current_tenant_id());

create policy "profile_roles_no_direct_ins" on public.profile_roles
  for insert to authenticated with check (false);
create policy "profile_roles_no_direct_upd" on public.profile_roles
  for update to authenticated using (false);
create policy "profile_roles_no_direct_del" on public.profile_roles
  for delete to authenticated using (false);

-- ── Trigger: updated_at ─────────────────────────────────────────────────────
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ── Trigger: auto-provisión al crear auth.users ─────────────────────────────
-- Crea profile + asigna rol 'client'. El tenant_id sale de raw_user_meta_data.tenant_slug.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id uuid;
  new_profile_id uuid;
  tenant_slug_meta text;
begin
  tenant_slug_meta := new.raw_user_meta_data ->> 'tenant_slug';

  if tenant_slug_meta is null or tenant_slug_meta = '' then
    -- MVP: si no viene slug, usar el primer tenant creado (single-tenant bootstrap).
    select id into t_id from public.tenants order by created_at asc limit 1;
  else
    select id into t_id from public.tenants where slug = tenant_slug_meta;
  end if;

  if t_id is null then
    raise exception 'No se encontró un tenant válido (slug=%).', tenant_slug_meta;
  end if;

  insert into public.profiles (user_id, tenant_id, full_name, email)
  values (
    new.id,
    t_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  returning id into new_profile_id;

  insert into public.profile_roles (profile_id, tenant_id, role)
  values (new_profile_id, t_id, 'client');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
