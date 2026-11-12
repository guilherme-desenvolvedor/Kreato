import { Session, User } from '@supabase/supabase-js';
import { supabase, requireSupabase, isSupabaseConfigured } from './supabase';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  needsEmailConfirmation?: boolean;
  error?: string;
}

/**
 * Autenticação via Supabase Auth (e-mail + senha).
 * O perfil do usuário (tabela profiles) é criado por um trigger no banco
 * (supabase/schema.sql) e, como garantia, também pelo storage ao carregar os dados.
 */
class AuthService {
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[AuthService] Erro ao obter sessão:', error.message);
      return null;
    }
    return data.session;
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return { unsubscribe: () => {} };
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return data.subscription;
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResult> {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { user: null, session: null, error: this.mapAuthError(error.message) };
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: Boolean(data.user && !data.session),
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: this.mapAuthError(error.message) };
    }

    return { user: data.user, session: data.session };
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthService] Erro ao sair:', error.message);
    }
  }

  private mapAuthError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar.';
    }
    if (lower.includes('user already registered')) {
      return 'Este e-mail já está cadastrado.';
    }
    if (lower.includes('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return message;
  }
}

export const authService = new AuthService();
