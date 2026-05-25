
create table if not exists pmo.ferramenta_alocacoes (
  id              uuid primary key default gen_random_uuid(),
  ferramenta_id   uuid not null references pmo.ferramentas(id) on delete cascade,
  escopo          text not null check (escopo in ('fornecedor','setor','cargo','senioridade')),
  alvo_id         uuid,  
  alvo_slug       text,    
  obrigatoriedade text not null default 'obrigatoria'
                  check (obrigatoriedade in ('obrigatoria','sugerida')),
  created_at      timestamptz not null default now()
);

create index if not exists ferramenta_alocacoes_lookup
  on pmo.ferramenta_alocacoes(escopo, alvo_id, alvo_slug);
create index if not exists ferramenta_alocacoes_ferramenta_idx
  on pmo.ferramenta_alocacoes(ferramenta_id);

create table if not exists pmo.curso_alocacoes (
  id              uuid primary key default gen_random_uuid(),
  curso_id        uuid not null references pmo.cursos(id) on delete cascade,
  escopo          text not null check (escopo in ('fornecedor','setor','cargo','senioridade')),
  alvo_id         uuid,
  alvo_slug       text,
  obrigatoriedade text not null default 'obrigatoria'
                  check (obrigatoriedade in ('obrigatoria','sugerida')),
  created_at      timestamptz not null default now()
);

create index if not exists curso_alocacoes_lookup
  on pmo.curso_alocacoes(escopo, alvo_id, alvo_slug);
create index if not exists curso_alocacoes_curso_idx
  on pmo.curso_alocacoes(curso_id);

alter table pmo.ferramenta_alocacoes enable row level security;
alter table pmo.curso_alocacoes enable row level security;

drop policy if exists "ferramenta_alocacoes read" on pmo.ferramenta_alocacoes;
create policy "ferramenta_alocacoes read" on pmo.ferramenta_alocacoes
  for select to authenticated using (true);

drop policy if exists "curso_alocacoes read" on pmo.curso_alocacoes;
create policy "curso_alocacoes read" on pmo.curso_alocacoes
  for select to authenticated using (true);



insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
select f.id, 'setor', s.id, 'obrigatoria'
from pmo.ferramentas f
cross join lateral unnest(f.setores) as fs(slug)
join pmo.setores s on s.slug = fs.slug
on conflict do nothing;

insert into pmo.curso_alocacoes (curso_id, escopo, alvo_id, obrigatoriedade)
select c.id, 'setor', s.id, 'sugerida'
from pmo.cursos c
cross join lateral unnest(c.setores) as cs(slug)
join pmo.setores s on s.slug = cs.slug
on conflict do nothing;


insert into pmo.ferramentas (nome, descricao, setores, nivel_minimo) values
  ('Runrunit', 'Gestão de tarefas e cronograma usada por todos os times da Macfor.', '{}', 'estagio'),
  ('Cultura Macfor', 'Manual de cultura, valores, processos e rituais internos.', '{}', 'estagio'),
  ('Hyperlink CRM', 'CRM interno da Macfor para acompanhamento de clientes e contas.', '{}', 'junior')
on conflict (nome) do nothing;


insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
select f.id, 'fornecedor', fo.id, 'obrigatoria'
from pmo.ferramentas f
join pmo.fornecedores fo on fo.nome = 'Macfor'
where f.nome in ('Runrunit', 'Cultura Macfor', 'Google Workspace', 'Slack', 'Notion')
on conflict do nothing;

insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
select f.id, 'fornecedor', fo.id, 'sugerida'
from pmo.ferramentas f
join pmo.fornecedores fo on fo.nome = 'Macfor'
where f.nome = 'Hyperlink CRM'
on conflict do nothing;



insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
select f.id, 'cargo', c.id, 'obrigatoria'
from (values
  ('Desenvolvedor(a) Backend',   'Nest.js'),
  ('Desenvolvedor(a) Backend',   'API Rest'),
  ('Desenvolvedor(a) Backend',   'PostgreSQL'),
  ('Desenvolvedor(a) Backend',   'Git e GitHub'),
  ('Desenvolvedor(a) Backend',   'Docker'),
  ('Desenvolvedor(a) Frontend',  'React.js'),
  ('Desenvolvedor(a) Frontend',  'Git e GitHub'),
  ('Desenvolvedor(a) Fullstack', 'Nest.js'),
  ('Desenvolvedor(a) Fullstack', 'React.js'),
  ('Desenvolvedor(a) Fullstack', 'PostgreSQL'),
  ('Desenvolvedor(a) Fullstack', 'Git e GitHub'),
  ('Engenheiro(a) de IA',        'Agentes RAG e LLM'),
  ('Engenheiro(a) de IA',        'API Rest'),
  ('Engenheiro(a) de IA',        'Git e GitHub'),
  ('Automação (n8n / RPA)',      'n8n'),
  ('Automação (n8n / RPA)',      'API Rest'),
  ('DevOps / SRE',               'Docker'),
  ('DevOps / SRE',               'PostgreSQL'),
  ('DevOps / SRE',               'Git e GitHub'),
  ('Designer UI/UX',     'Figma'),
  ('Designer Gráfico',   'Adobe Illustrator'),
  ('Designer Gráfico',   'Adobe Photoshop'),
  ('Motion Designer',    'Adobe After Effects'),
  ('Motion Designer',    'CapCut'),
  ('Social Media',                 'Meta Business Suite'),
  ('Social Media',                 'CapCut'),
  ('Redator(a) / Copywriter',      'Notion'),
  ('Gestor(a) de Tráfego Pago',    'Meta Business Suite'),
  ('Gestor(a) de Tráfego Pago',    'Google Ads'),
  ('Gestor(a) de Tráfego Pago',    'TikTok Ads Manager'),
  ('Editor(a) de Vídeo',           'CapCut'),
  ('Editor(a) de Vídeo',           'Adobe After Effects'),
  ('SDR / BDR',                  'LinkedIn Sales Navigator'),
  ('SDR / BDR',                  'HubSpot'),
  ('Executivo(a) de Vendas',     'HubSpot'),
  ('Executivo(a) de Vendas',     'Pipedrive'),
  ('Customer Success',           'HubSpot'),
  ('Analista de BI',            'Metabase'),
  ('Analista de BI',            'PostgreSQL'),
  ('Engenheiro(a) de Dados',    'BigQuery'),
  ('Engenheiro(a) de Dados',    'dbt'),
  ('Engenheiro(a) de Dados',    'PostgreSQL'),
  ('Analista de Dados',         'PostgreSQL'),
  ('Analista de Dados',         'Looker Studio'),
  ('Analista de RH / People',          'Notion'),
  ('Analista Financeiro',              'Google Workspace'),
  ('Coordenador(a) de Operações',      'Jira')
) as v(cargo, ferramenta)
join pmo.cargos c on c.nome = v.cargo
join pmo.ferramentas f on f.nome = v.ferramenta
on conflict do nothing;


insert into pmo.ferramentas (nome, descricao, setores, nivel_minimo) values
  ('Code Review e Mentoria', 'Prática de revisar PRs, dar feedback construtivo, mentorar juniores.', '{}', 'pleno'),
  ('Comunicação com stakeholders', 'Apresentar resultados para liderança, alinhamento com PM/cliente, gestão de expectativas.', '{}', 'pleno'),
  ('Liderança técnica', 'Definição de arquitetura, roadmap técnico, gestão de squad.', '{}', 'senior')
on conflict (nome) do nothing;

insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_slug, obrigatoriedade)
select f.id, 'senioridade', v.alvo, v.obriga
from pmo.ferramentas f
join (values
  ('Code Review e Mentoria',           'pleno',        'obrigatoria'),
  ('Code Review e Mentoria',           'senior',       'obrigatoria'),
  ('Code Review e Mentoria',           'especialista', 'obrigatoria'),
  ('Comunicação com stakeholders', 'pleno',        'sugerida'),
  ('Comunicação com stakeholders', 'senior',       'obrigatoria'),
  ('Comunicação com stakeholders', 'especialista', 'obrigatoria'),
  ('Liderança técnica',            'senior',       'sugerida'),
  ('Liderança técnica',            'especialista', 'obrigatoria')
) as v(nome, alvo, obriga)
  on f.nome = v.nome
on conflict do nothing;
