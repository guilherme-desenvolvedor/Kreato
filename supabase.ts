import { createClient, SupabaseClient } from '@supabase/supabase-js';

// URL do projeto e chave PUBLICÁVEL (anon/publishable) do Supabase.
// Aceita os dois nomes de variável: VITE_SUPABASE_ANON_KEY (padrão do projeto)
// e VITE_SUPABASE_PUBLISHABLE_KEY (nome novo usado pelo painel do Supabase).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('MY_SUPABASE') &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    !supabaseKey.includes('MY_SUPABASE') &&
    !supabaseKey.includes('YOUR_SUPABASE')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Kreator] Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas no .env.local.'
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.'
    );
  }
  return supabase;
}
