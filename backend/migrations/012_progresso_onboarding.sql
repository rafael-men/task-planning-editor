alter table pmo.onboardings
  add column if not exists progresso jsonb not null default '{}'::jsonb;
create index if not exists onboardings_progresso_idx
  on pmo.onboardings using gin (progresso);
