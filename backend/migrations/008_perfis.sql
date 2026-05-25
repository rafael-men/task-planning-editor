
create table if not exists pmo.perfis_usuario (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'lider' check (role in ('rh','lider')),
  setor_id   uuid references pmo.setores(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists perfis_setor_idx on pmo.perfis_usuario(setor_id);


create or replace function pmo.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = pmo, public
as $$
begin
  insert into pmo.perfis_usuario (user_id, role)
  values (new.id, 'lider')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function pmo.handle_novo_usuario();


insert into pmo.perfis_usuario (user_id, role)
select id, 'lider' from auth.users
on conflict (user_id) do nothing;


alter table pmo.perfis_usuario enable row level security;

drop policy if exists "perfis read self" on pmo.perfis_usuario;
create policy "perfis read self" on pmo.perfis_usuario
  for select using (auth.uid() = user_id);

drop policy if exists "perfis rh read all" on pmo.perfis_usuario;
create policy "perfis rh read all" on pmo.perfis_usuario
  for select using (
    exists (select 1 from pmo.perfis_usuario p
            where p.user_id = auth.uid() and p.role = 'rh')
  );

drop policy if exists "perfis rh write all" on pmo.perfis_usuario;
create policy "perfis rh write all" on pmo.perfis_usuario
  for update using (
    exists (select 1 from pmo.perfis_usuario p
            where p.user_id = auth.uid() and p.role = 'rh')
  );
