-- ============================================================================
-- 0006_rpcs_visits.sql
-- RPCs de visitas: create_visit y redeem_visit_token (atómica, row-level lock).
-- También incluye RPCs de servicios para el admin.
-- ============================================================================

-- ── Helper: generar token random ─────────────────────────────────────────────
create or replace function private.gen_token()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select encode(gen_random_bytes(32), 'base64url');
$$;

-- ── Helper: calcular multiplicador del nivel del cliente ──────────────────────
create or replace function private.loyalty_multiplier(c_id uuid, t_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select (
        (private.get_tenant_config(t_id, 'loyalty') -> 'level_multipliers')
        ->> c.loyalty_level::text
      )::numeric
      from public.clients c
      where c.id = c_id
    ),
    1.0
  );
$$;

-- ── RPC: rpc.create_visit ─────────────────────────────────────────────────────
-- Crea una visita pending y su QR token.
-- Parámetros:
--   p_services: [{ service_id uuid, qty int }]  -- jsonb array
--   p_client_id: uuid nullable (puede pre-asignarse; si es null, el cliente lo asocia al escanear)
-- Retorna: { visit_id, token, expires_at }
create or replace function rpc.create_visit(
  p_services  jsonb,
  p_client_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id          uuid := private.current_tenant_id();
  barber_rec    public.barbers;
  visit_id      uuid;
  token_str     text;
  ttl_seconds   int;
  exp_at        timestamptz;
  total_price   int := 0;
  svc           jsonb;
  svc_rec       public.services;
begin
  -- Solo barberos o admins pueden crear visitas.
  if not (private.has_role('barber') or private.has_role('admin')) then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  -- Obtener registro barber del caller.
  select b.* into barber_rec
  from public.barbers b
  where b.profile_id = private.current_profile_id()
    and b.tenant_id = t_id
    and b.active = true
  limit 1;

  if barber_rec.id is null then
    raise exception 'Barbero no encontrado o inactivo.' using errcode = 'PGRST';
  end if;

  -- Validar array de servicios.
  if jsonb_array_length(p_services) = 0 then
    raise exception 'Debes seleccionar al menos un servicio.' using errcode = 'PGRST';
  end if;

  -- Calcular precio total.
  for svc in select * from jsonb_array_elements(p_services)
  loop
    select * into svc_rec
    from public.services
    where id = (svc ->> 'service_id')::uuid
      and tenant_id = t_id
      and active = true;

    if svc_rec.id is null then
      raise exception 'Servicio no encontrado: %', svc ->> 'service_id' using errcode = 'PGRST';
    end if;

    total_price := total_price + svc_rec.price_cents * coalesce((svc ->> 'qty')::int, 1);
  end loop;

  -- Leer TTL desde config del tenant (default 600 s).
  ttl_seconds := coalesce(
    ((private.get_tenant_config(t_id, 'qr') ->> 'token_ttl_seconds'))::int,
    600
  );
  exp_at := now() + (ttl_seconds || ' seconds')::interval;

  -- Crear visita.
  insert into public.visits (tenant_id, barber_id, client_id, status, price_cents_total)
  values (t_id, barber_rec.id, p_client_id, 'pending', total_price)
  returning id into visit_id;

  -- Insertar líneas de detalle.
  for svc in select * from jsonb_array_elements(p_services)
  loop
    select * into svc_rec
    from public.services
    where id = (svc ->> 'service_id')::uuid and tenant_id = t_id;

    insert into public.visit_services (visit_id, service_id, qty, unit_price_cents)
    values (
      visit_id,
      svc_rec.id,
      coalesce((svc ->> 'qty')::int, 1),
      svc_rec.price_cents
    );
  end loop;

  -- Generar token QR.
  token_str := private.gen_token();

  insert into public.qr_tokens (tenant_id, kind, ref_id, token, expires_at)
  values (t_id, 'visit', visit_id, token_str, exp_at);

  -- Registrar en audit log.
  insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
  values (t_id, auth.uid(), 'create_visit', 'visits', visit_id,
    jsonb_build_object('services', p_services, 'price_cents_total', total_price));

  return jsonb_build_object(
    'visit_id',   visit_id,
    'token',      token_str,
    'expires_at', exp_at
  );
end;
$$;

grant execute on function rpc.create_visit(jsonb, uuid) to authenticated;

-- ── RPC: rpc.redeem_visit_token ───────────────────────────────────────────────
-- Atómica: valida token, asocia cliente, calcula puntos × multiplicador,
-- inserta ledger, confirma visita. Row-level lock en qr_tokens.
-- Retorna: { points_awarded, new_total, loyalty_level }
create or replace function rpc.redeem_visit_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id          uuid := private.current_tenant_id();
  token_rec     public.qr_tokens;
  visit_rec     public.visits;
  client_rec    public.clients;
  profile_id_v  uuid := private.current_profile_id();
  multiplier    numeric;
  base_pts      int := 0;
  awarded_pts   int;
  svc_row       record;
  -- anti-fraude
  recent_visit_count int;
  min_secs      int;
  max_per_day   int;
begin
  -- Solo clientes pueden canjear.
  if not private.has_role('client') then
    raise exception 'Solo clientes pueden canjear un QR.' using errcode = 'PGRST';
  end if;

  -- Obtener registro cliente.
  select c.* into client_rec
  from public.clients c
  where c.profile_id = profile_id_v
    and c.tenant_id = t_id
  limit 1;

  if client_rec.id is null then
    raise exception 'Perfil de cliente no encontrado.' using errcode = 'PGRST';
  end if;

  -- Bloquear token para evitar doble canje concurrente.
  select qt.* into token_rec
  from public.qr_tokens qt
  where qt.token = p_token
    and qt.tenant_id = t_id
    and qt.kind = 'visit'
  for update;

  if token_rec.id is null then
    raise exception 'QR no válido.' using errcode = 'PGRST';
  end if;

  if token_rec.used_at is not null then
    -- Registrar intento de doble canje.
    insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
    values (t_id, auth.uid(), 'redeem_visit_token_duplicate', 'qr_tokens', token_rec.id,
      jsonb_build_object('token', p_token, 'client_id', client_rec.id));
    raise exception 'Este QR ya fue utilizado.' using errcode = 'PGRST';
  end if;

  if token_rec.expires_at < now() then
    -- Registrar expiración.
    insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
    values (t_id, auth.uid(), 'redeem_visit_token_expired', 'qr_tokens', token_rec.id,
      jsonb_build_object('token', p_token, 'client_id', client_rec.id));
    raise exception 'El QR ha expirado.' using errcode = 'PGRST';
  end if;

  -- Cargar visita.
  select v.* into visit_rec
  from public.visits v
  where v.id = token_rec.ref_id and v.tenant_id = t_id;

  if visit_rec.id is null or visit_rec.status <> 'pending' then
    raise exception 'Visita no disponible para canje (estado: %).',
      coalesce(visit_rec.status::text, 'no encontrada') using errcode = 'PGRST';
  end if;

  -- ── Anti-fraude: rate-limit por cliente ──────────────────────────────────
  min_secs    := coalesce(
    ((private.get_tenant_config(t_id, 'antifraud') ->> 'min_seconds_between_visits'))::int,
    3600
  );
  max_per_day := coalesce(
    ((private.get_tenant_config(t_id, 'antifraud') ->> 'max_visits_per_day'))::int,
    3
  );

  -- Visitas confirmadas hoy.
  select count(*) into recent_visit_count
  from public.visits v
  where v.client_id = client_rec.id
    and v.status = 'confirmed'
    and v.confirmed_at >= now() - interval '24 hours';

  if recent_visit_count >= max_per_day then
    insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
    values (t_id, auth.uid(), 'redeem_visit_token_rate_limited', 'visits', visit_rec.id,
      jsonb_build_object('daily_count', recent_visit_count, 'max', max_per_day));
    raise exception 'Límite de visitas diarias alcanzado.' using errcode = 'PGRST';
  end if;

  -- Intervalo mínimo entre visitas.
  if client_rec.last_visit_at is not null and
     extract(epoch from (now() - client_rec.last_visit_at)) < min_secs then
    insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
    values (t_id, auth.uid(), 'redeem_visit_token_too_soon', 'visits', visit_rec.id,
      jsonb_build_object('last_visit_at', client_rec.last_visit_at, 'min_secs', min_secs));
    raise exception 'Demasiado pronto para otra visita. Espera un poco.' using errcode = 'PGRST';
  end if;

  -- ── Calcular puntos ──────────────────────────────────────────────────────
  -- Sumar base_points de todos los servicios de la visita.
  for svc_row in
    select s.base_points, vs.qty
    from public.visit_services vs
    join public.services s on s.id = vs.service_id
    where vs.visit_id = visit_rec.id
  loop
    base_pts := base_pts + svc_row.base_points * svc_row.qty;
  end loop;

  multiplier  := private.loyalty_multiplier(client_rec.id, t_id);
  awarded_pts := floor(base_pts * multiplier)::int;

  -- ── Confirmar: asociar cliente, marcar visita, token usado, insertar ledger ──
  update public.visits
  set client_id    = client_rec.id,
      status       = 'confirmed',
      points_awarded = awarded_pts,
      confirmed_at = now()
  where id = visit_rec.id;

  update public.qr_tokens
  set used_at = now(),
      used_by  = auth.uid()
  where id = token_rec.id;

  -- El trigger points_ledger_sync_client actualizará clients.points y loyalty_level.
  if awarded_pts > 0 then
    insert into public.points_ledger (tenant_id, client_id, delta, reason, source, source_id)
    values (t_id, client_rec.id, awarded_pts, 'Visita confirmada', 'visit', visit_rec.id);
  end if;

  -- Audit de éxito.
  insert into public.audit_log (tenant_id, actor_user_id, action, target_type, target_id, payload)
  values (t_id, auth.uid(), 'redeem_visit_token_ok', 'visits', visit_rec.id,
    jsonb_build_object('points_awarded', awarded_pts, 'client_id', client_rec.id));

  -- Recarga puntos actualizados.
  select c.points, c.loyalty_level into client_rec.points, client_rec.loyalty_level
  from public.clients c where c.id = client_rec.id;

  return jsonb_build_object(
    'points_awarded', awarded_pts,
    'new_total',      client_rec.points,
    'loyalty_level',  client_rec.loyalty_level
  );
end;
$$;

grant execute on function rpc.redeem_visit_token(text) to authenticated;

-- ── RPC: rpc.upsert_service ──────────────────────────────────────────────────
create or replace function rpc.upsert_service(
  p_id           uuid default null,
  p_name         text default '',
  p_duration_min int  default 30,
  p_base_points  int  default 0,
  p_price_cents  int  default 0,
  p_active       boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_id uuid := private.current_tenant_id();
  svc_id uuid;
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  if p_id is not null then
    update public.services
    set name = p_name, duration_min = p_duration_min,
        base_points = p_base_points, price_cents = p_price_cents,
        active = p_active, updated_at = now()
    where id = p_id and tenant_id = t_id
    returning id into svc_id;
  else
    insert into public.services (tenant_id, name, duration_min, base_points, price_cents, active)
    values (t_id, p_name, p_duration_min, p_base_points, p_price_cents, p_active)
    returning id into svc_id;
  end if;

  return svc_id;
end;
$$;

grant execute on function rpc.upsert_service(uuid, text, int, int, int, boolean) to authenticated;

-- ── RPC: rpc.archive_service ─────────────────────────────────────────────────
create or replace function rpc.archive_service(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  update public.services
  set active = false, updated_at = now()
  where id = p_id and tenant_id = private.current_tenant_id();
end;
$$;

grant execute on function rpc.archive_service(uuid) to authenticated;
