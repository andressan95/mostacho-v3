-- ============================================================================
-- 0007_push_subscriptions.sql
-- Web Push subscriptions por perfil.
-- ============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_profile_idx
  on public.push_subscriptions (profile_id);

create index push_subscriptions_tenant_idx
  on public.push_subscriptions (tenant_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_self_or_admin_select" on public.push_subscriptions
  for select to authenticated
  using (
    profile_id = private.current_profile_id()
    or (tenant_id = private.current_tenant_id() and private.has_role('admin'))
  );

create policy "push_subscriptions_no_direct_writes_ins" on public.push_subscriptions
  for insert to authenticated with check (false);
create policy "push_subscriptions_no_direct_writes_upd" on public.push_subscriptions
  for update to authenticated using (false);
create policy "push_subscriptions_no_direct_writes_del" on public.push_subscriptions
  for delete to authenticated using (false);
