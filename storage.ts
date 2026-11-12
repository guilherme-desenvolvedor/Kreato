/**
 * Camada de dados do Kreator.
 *
 * Fonte da verdade: banco Supabase (tabelas profiles, ideas, scripts,
 * publications, library_items e ai_messages — veja supabase/schema.sql).
 *
 * Como funciona:
 *  - Ao logar, `startSession()` carrega tudo do banco para um cache em memória.
 *  - As telas continuam lendo de forma síncrona (`getIdeas()`, `getScripts()`...),
 *    sem precisar de await — elas leem o cache.
 *  - Toda escrita atualiza o cache na hora (interface rápida) e grava no banco
 *    em segundo plano, em fila (a ordem é preservada, o que importa para chaves
 *    estrangeiras como publications.script_id -> scripts.id).
 *  - Se uma gravação falhar, o usuário é avisado e os dados são recarregados do
 *    banco para a tela refletir o que realmente foi salvo.
 *
 * Só o tema (claro/escuro) continua no localStorage, por ser preferência do
 * aparelho e não dado da conta.
 */
import type { User } from '@supabase/supabase-js';
import { Idea, Script, Publication, LibraryItem, UserProfile, AiMessage } from '../types';
import { supabase } from './supabase';
import { showToast } from '../utils/toast';

const THEME_KEY = 'kreato_theme_v1';

