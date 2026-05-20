
alter table public.playbooks
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists playbooks_owner_id_idx on public.playbooks(owner_id);
alter table public.playbooks drop constraint if exists playbooks_nome_key;
create unique index if not exists playbooks_owner_nome_idx
  on public.playbooks(owner_id, nome);

alter table public.playbooks enable row level security;
alter table public.playbooks_historico enable row level security;

drop policy if exists "playbooks owner select" on public.playbooks;
create policy "playbooks owner select" on public.playbooks
  for select using (auth.uid() = owner_id);

drop policy if exists "playbooks owner insert" on public.playbooks;
create policy "playbooks owner insert" on public.playbooks
  for insert with check (auth.uid() = owner_id);

drop policy if exists "playbooks owner update" on public.playbooks;
create policy "playbooks owner update" on public.playbooks
  for update using (auth.uid() = owner_id);

drop policy if exists "playbooks owner delete" on public.playbooks;
create policy "playbooks owner delete" on public.playbooks
  for delete using (auth.uid() = owner_id);

drop policy if exists "historico owner select" on public.playbooks_historico;
create policy "historico owner select" on public.playbooks_historico
  for select using (
    exists (select 1 from public.playbooks p
            where p.id = playbook_id and p.owner_id = auth.uid())
  );