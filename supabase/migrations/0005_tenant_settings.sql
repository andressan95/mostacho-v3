-- ============================================================================
-- 0005_tenant_settings.sql
-- Configuración por tenant: business, branding, loyalty, qr, antifraud,
-- raffles, push. Un trigger crea la fila con defaults al crear un tenant.
-- ============================================================================

create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  config    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tenant_settings enable row level security;

-- Admins leen y (vía RPC) modifican la configuración de su tenant.
create policy "tenant_settings_admin_select" on public.tenant_settings
  for select to authenticated
  using (tenant_id = private.current_tenant_id() and private.has_role('admin'));

-- Barberos y clientes pueden leer la config de su tenant (para loyalty thresholds, etc.)
create policy "tenant_settings_member_select" on public.tenant_settings
  for select to authenticated
  using (tenant_id = private.current_tenant_id());

create policy "tenant_settings_no_direct_writes_ins" on public.tenant_settings
  for insert to authenticated with check (false);
create policy "tenant_settings_no_direct_writes_upd" on public.tenant_settings
  for update to authenticated using (false);
create policy "tenant_settings_no_direct_writes_del" on public.tenant_settings
  for delete to authenticated using (false);

create trigger tenant_settings_set_updated_at
  before update on public.tenant_settings
  for each row execute function private.set_updated_at();

-- ── Trigger: crear tenant_settings con defaults al crear un tenant ───────────
create or replace function private.ensure_tenant_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_settings (tenant_id, config)
  values (
    new.id,
    jsonb_build_object(
      'business', jsonb_build_object(
        'name', new.name,
        'slug', new.slug,
        'timezone', 'America/Santiago',
        'currency', 'CLP'
      ),
      'branding', jsonb_build_object(
        'primary_hex', '#7C3AED',
        'accent_hex',  '#A78BFA',
        'logo_url',    null
      ),
      'loyalty', jsonb_build_object(
        'level_thresholds', jsonb_build_object(
          'silver',  100,
          'gold',    500,
          'diamond', 2000
        ),
        'level_multipliers', jsonb_build_object(
          'bronze',  1.0,
          'silver',  1.1,
          'gold',    1.25,
          'diamond', 1.5
        )
      ),
      'qr', jsonb_build_object(
        'token_ttl_seconds', 600
      ),
      'antifraud', jsonb_build_object(
        'min_seconds_between_visits', 3600,
        'max_visits_per_day', 3
      ),
      'raffles', jsonb_build_object(
        'default_min_level', 'silver',
        'auto_close_on_ends_at', true
      ),
      'push', jsonb_build_object(
        'notify_on_visit_confirm', true,
        'notify_on_raffle_win', true,
        'notify_on_inactivity_days', 30
      )
    )
  )
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

create trigger tenants_ensure_settings
  after insert on public.tenants
  for each row execute function private.ensure_tenant_settings();

-- ── RPC: rpc.update_tenant_settings ─────────────────────────────────────────
-- Shallow merge del patch en config. Solo admins del tenant.
create or replace function rpc.update_tenant_settings(patch jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id uuid := private.current_tenant_id();
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  update public.tenant_settings
  set config = config || patch,
      updated_at = now()
  where tenant_id = t_id;

  -- Registrar en audit log.
  insert into public.audit_log (tenant_id, actor_user_id, action, target_type, payload)
  values (t_id, auth.uid(), 'update_tenant_settings', 'tenant_settings', patch);
end;
$$;

grant execute on function rpc.update_tenant_settings(jsonb) to authenticated;

-- ── Helper: leer config del tenant con fallback a defaults ───────────────────
create or replace function private.get_tenant_config(t_id uuid, key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select config -> key from public.tenant_settings where tenant_id = t_id),
    '{}'::jsonb
  );
$$;