type Row = Record<string, any>;
type DbResult = { error: { message: string; code?: string } | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Gera um UUID v4 (usa crypto.randomUUID quando disponível). */
function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Perfil neutro usado até o perfil do banco ser carregado. */
function defaultProfile(user?: User | null): UserProfile {
  const emailName = (user?.email || '').split('@')[0] || '';
  const name = ((user?.user_metadata?.name as string) || emailName || 'Criador').trim();
  const handleBase = emailName.replace(/[^a-zA-Z0-9._]/g, '') || 'criador';
  return {
    name,
    handle: `@${handleBase}`,
    niche: 'Criador Digital',
    bio: '',
    avatarUrl: '',
    targetPostsPerWeek: 4,
    targetScriptsPerMonth: 12,
  };
}

/** Mensagem de boas-vindas da Krea (só local, não é gravada no banco). */
function welcomeMessage(profileName: string): AiMessage {
  const firstName = (profileName || '').trim().split(/\s+/)[0] || 'criador(a)';
  return {
    id: 'msg-welcome',
    role: 'assistant',
    text: `Olá ${firstName}! Eu sou **Krea**, seu copiloto criativo no **Kreator**. Como posso ajudar no seu processo hoje? Podemos explorar novas ideias de conteúdo, refinar um gancho para reter atenção ou estruturar um roteiro completo.`,
    timestamp: nowIso(),
  };
}

// ---------------------------------------------------------------------
// Conversão linha do banco (snake_case) <-> objeto da interface (camelCase)
// ---------------------------------------------------------------------
const toProfile = (r: Row): UserProfile => ({
  name: r.name ?? '',
  handle: r.handle ?? '',
  niche: r.niche ?? '',
  bio: r.bio ?? '',
  avatarUrl: r.avatar_url ?? '',
  targetPostsPerWeek: r.target_posts_per_week ?? 4,
  targetScriptsPerMonth: r.target_scripts_per_month ?? 12,
});

const fromProfile = (userId: string, p: UserProfile): Row => ({
  id: userId,
  name: p.name,
  handle: p.handle,
  niche: p.niche,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  target_posts_per_week: p.targetPostsPerWeek,
  target_scripts_per_month: p.targetScriptsPerMonth,
});

const toIdea = (r: Row): Idea => ({
  id: r.id,
  title: r.title,
  description: r.description ?? '',
  category: r.category,
  platform: r.platform,
  status: r.status,
  createdAt: r.created_at,
  isFavorite: Boolean(r.is_favorite),
  tags: r.tags ?? [],
});

const fromIdea = (userId: string, i: Idea): Row => ({
  id: i.id,
  user_id: userId,
  title: i.title,
  description: i.description,
  category: i.category,
  platform: i.platform,
  status: i.status,
  is_favorite: i.isFavorite,
  tags: i.tags ?? [],
  created_at: i.createdAt,
});

const toScript = (r: Row): Script => ({
  id: r.id,
  title: r.title,
  platform: r.platform,
  format: r.format,
  hook: r.hook ?? '',
  body: r.body ?? '',
  cta: r.cta ?? '',
  notes: r.notes ?? '',
  status: r.status,
  wordCount: r.word_count ?? 0,
  readingTimeMinutes: r.reading_time_minutes ?? 1,
  updatedAt: r.updated_at,
});

const fromScript = (userId: string, s: Script): Row => ({
  id: s.id,
  user_id: userId,
  title: s.title,
  platform: s.platform,
  format: s.format,
  hook: s.hook,
  body: s.body,
  cta: s.cta,
  notes: s.notes,
  status: s.status,
  word_count: s.wordCount,
  reading_time_minutes: s.readingTimeMinutes,
});

const toPublication = (r: Row): Publication => ({
  id: r.id,
  title: r.title,
  platform: r.platform,
  scheduledDate: r.scheduled_date,
  scheduledTime: String(r.scheduled_time ?? '09:00').slice(0, 5), // 'HH:MM:SS' -> 'HH:mm'
  status: r.status,
  category: r.category,
  scriptId: r.script_id ?? undefined,
  notes: r.notes ?? '',
});

const fromPublication = (userId: string, p: Publication): Row => ({
  id: p.id,
  user_id: userId,
  title: p.title,
  platform: p.platform,
  scheduled_date: p.scheduledDate,
  scheduled_time: p.scheduledTime || '09:00',
  status: p.status,
  category: p.category,
  script_id: p.scriptId || null,
  notes: p.notes ?? '',
});

const toLibraryItem = (r: Row): LibraryItem => ({
  id: r.id,
  title: r.title,
  category: r.category,
  type: r.type,
  thumbnailUrl: r.thumbnail_url ?? undefined,
  content: r.content ?? '',
  sourceUrl: r.source_url ?? undefined,
  tags: r.tags ?? [],
  createdAt: r.created_at,
});

const fromLibraryItem = (userId: string, i: LibraryItem): Row => ({
  id: i.id,
  user_id: userId,
  title: i.title,
  category: i.category,
  type: i.type,
  thumbnail_url: i.thumbnailUrl ?? null,
  content: i.content,
  source_url: i.sourceUrl ?? null,
  tags: i.tags ?? [],
  created_at: i.createdAt,
});

const toAiMessage = (r: Row): AiMessage => ({
  id: r.id,
  role: r.role,
  text: r.text,
  timestamp: r.created_at,
  actionType: r.action_type ?? undefined,
  generatedContent: r.generated_content ?? undefined,
});

const fromAiMessage = (userId: string, m: AiMessage): Row => ({
  id: m.id,
  user_id: userId,
  role: m.role,
  text: m.text,
  action_type: m.actionType ?? null,
  generated_content: m.generatedContent ?? null,
  created_at: m.timestamp,
});

/** Traduz erros do Supabase em mensagens úteis para quem está configurando. */
function friendlyDbError(err: { message: string; code?: string }): string {
  const msg = err.message || '';
  if (err.code === 'PGRST205' || err.code === '42P01' || /could not find the table|does not exist/i.test(msg)) {
    return 'As tabelas do banco ainda não foram criadas. Rode o arquivo supabase/schema.sql no SQL Editor do Supabase.';
  }
  if (err.code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'Permissão negada pelo banco. Confira se o supabase/schema.sql (políticas RLS) foi executado e se você está logado.';
  }
  return msg || 'Erro desconhecido no banco de dados.';
}

export interface ImportSummary {
  ideas: number;
  scripts: number;
  publications: number;
  library: number;
}

class StorageService {
  // Cache em memória (espelho dos dados do usuário logado)
  private userId: string | null = null;
  private profile: UserProfile = defaultProfile();
  private ideas: Idea[] = [];
  private scripts: Script[] = [];
  private publications: Publication[] = [];
  private library: LibraryItem[] = [];
  private aiHistory: AiMessage[] = [];

  // Controle de sessão / hidratação
  private hydratedFor: string | null = null;
  private hydrating: Promise<void> | null = null;
  private hydratingFor: string | null = null;

  // Fila de gravações (preserva a ordem)
  private writeQueue: Promise<void> = Promise.resolve();
  private reloadScheduled = false;

  // -------------------------------------------------------------------
  // Sessão e carregamento
  // -------------------------------------------------------------------
  isLoggedIn(): boolean {
    return this.userId !== null;
  }

  /**
   * Inicia a sessão de um usuário: carrega todos os dados dele do banco.
   * Chamadas repetidas para o mesmo usuário são ignoradas (ex.: refresh de token).
   */
  async startSession(user: User): Promise<void> {
    if (this.hydratedFor === user.id) return;
    if (this.hydrating && this.hydratingFor === user.id) return this.hydrating;

    this.userId = user.id;
    this.hydratingFor = user.id;
    this.hydrating = this.loadAll(user)
      .then(() => {
        this.hydratedFor = user.id;
      })
      .catch((err) => {
        console.error('[Storage] Falha ao carregar dados do banco:', err);
        showToast(friendlyDbError(err), 'error', 8000);
      })
      .finally(() => {
        this.hydrating = null;
        this.hydratingFor = null;
        window.dispatchEvent(new CustomEvent('kreato:auth-changed', { detail: { loggedIn: true } }));
        window.dispatchEvent(new CustomEvent('kreato:data-reset'));
      });

    return this.hydrating;
  }

  /** Encerra a sessão local e limpa o cache (os dados continuam salvos no banco). */
  logout(): void {
    const wasLoggedIn = this.userId !== null;
    this.userId = null;
    this.hydratedFor = null;
    this.profile = defaultProfile();
    this.ideas = [];
    this.scripts = [];
    this.publications = [];
    this.library = [];
    this.aiHistory = [];
    this.writeQueue = Promise.resolve();
    if (wasLoggedIn) {
      window.dispatchEvent(new CustomEvent('kreato:auth-changed', { detail: { loggedIn: false } }));
    }
  }

  private async loadAll(user: User): Promise<void> {
    if (!supabase) throw { message: 'Supabase não configurado.' };
    const db = supabase;

    const [prof, ideas, scripts, pubs, lib, ai] = await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db.from('ideas').select('*').order('created_at', { ascending: false }),
      db.from('scripts').select('*').order('updated_at', { ascending: false }),
      db.from('publications').select('*').order('scheduled_date', { ascending: true }),
      db.from('library_items').select('*').order('created_at', { ascending: false }),
      db.from('ai_messages').select('*').order('created_at', { ascending: true }).limit(200),
    ]);

    for (const res of [prof, ideas, scripts, pubs, lib, ai]) {
      if (res.error) throw res.error;
    }

    this.ideas = (ideas.data || []).map(toIdea);
    this.scripts = (scripts.data || []).map(toScript);
    this.publications = (pubs.data || []).map(toPublication);
    this.library = (lib.data || []).map(toLibraryItem);
    this.aiHistory = (ai.data || []).map(toAiMessage);

    if (prof.data) {
      this.profile = toProfile(prof.data);
    } else {
      // Perfil ainda não existe (usuário anterior ao trigger do banco): cria agora.
      this.profile = defaultProfile(user);
      const { error } = await db
        .from('profiles')
        .upsert(fromProfile(user.id, this.profile), { onConflict: 'id', ignoreDuplicates: true });
      if (error) console.error('[Storage] Erro ao criar perfil:', error.message);
    }
  }

  // -------------------------------------------------------------------
  // Gravação em segundo plano
  // -------------------------------------------------------------------
  private enqueue(label: string, op: () => PromiseLike<DbResult>): Promise<boolean> {
    if (!supabase || !this.userId) return Promise.resolve(false);

    const task = this.writeQueue.then(async () => {
      try {
        const { error } = await op();
        if (error) throw error;
        return true;
      } catch (err: any) {
        this.onWriteError(label, err);
        return false;
      }
    });
    // Mantém a fila viva mesmo se uma tarefa falhar
    this.writeQueue = task.then(() => undefined);
    return task;
  }

  private onWriteError(label: string, err: { message: string; code?: string }) {
    console.error(`[Storage] Falha ao salvar (${label}):`, err);
    showToast(`Não foi possível salvar (${label}). ${friendlyDbError(err)}`, 'error', 7000);

    // Recarrega do banco para a tela refletir o que realmente foi salvo.
    if (this.reloadScheduled || !this.userId) return;
    this.reloadScheduled = true;
    const userId = this.userId;
    setTimeout(async () => {
      this.reloadScheduled = false;
      if (!supabase || this.userId !== userId) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user || data.user.id !== userId) return;
      try {
        await this.loadAll(data.user);
        window.dispatchEvent(new CustomEvent('kreato:data-reset'));
      } catch (e) {
        console.error('[Storage] Falha ao recarregar após erro:', e);
      }
    }, 0);
  }

  /** Aguarda todas as gravações pendentes terminarem. */
  async flush(): Promise<void> {
    await this.writeQueue;
  }

  // -------------------------------------------------------------------
  // Perfil
  // -------------------------------------------------------------------
  getProfile(): UserProfile {
    return this.profile;
  }

  updateProfile(profile: Partial<UserProfile>): UserProfile {
    const updated = { ...this.profile, ...profile };
    this.profile = updated;
    const userId = this.userId;
    if (userId) {
      this.enqueue('perfil', () =>
        supabase!.from('profiles').upsert(fromProfile(userId, updated), { onConflict: 'id' })
      );
    }
    window.dispatchEvent(new CustomEvent('kreato:profile-updated', { detail: updated }));
    return updated;
  }

  // -------------------------------------------------------------------
  // Ideias
  // -------------------------------------------------------------------
  getIdeas(): Idea[] {
    return this.ideas;
  }

  saveIdea(idea: Omit<Idea, 'id' | 'createdAt'> & { id?: string }): Idea {
    const index = idea.id ? this.ideas.findIndex((i) => i.id === idea.id) : -1;
    let saved: Idea;

    if (index >= 0) {
      saved = { ...this.ideas[index], ...idea, id: this.ideas[index].id };
      this.ideas[index] = saved;
    } else {
      saved = { ...idea, id: idea.id || uuid(), createdAt: nowIso() } as Idea;
      this.ideas.unshift(saved);
    }

    const userId = this.userId;
    if (userId) {
      const row = fromIdea(userId, saved);
      this.enqueue('ideia', () => supabase!.from('ideas').upsert(row, { onConflict: 'id' }));
    }
    window.dispatchEvent(new CustomEvent('kreato:ideas-updated'));
    return saved;
  }

  deleteIdea(id: string): boolean {
    this.ideas = this.ideas.filter((i) => i.id !== id);
    this.enqueue('excluir ideia', () => supabase!.from('ideas').delete().eq('id', id));
    window.dispatchEvent(new CustomEvent('kreato:ideas-updated'));
    return true;
  }

  toggleFavoriteIdea(id: string): Idea | null {
    const item = this.ideas.find((i) => i.id === id);
    if (!item) return null;
    item.isFavorite = !item.isFavorite;
    const isFavorite = item.isFavorite;
    this.enqueue('favorito', () => supabase!.from('ideas').update({ is_favorite: isFavorite }).eq('id', id));
    window.dispatchEvent(new CustomEvent('kreato:ideas-updated'));
    return item;
  }

  // -------------------------------------------------------------------
  // Roteiros
  // -------------------------------------------------------------------
  getScripts(): Script[] {
    return this.scripts;
  }

  getScriptById(id: string): Script | undefined {
    return this.scripts.find((s) => s.id === id);
  }

  saveScript(
    script: Omit<Script, 'id' | 'updatedAt' | 'wordCount' | 'readingTimeMinutes'> & { id?: string }
  ): Script {
    const fullText = `${script.hook} ${script.body} ${script.cta}`;
    const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.round(words / 130)); // ~130 palavras por minuto de fala

    const index = script.id ? this.scripts.findIndex((s) => s.id === script.id) : -1;
    let saved: Script;

    if (index >= 0) {
      saved = {
        ...this.scripts[index],
        ...script,
        id: this.scripts[index].id,
        wordCount: words,
        readingTimeMinutes: readingTime,
        updatedAt: nowIso(),
      };
      this.scripts[index] = saved;
    } else {
      saved = {
        ...script,
        id: script.id || uuid(),
        wordCount: words,
        readingTimeMinutes: readingTime,
        updatedAt: nowIso(),
      };
      this.scripts.unshift(saved);
    }

    const userId = this.userId;
    if (userId) {
      const row = fromScript(userId, saved);
      this.enqueue('roteiro', () => supabase!.from('scripts').upsert(row, { onConflict: 'id' }));
    }
    window.dispatchEvent(new CustomEvent('kreato:scripts-updated'));
    return saved;
  }

  deleteScript(id: string): boolean {
    this.scripts = this.scripts.filter((s) => s.id !== id);
    // No banco, publications.script_id vira NULL (on delete set null); espelha no cache.
    this.publications.forEach((p) => {
      if (p.scriptId === id) p.scriptId = undefined;
    });
    this.enqueue('excluir roteiro', () => supabase!.from('scripts').delete().eq('id', id));
    window.dispatchEvent(new CustomEvent('kreato:scripts-updated'));
    return true;
  }

  duplicateScript(id: string): Script | null {
    const original = this.getScriptById(id);
    if (!original) return null;
    const duplicated: Script = {
      ...original,
      id: uuid(),
      title: `${original.title} (Cópia)`,
      status: 'Rascunho',
      updatedAt: nowIso(),
    };
    this.scripts.unshift(duplicated);

    const userId = this.userId;
    if (userId) {
      const row = fromScript(userId, duplicated);
      this.enqueue('duplicar roteiro', () => supabase!.from('scripts').upsert(row, { onConflict: 'id' }));
    }
    window.dispatchEvent(new CustomEvent('kreato:scripts-updated'));
    return duplicated;
  }

  // -------------------------------------------------------------------
  // Publicações (planejamento)
  // -------------------------------------------------------------------
  getPublications(): Publication[] {
    return this.publications;
  }

  savePublication(pub: Omit<Publication, 'id'> & { id?: string }): Publication {
    const index = pub.id ? this.publications.findIndex((p) => p.id === pub.id) : -1;
    let saved: Publication;

    if (index >= 0) {
      saved = { ...this.publications[index], ...pub, id: this.publications[index].id };
      this.publications[index] = saved;
    } else {
      saved = { ...pub, id: pub.id || uuid() };
      this.publications.unshift(saved);
    }

    const userId = this.userId;
    if (userId) {
      const row = fromPublication(userId, saved);
      this.enqueue('publicação', () => supabase!.from('publications').upsert(row, { onConflict: 'id' }));
    }
    window.dispatchEvent(new CustomEvent('kreato:publications-updated'));
    return saved;
  }

  deletePublication(id: string): boolean {
    this.publications = this.publications.filter((p) => p.id !== id);
    this.enqueue('excluir publicação', () => supabase!.from('publications').delete().eq('id', id));
    window.dispatchEvent(new CustomEvent('kreato:publications-updated'));
    return true;
  }

  // -------------------------------------------------------------------
  // Biblioteca
  // -------------------------------------------------------------------
  getLibraryItems(): LibraryItem[] {
    return this.library;
  }

  saveLibraryItem(item: Omit<LibraryItem, 'id' | 'createdAt'> & { id?: string }): LibraryItem {
    const index = item.id ? this.library.findIndex((i) => i.id === item.id) : -1;
    let saved: LibraryItem;

    if (index >= 0) {
      saved = { ...this.library[index], ...item, id: this.library[index].id };
      this.library[index] = saved;
    } else {
      saved = { ...item, id: item.id || uuid(), createdAt: nowIso() };
      this.library.unshift(saved);
    }

    const userId = this.userId;
    if (userId) {
      const row = fromLibraryItem(userId, saved);
      this.enqueue('item da biblioteca', () => supabase!.from('library_items').upsert(row, { onConflict: 'id' }));
    }
    window.dispatchEvent(new CustomEvent('kreato:library-updated'));
    return saved;
  }

  deleteLibraryItem(id: string): boolean {
    this.library = this.library.filter((i) => i.id !== id);
    this.enqueue('excluir item da biblioteca', () => supabase!.from('library_items').delete().eq('id', id));
    window.dispatchEvent(new CustomEvent('kreato:library-updated'));
    return true;
  }

  // -------------------------------------------------------------------
  // Histórico da Krea (IA)
  // -------------------------------------------------------------------
  getAiHistory(): AiMessage[] {
    return [welcomeMessage(this.profile.name), ...this.aiHistory];
  }

  addAiMessage(msg: Omit<AiMessage, 'id' | 'timestamp'>): AiMessage {
    const newMsg: AiMessage = { ...msg, id: uuid(), timestamp: nowIso() };
    this.aiHistory.push(newMsg);

    const userId = this.userId;
    if (userId) {
      const row = fromAiMessage(userId, newMsg);
      this.enqueue('mensagem da Krea', () => supabase!.from('ai_messages').insert(row));
    }
    return newMsg;
  }

  clearAiHistory(): void {
    this.aiHistory = [];
    const userId = this.userId;
    if (userId) {
      this.enqueue('limpar histórico', () => supabase!.from('ai_messages').delete().eq('user_id', userId));
    }
    window.dispatchEvent(new CustomEvent('kreato:ai-updated'));
  }

  // -------------------------------------------------------------------
  // Tema (claro / escuro) — preferência do aparelho, fica no localStorage
  // -------------------------------------------------------------------
  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('kreato:theme-changed', { detail: theme }));
  }

  toggleTheme(): 'light' | 'dark' {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  // -------------------------------------------------------------------
  // Apagar, exportar e importar
  // -------------------------------------------------------------------

  /**
   * Apaga TODAS as ideias, roteiros, publicações, itens da biblioteca e o
   * histórico da Krea da conta (o perfil é mantido). Aguarda o banco confirmar.
   */
  async deleteAllData(): Promise<boolean> {
    const userId = this.userId;
    if (!supabase || !userId) return false;
    await this.flush();

    // Publicações primeiro (referenciam roteiros)
    const tables = ['publications', 'scripts', 'ideas', 'library_items', 'ai_messages'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`[Storage] Erro ao apagar ${table}:`, error);
        showToast(`Não foi possível apagar os dados (${table}). ${friendlyDbError(error)}`, 'error', 7000);
        return false;
      }
    }

    this.ideas = [];
    this.scripts = [];
    this.publications = [];
    this.library = [];
    this.aiHistory = [];
    window.dispatchEvent(new CustomEvent('kreato:data-reset'));
    return true;
  }

  exportDataJson(): string {
    return JSON.stringify(
      {
        version: '2.0',
        exportedAt: nowIso(),
        profile: this.profile,
        ideas: this.ideas,
        scripts: this.scripts,
        publications: this.publications,
        library: this.library,
      },
      null,
      2
    );
  }

  /**
   * Importa um backup JSON (formato do exportDataJson). Os itens são MESCLADOS
   * com os que já existem (nada é apagado). Backups antigos, cujos ids não são
   * UUID, recebem ids novos — e as referências publicação -> roteiro são refeitas.
   */
  async importDataJson(jsonStr: string): Promise<ImportSummary | null> {
    const userId = this.userId;
    if (!supabase || !userId) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Falha ao importar dados:', e);
      return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;

    const idMap = new Map<string, string>();
    const resolveId = (oldId: unknown): string => {
      const key = typeof oldId === 'string' ? oldId : '';
      if (key && UUID_RE.test(key)) return key;
      if (!key) return uuid();
      if (!idMap.has(key)) idMap.set(key, uuid());
      return idMap.get(key)!;
    };
    const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

    const ideas = list<Idea>(parsed.ideas).map((i) => ({
      ...i,
      id: resolveId(i.id),
      description: i.description ?? '',
      isFavorite: Boolean(i.isFavorite),
      tags: i.tags ?? [],
      createdAt: i.createdAt || nowIso(),
    }));
    const scripts = list<Script>(parsed.scripts).map((s) => ({
      ...s,
      id: resolveId(s.id),
      updatedAt: s.updatedAt || nowIso(),
    }));
    const publications = list<Publication>(parsed.publications).map((p) => ({
      ...p,
      id: resolveId(p.id),
      scriptId: p.scriptId ? resolveId(p.scriptId) : undefined,
    }));
    const library = list<LibraryItem>(parsed.library).map((l) => ({
      ...l,
      id: resolveId(l.id),
      tags: l.tags ?? [],
      createdAt: l.createdAt || nowIso(),
    }));

    // Referência a roteiro que não veio no arquivo nem existe na conta: descarta o vínculo
    const knownScriptIds = new Set([...this.scripts.map((s) => s.id), ...scripts.map((s) => s.id)]);
    publications.forEach((p) => {
      if (p.scriptId && !knownScriptIds.has(p.scriptId)) p.scriptId = undefined;
    });

    await this.flush();

    // Ordem importa por causa da chave estrangeira publications.script_id
    const steps: Array<[string, string, Row[]]> = [
      ['scripts', 'roteiros', scripts.map((s) => fromScript(userId, s))],
      ['ideas', 'ideias', ideas.map((i) => fromIdea(userId, i))],
      ['publications', 'publicações', publications.map((p) => fromPublication(userId, p))],
      ['library_items', 'biblioteca', library.map((l) => fromLibraryItem(userId, l))],
    ];
    for (const [table, label, rows] of steps) {
      if (rows.length === 0) continue;
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (error) {
        console.error(`[Storage] Erro ao importar ${label}:`, error);
        showToast(`Falha ao importar ${label}. ${friendlyDbError(error)}`, 'error', 7000);
        return null;
      }
    }

    if (parsed.profile && typeof parsed.profile === 'object') {
      this.updateProfile({
        name: parsed.profile.name ?? this.profile.name,
        handle: parsed.profile.handle ?? this.profile.handle,
        niche: parsed.profile.niche ?? this.profile.niche,
        bio: parsed.profile.bio ?? this.profile.bio,
      });
    }

    // Recarrega do banco para refletir exatamente o que foi salvo
    const { data } = await supabase.auth.getUser();
    if (data.user) await this.loadAll(data.user);
    window.dispatchEvent(new CustomEvent('kreato:data-reset'));

    return {
      ideas: ideas.length,
      scripts: scripts.length,
      publications: publications.length,
      library: library.length,
    };
  }
}

export const storage = new StorageService();
