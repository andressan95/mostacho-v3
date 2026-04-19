-- ============================================================================
-- 0009_rpcs_raffles_push.sql
-- RPCs faltantes: push, puntos admin y sorteos.
-- ============================================================================

create or replace function rpc.upsert_push_subscription(
  p_endpoint text,
  p_keys jsonb,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_id_v uuid := private.current_profile_id();
  tenant_id_v uuid := private.current_tenant_id();
  subscription_id uuid;
begin
  if profile_id_v is null or tenant_id_v is null then
    raise exception 'Sesión inválida para registrar la suscripción.'
      using errcode = 'PGRST';
  end if;

  insert into public.push_subscriptions (
    profile_id,
    tenant_id,
    endpoint,
    keys,
    user_agent
  )
  values (
    profile_id_v,
    tenant_id_v,
    p_endpoint,
    p_keys,
    p_user_agent
  )
  on conflict (endpoint) do update
    set profile_id = excluded.profile_id,
        tenant_id = excluded.tenant_id,
        keys = excluded.keys,
        user_agent = excluded.user_agent
  returning id into subscription_id;

  insert into public.audit_log (
    tenant_id, actor_user_id, action, target_type, target_id, payload
  )
  values (
    tenant_id_v,
    auth.uid(),
    'upsert_push_subscription',
    'push_subscriptions',
    subscription_id,
    jsonb_build_object('endpoint', p_endpoint)
  );

  return subscription_id;
end;
$$;

grant execute on function rpc.upsert_push_subscription(text, jsonb, text) to authenticated;

create or replace function rpc.adjust_points(
  p_client_id uuid,
  p_delta int,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant_id_v uuid := private.current_tenant_id();
  new_total int;
  new_level public.loyalty_level;
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  insert into public.points_ledger (
    tenant_id,
    client_id,
    delta,
    reason,
    source
  )
  values (
    tenant_id_v,
    p_client_id,
    p_delta,
    coalesce(nullif(trim(p_reason), ''), 'Ajuste manual'),
    'admin_adjust'
  );

  select points, loyalty_level
    into new_total, new_level
  from public.clients
  where id = p_client_id;

  insert into public.audit_log (
    tenant_id, actor_user_id, action, target_type, target_id, payload
  )
  values (
    tenant_id_v,
    auth.uid(),
    'adjust_points',
    'clients',
    p_client_id,
    jsonb_build_object('delta', p_delta, 'reason', p_reason)
  );

  return jsonb_build_object(
    'client_id', p_client_id,
    'points', new_total,
    'loyalty_level', new_level
  );
end;
$$;

grant execute on function rpc.adjust_points(uuid, int, text) to authenticated;

create or replace function rpc.create_raffle(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  raffle_id uuid;
  tenant_id_v uuid := private.current_tenant_id();
  status_v public.raffle_status;
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  status_v := coalesce((payload ->> 'status')::public.raffle_status, 'open');

  insert into public.raffles (
    tenant_id,
    name,
    description,
    starts_at,
    ends_at,
    status,
    eligibility,
    prize_name,
    prize_description
  )
  values (
    tenant_id_v,
    trim(payload ->> 'name'),
    nullif(trim(payload ->> 'description'), ''),
    (payload ->> 'starts_at')::timestamptz,
    (payload ->> 'ends_at')::timestamptz,
    status_v,
    coalesce(payload -> 'eligibility', '{}'::jsonb),
    trim(payload ->> 'prize_name'),
    nullif(trim(payload ->> 'prize_description'), '')
  )
  returning id into raffle_id;

  insert into public.audit_log (
    tenant_id, actor_user_id, action, target_type, target_id, payload
  )
  values (
    tenant_id_v,
    auth.uid(),
    'create_raffle',
    'raffles',
    raffle_id,
    payload
  );

  return raffle_id;
end;
$$;

grant execute on function rpc.create_raffle(jsonb) to authenticated;

create or replace function rpc.draw_raffle(p_raffle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant_id_v uuid := private.current_tenant_id();
  raffle_rec public.raffles;
  winner_client_id_v uuid;
  min_level_v public.loyalty_level;
  token_v text;
  expires_at_v timestamptz;
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  select *
    into raffle_rec
  from public.raffles
  where id = p_raffle_id
    and tenant_id = tenant_id_v
  for update;

  if raffle_rec.id is null then
    raise exception 'Sorteo no encontrado.' using errcode = 'PGRST';
  end if;

  if raffle_rec.status = 'completed' and raffle_rec.winner_client_id is not null then
    raise exception 'Este sorteo ya tiene ganador.' using errcode = 'PGRST';
  end if;

  min_level_v := coalesce(
    (raffle_rec.eligibility ->> 'min_level')::public.loyalty_level,
    (
      (private.get_tenant_config(tenant_id_v, 'raffles') ->> 'default_min_level')
    )::public.loyalty_level,
    'silver'::public.loyalty_level
  );

  select c.id
    into winner_client_id_v
  from public.clients c
  where c.tenant_id = tenant_id_v
    and c.loyalty_level >= min_level_v
  order by random()
  limit 1;

  if winner_client_id_v is null then
    raise exception 'No hay clientes elegibles para este sorteo.'
      using errcode = 'PGRST';
  end if;

  update public.raffles
  set
    status = 'completed',
    winner_client_id = winner_client_id_v,
    drawn_at = now(),
    updated_at = now()
  where id = raffle_rec.id;

  token_v := private.gen_token();
  expires_at_v := now() + interval '7 days';

  insert into public.qr_tokens (
    tenant_id,
    kind,
    ref_id,
    token,
    expires_at
  )
  values (
    tenant_id_v,
    'raffle_prize',
    raffle_rec.id,
    token_v,
    expires_at_v
  );

  insert into public.audit_log (
    tenant_id, actor_user_id, action, target_type, target_id, payload
  )
  values (
    tenant_id_v,
    auth.uid(),
    'draw_raffle',
    'raffles',
    raffle_rec.id,
    jsonb_build_object(
      'winner_client_id', winner_client_id_v,
      'min_level', min_level_v,
      'expires_at', expires_at_v
    )
  );

  return jsonb_build_object(
    'raffle_id', raffle_rec.id,
    'winner_client_id', winner_client_id_v,
    'token', token_v,
    'expires_at', expires_at_v
  );
end;
$$;

grant execute on function rpc.draw_raffle(uuid) to authenticated;

create or replace function rpc.redeem_prize_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant_id_v uuid := private.current_tenant_id();
  token_rec public.qr_tokens;
  raffle_rec public.raffles;
begin
  if not private.has_role('admin') then
    raise exception 'Permiso denegado.' using errcode = 'PGRST';
  end if;

  select *
    into token_rec
  from public.qr_tokens
  where token = p_token
    and tenant_id = tenant_id_v
    and kind = 'raffle_prize'
  for update;

  if token_rec.id is null then
    raise exception 'QR de premio no válido.' using errcode = 'PGRST';
  end if;

  if token_rec.used_at is not null then
    raise exception 'Este premio ya fue marcado como entregado.'
      using errcode = 'PGRST';
  end if;

  if token_rec.expires_at < now() then
    raise exception 'El QR de premio expiró.' using errcode = 'PGRST';
  end if;

  select *
    into raffle_rec
  from public.raffles
  where id = token_rec.ref_id
    and tenant_id = tenant_id_v;

  if raffle_rec.id is null then
    raise exception 'Sorteo asociado no encontrado.' using errcode = 'PGRST';
  end if;

  update public.qr_tokens
  set used_at = now(),
      used_by = auth.uid()
  where id = token_rec.id;

  update public.raffles
  set delivered_at = now(),
      updated_at = now()
  where id = raffle_rec.id;

  insert into public.audit_log (
    tenant_id, actor_user_id, action, target_type, target_id, payload
  )
  values (
    tenant_id_v,
    auth.uid(),
    'redeem_prize_token',
    'raffles',
    raffle_rec.id,
    jsonb_build_object('token_id', token_rec.id)
  );

  return jsonb_build_object(
    'raffle_id', raffle_rec.id,
    'winner_client_id', raffle_rec.winner_client_id,
    'prize_name', raffle_rec.prize_name,
    'delivered_at', now()
  );
end;
$$;

grant execute on function rpc.redeem_prize_token(text) to authenticated;

create or replace function rpc.close_due_raffles()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count int;
begin
  update public.raffles
  set status = 'completed',
      updated_at = now()
  where status = 'open'
    and ends_at <= now()
    and coalesce(
      ((private.get_tenant_config(tenant_id, 'raffles') ->> 'auto_close_on_ends_at'))::boolean,
      true
    ) = true;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function rpc.close_due_raffles() to service_role;
