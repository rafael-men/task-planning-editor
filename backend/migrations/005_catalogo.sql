
create table if not exists pmo.ferramentas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null unique,
  descricao     text not null,
  setores       text[] not null default '{}', -- ex.: {'tecnologia','design'}
  nivel_minimo  text not null default 'junior'
                check (nivel_minimo in ('estagio','junior','pleno','senior','especialista')),
  created_at    timestamptz not null default now()
);

create index if not exists ferramentas_setores_idx on pmo.ferramentas using gin(setores);

create table if not exists pmo.cursos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  link          text,
  ferramenta_id uuid references pmo.ferramentas(id) on delete set null,
  setores       text[] not null default '{}',
  duracao_horas int,
  formato       text check (formato in ('video','livro','workshop','documentacao','curso_online','mentoria')),
  created_at    timestamptz not null default now()
);

create index if not exists cursos_ferramenta_idx on pmo.cursos(ferramenta_id);
create index if not exists cursos_setores_idx on pmo.cursos using gin(setores);


alter table pmo.ferramentas enable row level security;
alter table pmo.cursos enable row level security;

drop policy if exists "ferramentas read" on pmo.ferramentas;
create policy "ferramentas read" on pmo.ferramentas
  for select to authenticated using (true);

drop policy if exists "cursos read" on pmo.cursos;
create policy "cursos read" on pmo.cursos
  for select to authenticated using (true);

insert into pmo.ferramentas (nome, descricao, setores, nivel_minimo) values

  ('n8n', 'Automação de fluxos low-code, integrações via nós, webhooks, automação de processos internos.', '{tecnologia,operacoes}', 'junior'),
  ('Nest.js', 'Framework Node para backend modular: controllers, providers, DI, integração com Postgres/Supabase.', '{tecnologia}', 'junior'),
  ('API Rest', 'Design de endpoints, status codes, autenticação, versionamento, OpenAPI/Swagger.', '{tecnologia}', 'junior'),
  ('React.js', 'SPA, componentes, hooks, gerenciamento de estado, formulários, integração com APIs.', '{tecnologia}', 'junior'),
  ('Next.js', 'SSR/ISR, app router, server actions, deploy em Vercel, otimizações de performance.', '{tecnologia}', 'pleno'),
  ('Agentes RAG e LLM', 'Prompt engineering, retrieval augmented generation, embeddings, vector stores, tool use, eval.', '{tecnologia,bi}', 'pleno'),
  ('PostgreSQL', 'SQL avançado, índices, EXPLAIN, RLS, materialized views, JSONB.', '{tecnologia,bi}', 'junior'),
  ('Docker', 'Containers, Dockerfile, docker-compose, registries, ambientes reproduzíveis.', '{tecnologia}', 'junior'),
  ('Git e GitHub', 'Branching, PRs, code review, conventional commits, GitHub Actions.', '{tecnologia,design}', 'estagio'),


  ('Figma', 'UI/UX, design system, auto layout, variants, prototipagem, handoff para dev.', '{design,tecnologia}', 'estagio'),
  ('Adobe Illustrator', 'Vetorização, identidade visual, ilustração, exportação para diferentes mídias.', '{design,social}', 'estagio'),
  ('Adobe Photoshop', 'Edição de imagens, fotomontagem, retoque, exportação web.', '{design,social}', 'estagio'),
  ('Adobe After Effects', 'Motion design, animação para social, lower thirds, sound design básico.', '{design,social}', 'junior'),

  ('Meta Business Suite', 'Gestão de páginas, agendamento, monitoramento de métricas Instagram/Facebook.', '{social,vendas}', 'estagio'),
  ('TikTok Ads Manager', 'Campanhas, criativos, públicos, otimização de funil para TikTok.', '{social,vendas}', 'junior'),
  ('Google Ads', 'Campanhas de search/display/PMax, palavras-chave, conversões, otimização de lances.', '{social,vendas}', 'junior'),
  ('CapCut', 'Edição rápida de vídeo vertical para Reels/Shorts/TikTok com templates e legendas.', '{social,design}', 'estagio'),
  ('Notion', 'Documentação, wikis internas, gestão de tarefas leves, briefings.', '{social,design,operacoes,vendas}', 'estagio'),

  ('HubSpot', 'CRM, pipeline, sequência de emails, automações de vendas, relatórios.', '{vendas,operacoes}', 'estagio'),
  ('RD Station', 'CRM e marketing automation focados em mercado BR, lead scoring, fluxos.', '{vendas,social}', 'junior'),
  ('Pipedrive', 'CRM visual por pipeline, atividades, previsões, integrações via API.', '{vendas}', 'junior'),
  ('LinkedIn Sales Navigator', 'Prospecção B2B, filtros avançados, InMail, listas de leads.', '{vendas}', 'junior'),

  ('Looker Studio', 'Dashboards web gratuitos, conectores nativos, compartilhamento por link.', '{bi,social,vendas}', 'estagio'),
  ('Metabase', 'BI open source self-service, queries SQL, dashboards, alertas.', '{bi,tecnologia}', 'junior'),
  ('Power BI', 'Modelagem semântica, DAX, dataflows, relatórios corporativos.', '{bi,operacoes}', 'junior'),
  ('BigQuery', 'Data warehouse serverless, SQL, particionamento, custos por query.', '{bi,tecnologia}', 'pleno'),
  ('dbt', 'Modelagem analítica versionada, testes, documentação, materializações.', '{bi}', 'pleno'),


  ('Jira', 'Gestão ágil, sprints, epics, workflows customizados, integrações.', '{operacoes,tecnologia}', 'estagio'),
  ('Trello', 'Kanban leve para times pequenos, automações via Butler.', '{operacoes,social}', 'estagio'),
  ('Google Workspace', 'Docs, Sheets, Drive, Calendar, Meet — colaboração e arquivos.', '{operacoes,social,vendas,design,tecnologia,bi}', 'estagio'),
  ('Slack', 'Comunicação assíncrona, canais, threads, integrações, slash commands.', '{operacoes,social,vendas,design,tecnologia,bi}', 'estagio')
