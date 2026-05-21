
create table if not exists public.fornecedores (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  descricao   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.setores (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  nome        text not null,
  descricao   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.cargos (
  id          uuid primary key default gen_random_uuid(),
  setor_id    uuid not null references public.setores(id) on delete restrict,
  nome        text not null,
  descricao   text,
  created_at  timestamptz not null default now(),
  unique (setor_id, nome)
);

create index if not exists cargos_setor_idx on public.cargos(setor_id);

alter table public.fornecedores enable row level security;
alter table public.setores enable row level security;
alter table public.cargos enable row level security;

drop policy if exists "fornecedores read" on public.fornecedores;
create policy "fornecedores read" on public.fornecedores
  for select to authenticated using (true);

drop policy if exists "setores read" on public.setores;
create policy "setores read" on public.setores
  for select to authenticated using (true);

drop policy if exists "cargos read" on public.cargos;
create policy "cargos read" on public.cargos
  for select to authenticated using (true);

alter table public.onboardings
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null,
  add column if not exists setor_id      uuid references public.setores(id)      on delete set null,
  add column if not exists cargo_id      uuid references public.cargos(id)       on delete set null;

create index if not exists onboardings_fornecedor_idx on public.onboardings(fornecedor_id);
create index if not exists onboardings_setor_idx     on public.onboardings(setor_id);
create index if not exists onboardings_cargo_idx     on public.onboardings(cargo_id);



insert into public.fornecedores (nome, descricao) values
  ('Macfor', 'Equipe interna Macfor (contratação direta).'),
  ('Parceiro externo', 'Profissional terceirizado / freelancer alocado em projeto.')
on conflict (nome) do nothing;

insert into public.setores (slug, nome, descricao) values
  ('tecnologia', 'Tecnologia',  'Engenharia de software, dados e infra.'),
  ('design',     'Design',      'UI/UX, motion, identidade visual.'),
  ('social',     'Social',      'Mídias sociais, marketing de conteúdo, criação.'),
  ('vendas',     'Vendas',      'Comercial, SDR, account management.'),
  ('bi',         'BI/Dados',    'Business intelligence, analytics, data engineering.'),
  ('operacoes',  'Operações',   'RH, financeiro, administrativo, processos internos.')
on conflict (slug) do nothing;


insert into public.cargos (setor_id, nome, descricao)
select s.id, v.nome, v.descricao
from public.setores s
join (values

  ('tecnologia', 'Desenvolvedor(a) Backend',   'Construção de APIs, serviços e integrações.'),
  ('tecnologia', 'Desenvolvedor(a) Frontend',  'Interfaces web, SPAs, integrações com APIs.'),
  ('tecnologia', 'Desenvolvedor(a) Fullstack', 'Backend + frontend, com responsabilidade ponta a ponta.'),
  ('tecnologia', 'Engenheiro(a) de IA',        'Agentes RAG/LLM, pipelines de inferência, prompt engineering.'),
  ('tecnologia', 'Automação (n8n / RPA)',      'Automação de processos internos via low-code.'),
  ('tecnologia', 'DevOps / SRE',               'Infraestrutura, CI/CD, observabilidade.'),


  ('design', 'Designer UI/UX',           'Pesquisa, wireframes, telas e protótipos.'),
  ('design', 'Designer Gráfico',         'Identidade visual, artes para campanhas.'),
  ('design', 'Motion Designer',          'Animações para social, vídeos e UI motion.'),


  ('social', 'Social Media',             'Planejamento e execução de conteúdo em redes sociais.'),
  ('social', 'Redator(a) / Copywriter',  'Texto para social, blog, anúncios.'),
  ('social', 'Gestor(a) de Tráfego Pago','Campanhas de mídia paga (Meta, Google, TikTok).'),
  ('social', 'Editor(a) de Vídeo',       'Edição vertical para Reels/Shorts/TikTok.'),

 
  ('vendas', 'SDR / BDR',                 'Prospecção ativa, qualificação de leads.'),
  ('vendas', 'Executivo(a) de Vendas',    'Fechamento de contratos, follow-up, propostas.'),
  ('vendas', 'Customer Success',          'Pós-venda, retenção, expansão de conta.'),


  ('bi', 'Analista de BI',           'Dashboards, relatórios, modelagem analítica.'),
  ('bi', 'Engenheiro(a) de Dados',   'Pipelines, data warehouse, ETL/ELT.'),
  ('bi', 'Analista de Dados',        'Análise exploratória, SQL, storytelling com dados.'),

 
  ('operacoes', 'Analista de RH / People',     'Recrutamento, onboarding, cultura.'),
  ('operacoes', 'Analista Financeiro',         'Conciliações, fluxo de caixa, relatórios.'),
  ('operacoes', 'Coordenador(a) de Operações', 'Processos internos, gestão de projetos.')
) as v(setor_slug, nome, descricao)
  on s.slug = v.setor_slug
on conflict (setor_id, nome) do nothing;
