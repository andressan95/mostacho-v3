-- Seed mínimo: un tenant "mostacho-demo" para bootstrap local.
insert into public.tenants (name, slug, settings)
values (
  'Mostacho Demo',
  'mostacho-demo',
  '{
    "business": {
      "timezone": "America/Santiago",
      "currency": "CLP"
    },
    "loyalty": {
      "level_thresholds": {"silver": 100, "gold": 500, "diamond": 2000},
      "level_multipliers": {"bronze": 1, "silver": 1.1, "gold": 1.25, "diamond": 1.5}
    },
    "qr": {"token_ttl_seconds": 600},
    "antifraud": {"min_seconds_between_visits": 3600, "max_visits_per_day": 3},
    "raffles": {"default_min_level": "silver", "auto_close_on_ends_at": true},
    "push": {
      "notify_on_visit_confirm": true,
      "notify_on_raffle_win": true,
      "notify_on_inactivity_days": 30
    }
  }'::jsonb
)
on conflict (slug) do nothing;
