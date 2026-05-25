create table if not exists pmo.onboardings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  nome          text not null,
  setor         text not null,
  lider         text,
  cargo         text not null,
  descricao     text,
  data_inicio   date not null,
  senioridade   text not null check (senioridade in ('estagio','junior','pleno','senior','especialista')),
  conteudo      jsonb not null default '{}'::jsonb,
  versao        int  not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists onboardings_owner_id_idx on pmo.onboardings(owner_id, updated_at desc);


alter table pmo.onboardings enable row level security;

drop policy if exists "onboardings owner select" on pmo.onboardings;
create policy "onboardings owner select" on pmo.onboardings
  for select using (auth.uid() = owner_id);

drop policy if exists "onboardings owner insert" on pmo.onboardings;
create policy "onboardings owner insert" on pmo.onboardings
  for insert with check (auth.uid() = owner_id);

drop policy if exists "onboardings owner update" on pmo.onboardings;
create policy "onboardings owner update" on pmo.onboardings
  for update using (auth.uid() = owner_id);

drop policy if exists "onboardings owner delete" on pmo.onboardings;
create policy "onboardings owner delete" on pmo.onboardings
  for delete using (auth.uid() = owner_id);
