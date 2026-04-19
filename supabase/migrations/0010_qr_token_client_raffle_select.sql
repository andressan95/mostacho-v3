-- ============================================================================
-- 0010_qr_token_client_raffle_select.sql
-- Permite que el cliente ganador vea su QR de premio.
-- ============================================================================

create policy "qr_tokens_client_prize_select" on public.qr_tokens
  for select to authenticated
  using (
    kind = 'raffle_prize'
    and tenant_id = private.current_tenant_id()
    and exists (
      select 1
      from public.raffles r
      join public.clients c on c.id = r.winner_client_id
      where r.id = ref_id
        and c.profile_id = private.current_profile_id()
    )
  );