on conflict (nome) do nothing;

-- Cursos vinculados às ferramentas acima.
insert into pmo.cursos (nome, link, ferramenta_id, setores, duracao_horas, formato)
select v.nome, v.link, f.id, v.setores, v.duracao_horas, v.formato
from pmo.ferramentas f
join (values
  -- Tecnologia
  ('n8n', 'Curso completo de n8n - automações práticas', 'https://docs.n8n.io/courses/', '{tecnologia,operacoes}'::text[], 12, 'curso_online'),
  ('Nest.js', 'NestJS Fundamentals (oficial)', 'https://learn.nestjs.com/', '{tecnologia}'::text[], 20, 'curso_online'),
  ('Nest.js', 'Construindo APIs com NestJS e Prisma', null, '{tecnologia}'::text[], 16, 'workshop'),
  ('API Rest', 'REST API Design - Best Practices', 'https://restfulapi.net/', '{tecnologia}'::text[], 6, 'documentacao'),
  ('React.js', 'React Docs oficial (beta)', 'https://react.dev/learn', '{tecnologia}'::text[], 10, 'documentacao'),
  ('React.js', 'Epic React por Kent C. Dodds', 'https://epicreact.dev/', '{tecnologia}'::text[], 40, 'curso_online'),
  ('Next.js', 'Next.js Learn (oficial)', 'https://nextjs.org/learn', '{tecnologia}'::text[], 8, 'curso_online'),
  ('Agentes RAG e LLM', 'DeepLearning.AI - LangChain & Vector DBs', 'https://www.deeplearning.ai/short-courses/', '{tecnologia}'::text[], 6, 'curso_online'),
  ('Agentes RAG e LLM', 'Anthropic Cookbook - Tool use & RAG patterns', 'https://github.com/anthropics/anthropic-cookbook', '{tecnologia}'::text[], 8, 'documentacao'),
  ('PostgreSQL', 'PostgreSQL Tutorial (oficial)', 'https://www.postgresql.org/docs/current/tutorial.html', '{tecnologia,bi}'::text[], 10, 'documentacao'),
  ('Docker', 'Docker - Get Started (oficial)', 'https://docs.docker.com/get-started/', '{tecnologia}'::text[], 6, 'documentacao'),
  ('Git e GitHub', 'Pro Git book (gratuito)', 'https://git-scm.com/book/en/v2', '{tecnologia,design}'::text[], 8, 'livro'),

  -- Design
  ('Figma', 'Figma Academy (oficial)', 'https://www.figma.com/academy/', '{design,tecnologia}'::text[], 12, 'curso_online'),
  ('Adobe Illustrator', 'Adobe Illustrator Learn & Support', 'https://helpx.adobe.com/illustrator/tutorials.html', '{design,social}'::text[], 14, 'video'),
  ('Adobe Photoshop', 'Photoshop tutoriais oficiais', 'https://helpx.adobe.com/photoshop/tutorials.html', '{design,social}'::text[], 16, 'video'),
  ('Adobe After Effects', 'School of Motion - Animation Bootcamp', 'https://www.schoolofmotion.com/', '{design,social}'::text[], 30, 'curso_online'),

  -- Social
  ('Meta Business Suite', 'Meta Blueprint - certificações gratuitas', 'https://www.facebook.com/business/learn', '{social,vendas}'::text[], 10, 'curso_online'),
  ('TikTok Ads Manager', 'TikTok Academy', 'https://academy.tiktok.com/', '{social,vendas}'::text[], 6, 'curso_online'),
  ('Google Ads', 'Google Skillshop - Google Ads', 'https://skillshop.exceedlms.com/student/catalog', '{social,vendas}'::text[], 12, 'curso_online'),
  ('CapCut', 'CapCut Academy - edição vertical', 'https://www.capcut.com/learn', '{social,design}'::text[], 4, 'video'),
  ('Notion', 'Notion Academy', 'https://www.notion.so/academy', '{social,design,operacoes,vendas}'::text[], 3, 'curso_online'),

  -- Vendas
  ('HubSpot', 'HubSpot Academy - certificação Sales Hub', 'https://academy.hubspot.com/', '{vendas,operacoes}'::text[], 8, 'curso_online'),
  ('RD Station', 'RD University', 'https://www.rdstation.com/rd-university/', '{vendas,social}'::text[], 6, 'curso_online'),
  ('Pipedrive', 'Pipedrive Academy', 'https://www.pipedrive.com/en/academy', '{vendas}'::text[], 4, 'curso_online'),
  ('LinkedIn Sales Navigator', 'LinkedIn Sales Insider', 'https://business.linkedin.com/sales-solutions/sales-navigator', '{vendas}'::text[], 4, 'documentacao'),

  -- BI / Dados
  ('Looker Studio', 'Looker Studio Help - tutoriais', 'https://support.google.com/looker-studio/', '{bi,social,vendas}'::text[], 5, 'documentacao'),
  ('Metabase', 'Metabase Learn', 'https://www.metabase.com/learn', '{bi,tecnologia}'::text[], 8, 'curso_online'),
  ('Power BI', 'Microsoft Learn - Power BI', 'https://learn.microsoft.com/training/powerplatform/power-bi', '{bi,operacoes}'::text[], 20, 'curso_online'),
  ('BigQuery', 'Google Cloud Skills Boost - BigQuery', 'https://www.cloudskillsboost.google/paths/16', '{bi,tecnologia}'::text[], 16, 'curso_online'),
  ('dbt', 'dbt Fundamentals (oficial)', 'https://courses.getdbt.com/courses/fundamentals', '{bi}'::text[], 10, 'curso_online'),

  -- Operações
  ('Jira', 'Atlassian University - Jira Fundamentals', 'https://university.atlassian.com/student/catalog', '{operacoes,tecnologia}'::text[], 6, 'curso_online'),
  ('Trello', 'Trello 101 - guia rápido', 'https://trello.com/guide', '{operacoes,social}'::text[], 2, 'documentacao'),
  ('Google Workspace', 'Google Workspace Learning Center', 'https://support.google.com/a/users', '{operacoes,social,vendas,design,tecnologia,bi}'::text[], 4, 'documentacao'),
  ('Slack', 'Slack 101 - introdução', 'https://slack.com/intl/pt-br/help/articles/218080037-Tour-do-Slack', '{operacoes,social,vendas,design,tecnologia,bi}'::text[], 2, 'documentacao')
) as v(ferramenta_nome, nome, link, setores, duracao_horas, formato)
  on f.nome = v.ferramenta_nome
on conflict do nothing;
