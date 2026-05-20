import { z } from "zod";

export const passoSchema = z.string().min(1);

export const secaoSchema = z.object({
  titulo: z.string().min(1),
  ferramenta: z.string().optional().default(""),
  passos: z.array(passoSchema).default([]),
});

export const conteudoSchema = z.object({
  secoes: z.array(secaoSchema).default([]),
});

export type Conteudo = z.infer<typeof conteudoSchema>;

export const playbookSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable(),
  conteudo: conteudoSchema,
  versao: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Playbook = z.infer<typeof playbookSchema>;

export const createPlaybookBody = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().max(2000).optional(),
  conteudo: conteudoSchema.optional(),
});

export const updatePlaybookBody = z.object({
  nome: z.string().min(1).max(200).optional(),
  descricao: z.string().max(2000).nullable().optional(),
  conteudo: conteudoSchema.optional(),
});

export const promptBody = z.object({
  prompt: z.string().min(3).max(4000),
});
