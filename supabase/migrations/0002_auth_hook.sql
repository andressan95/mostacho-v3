-- ============================================================================
-- 0002_auth_hook.sql
-- Extiende handle_new_user() para setear app_metadata.{tenant_id, tenant_slug, roles}
-- en auth.users, de modo que el JWT ya trae estos claims desde la primera sesión.
-- Añade helper para re-sincronizar metadata cuando cambian roles.
-- Refina RLS por rol (admin/barber/client).
-- ============================================================================

-- ── Helper: refresca app_metadata desde profiles + profile_roles ─────────────
create or replace function private.sync_app_metadata(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_tenant_id uuid;
  v_tenant_slug text;
  v_roles text[];
begin
  select p.id, p.tenant_id, t.slug
    into v_profile_id, v_tenant_id, v_tenant_slug
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.user_id = p_user_id;

  if v_profile_id is null then
    return;
  end if;

  select coalesce(array_agg(pr.role::text order by pr.role), '{}')
    into v_roles
  from public.profile_roles pr
  where pr.profile_id = v_profile_id;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
           'tenant_id', v_tenant_id,
           'tenant_slug', v_tenant_slug,
           'roles', to_jsonb(v_roles)
         )
  where id = p_user_id;
end;
$$;

revoke all on function private.sync_app_metadata(uuid) from public, anon, authenticated;

-- ── Extiende handle_new_user() para sincronizar app_metadata ─────────────────
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

  -- Sincroniza app_metadata para que el JWT traiga tenant_id + roles.
  perform private.sync_app_metadata(new.id);

  return new;
end;
$$;

-- ── Re-sync automático cuando cambian roles ─────────────────────────────────
create or replace function private.on_profile_roles_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_profile uuid;
begin
  v_profile := coalesce(new.profile_id, old.profile_id);

  select user_id into v_user_id
  from public.profiles
  where id = v_profile;

  if v_user_id is not null then
    perform private.sync_app_metadata(v_user_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists profile_roles_sync_metadata on public.profile_roles;
create trigger profile_roles_sync_metadata
  after insert or update or delete on public.profile_roles
  for each row execute function private.on_profile_roles_change();

-- ── RLS refinada por rol en profiles ────────────────────────────────────────
-- (ya existe profiles_self_or_admin_select — no se altera)

-- El barbero ve perfiles del tenant (para listarlos al buscar cliente),
-- pero solo lectura; admin ya tiene acceso total vía la policy existente.
drop policy if exists "profiles_barber_tenant_select" on public.profiles;
create policy "profiles_barber_tenant_select" on public.profiles
  for select to authenticated
  using (
    tenant_id = private.current_tenant_id()
    and private.has_role('barber')
  );

-- ── Índice útil para la función sync ────────────────────────────────────────
create index if not exists profile_roles_by_profile_idx
  on public.profile_roles (profile_id);
