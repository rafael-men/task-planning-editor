create table if not exists public.onboardings (
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

create index if not exists onboardings_owner_id_idx on public.onboardings(owner_id, updated_at desc);


alter table public.onboardings enable row level security;

drop policy if exists "onboardings owner select" on public.onboardings;
create policy "onboardings owner select" on public.onboardings
  for select using (auth.uid() = owner_id);

drop policy if exists "onboardings owner insert" on public.onboardings;
create policy "onboardings owner insert" on public.onboardings
  for insert with check (auth.uid() = owner_id);

drop policy if exists "onboardings owner update" on public.onboardings;
create policy "onboardings owner update" on public.onboardings
  for update using (auth.uid() = owner_id);

drop policy if exists "onboardings owner delete" on public.onboardings;
create policy "onboardings owner delete" on public.onboardings
  for delete using (auth.uid() = owner_id);
