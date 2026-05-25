import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY são obrigatórios — copie .env.example para .env e preencha."
  );
}

// Todas as tabelas da app vivem no schema `pmo`. Apenas auth.* fica fora.
const APP_SCHEMA = "pmo";

/**
 * Cliente service_role — bypassa RLS. Use APENAS para:
 *  - `auth.admin.*` (gerenciar usuários);
 *  - leituras públicas autenticadas (catálogo);
 *  - rotas /admin que já validam role === 'rh';
 *  - resolução interna de hierarquia.
 *
 * Para handlers de dados de usuário, prefira `supabaseForUser(token)`.
 */
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: APP_SCHEMA },
});

/** Cliente anon para validar JWT em `getUser(token)`. */
export const supabaseAuth = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Cliente "como usuário" — usa anon key + Authorization Bearer do JWT.
 * RLS é aplicada normalmente: o usuário só consegue ler/escrever
 * o que as policies permitirem. Defesa em profundidade contra IDOR.
 */
export function supabaseForUser(token: string) {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: APP_SCHEMA },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
