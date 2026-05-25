create extension if not exists pgcrypto;


create schema if not exists pmo;

create table if not exists pmo.playbooks (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  descricao   text,
  conteudo    jsonb not null default '{}'::jsonb,
  versao      int  not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists pmo.playbooks_historico (
  id           uuid primary key default gen_random_uuid(),
  playbook_id  uuid not null references pmo.playbooks(id) on delete cascade,
  conteudo     jsonb not null,
  versao       int  not null,
  prompt       text,
  created_at   timestamptz not null default now()
);

create index if not exists playbooks_historico_playbook_id_idx
  on pmo.playbooks_historico(playbook_id, versao desc);
