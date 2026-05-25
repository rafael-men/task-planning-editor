alter table pmo.playbooks
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists playbooks_owner_id_idx on pmo.playbooks(owner_id);
alter table pmo.playbooks drop constraint if exists playbooks_nome_key;
create unique index if not exists playbooks_owner_nome_idx
  on pmo.playbooks(owner_id, nome);

alter table pmo.playbooks enable row level security;
alter table pmo.playbooks_historico enable row level security;

drop policy if exists "playbooks owner select" on pmo.playbooks;
create policy "playbooks owner select" on pmo.playbooks
  for select using (auth.uid() = owner_id);

drop policy if exists "playbooks owner insert" on pmo.playbooks;
create policy "playbooks owner insert" on pmo.playbooks
  for insert with check (auth.uid() = owner_id);

drop policy if exists "playbooks owner update" on pmo.playbooks;
create policy "playbooks owner update" on pmo.playbooks
  for update using (auth.uid() = owner_id);

drop policy if exists "playbooks owner delete" on pmo.playbooks;
create policy "playbooks owner delete" on pmo.playbooks
  for delete using (auth.uid() = owner_id);

drop policy if exists "historico owner select" on pmo.playbooks_historico;
create policy "historico owner select" on pmo.playbooks_historico
  for select using (
    exists (select 1 from pmo.playbooks p
            where p.id = playbook_id and p.owner_id = auth.uid())
  );
