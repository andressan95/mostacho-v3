-- ============================================================================
-- 0008_raffles.sql
-- Sorteos multi-tenant con elegibilidad por nivel.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'raffle_status') then
    create type public.raffle_status as enum (
      'draft', 'open', 'running', 'completed'
    );
  end if;
end$$;

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.raffle_status not null default 'draft',
  eligibility jsonb not null default '{}'::jsonb,
  prize_name text not null,
  prize_description text,
  winner_client_id uuid references public.clients(id) on delete set null,
  drawn_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raffles_ends_after_start check (ends_at > starts_at)
);

create index raffles_tenant_status_idx
  on public.raffles (tenant_id, status);

create index raffles_public_window_idx
  on public.raffles (status, ends_at desc);

alter table public.raffles enable row level security;

create policy "raffles_public_select" on public.raffles
  for select to anon
  using (status in ('open', 'completed'));

create policy "raffles_tenant_select" on public.raffles
  for select to authenticated
  using (tenant_id = private.current_tenant_id());

create policy "raffles_no_direct_writes_ins" on public.raffles
  for insert to authenticated with check (false);
create policy "raffles_no_direct_writes_upd" on public.raffles
  for update to authenticated using (false);
create policy "raffles_no_direct_writes_del" on public.raffles
  for delete to authenticated using (false);

create trigger raffles_set_updated_at
  before update on public.raffles
  for each row execute function private.set_updated_at();
