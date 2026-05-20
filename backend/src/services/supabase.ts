import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY são obrigatórios — copie .env.example para .env e preencha."
  );
}

// Cliente principal — usa service_role, ignora RLS, é o que escreve dados.
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Cliente para validação de JWT de usuário (anon key).
export const supabaseAuth = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
