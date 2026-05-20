insert into public.playbooks (nome, descricao, conteudo) values
(
  'Playbook de desenvolvimento de LP',
  'Processo padrão para criar uma landing page institucional.',
  '{
    "secoes": [
      {
        "titulo": "Planejamento",
        "ferramenta": "Notion",
        "passos": ["Brief com o cliente", "Definir objetivo da LP", "Mapear seções"]
      },
      {
        "titulo": "Design",
        "ferramenta": "Figma",
        "passos": ["Wireframe", "Layout final", "Aprovação do cliente"]
      },
      {
        "titulo": "Publicação",
        "ferramenta": "WordPress",
        "passos": ["Criar tema", "Subir conteúdo", "Publicar"]
      }
    ]
  }'::jsonb
),
(
  'Playbook de onboarding',
  'Passo a passo para receber um novo cliente.',
  '{
    "secoes": [
      {
        "titulo": "Kickoff",
        "ferramenta": "Google Meet",
        "passos": ["Apresentar equipe", "Validar escopo", "Definir próximos passos"]
      },
      {
        "titulo": "Acessos",
        "ferramenta": "1Password",
        "passos": ["Coletar credenciais", "Compartilhar de forma segura"]
      }
    ]
  }'::jsonb
)
on conflict (nome) do nothing;
