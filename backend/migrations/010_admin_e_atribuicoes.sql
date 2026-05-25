
alter table pmo.perfis_usuario
  drop constraint if exists perfis_usuario_role_check;
alter table pmo.perfis_usuario
  add constraint perfis_usuario_role_check
  check (role in ('admin','rh','lider'));


create unique index if not exists perfis_admin_singleton_idx
  on pmo.perfis_usuario((1)) where role = 'admin';


create table if not exists pmo.onboarding_atribuicoes (
  onboarding_id  uuid not null references pmo.onboardings(id) on delete cascade,
  lider_user_id  uuid not null references auth.users(id)       on delete cascade,
  atribuido_por  uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  primary key (onboarding_id, lider_user_id)
);

create index if not exists onboarding_atribuicoes_lider_idx
  on pmo.onboarding_atribuicoes(lider_user_id);


alter table pmo.onboarding_atribuicoes enable row level security;

drop policy if exists "atribuicoes lider ve suas" on pmo.onboarding_atribuicoes;
create policy "atribuicoes lider ve suas" on pmo.onboarding_atribuicoes
  for select using (auth.uid() = lider_user_id);

drop policy if exists "atribuicoes rh+ veem todas" on pmo.onboarding_atribuicoes;
create policy "atribuicoes rh+ veem todas" on pmo.onboarding_atribuicoes
  for select using (
    exists (select 1 from pmo.perfis_usuario p
             where p.user_id = auth.uid() and p.role in ('admin','rh'))
  );

drop policy if exists "atribuicoes rh+ escrevem" on pmo.onboarding_atribuicoes;
create policy "atribuicoes rh+ escrevem" on pmo.onboarding_atribuicoes
  for all using (
    exists (select 1 from pmo.perfis_usuario p
             where p.user_id = auth.uid() and p.role in ('admin','rh'))
  );


drop policy if exists "perfis rh write all" on pmo.perfis_usuario;

drop policy if exists "perfis admin write all" on pmo.perfis_usuario;
create policy "perfis admin write all" on pmo.perfis_usuario
  for update using (
    exists (select 1 from pmo.perfis_usuario p
             where p.user_id = auth.uid() and p.role = 'admin')
  );


drop policy if exists "perfis rh read all" on pmo.perfis_usuario;
drop policy if exists "perfis rh+ read all" on pmo.perfis_usuario;
create policy "perfis rh+ read all" on pmo.perfis_usuario
  for select using (
    exists (select 1 from pmo.perfis_usuario p
             where p.user_id = auth.uid() and p.role in ('admin','rh'))
  );
