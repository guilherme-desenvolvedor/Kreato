import { escapeHtml } from '../utils/formatters';
import { showToast } from '../utils/toast';
import { storage } from '../services/storage';
import { supabase } from '../services/supabase';

interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'ux' | 'ai' | 'integration' | 'other';
  status: 'analise' | 'planejado' | 'em_progresso' | 'concluido';
  votes: number;
  authorName: string;
  authorHandle: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  feature: { label: 'Novo Recurso', color: 'text-kreato-orange bg-kreato-orange/10 border-kreato-orange/20' },
  ux: { label: 'Interface & UX', color: 'text-kreato-blue bg-kreato-blue/10 border-kreato-blue/20' },
  ai: { label: 'Krea IA', color: 'text-kreato-purple bg-kreato-purple/10 border-kreato-purple/20' },
  integration: { label: 'Integrações', color: 'text-[#2D8A56] bg-[#2D8A56]/10 border-[#2D8A56]/20' },
  other: { label: 'Geral', color: 'text-kreato-muted bg-kreato-surface border-kreato' },
};

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  analise: { label: 'Em Análise', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  planejado: { label: 'Planejado', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  em_progresso: { label: 'Em Desenvolvimento', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  concluido: { label: 'Concluído', badge: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' },
};

let activeFilterCategory: string = 'todas';
let activeFilterStatus: string = 'todas';
let votedIds: Set<string> = new Set();

export async function renderSuggestions(container: HTMLElement) {
  const profile = storage.getProfile();

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-kreato-orange/15 text-kreato-orange border border-kreato-orange/30 uppercase tracking-wider">
              Roadmap Colaborativo
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">
            Central de Sugestões & Futuras Implementações
          </h1>
          <p class="text-xs text-kreato-muted">
            Você faz o Kreato evoluir. Envie ideias de novos recursos, vote nas prioridades e acompanhe o que estamos construindo.
          </p>
        </div>

        <button id="btn-open-suggestion-modal" class="px-4 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Sugerir Novo Recurso</span>
        </button>
      </div>

      <!-- Filters & Counter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-kreato-surface border border-kreato rounded-2xl">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <button data-cat="todas" class="sug-cat-filter px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${activeFilterCategory === 'todas' ? 'bg-kreato-main text-kreato-bg font-bold' : 'hover:bg-kreato-bg text-kreato-muted'}">
            Todas
          </button>
          <button data-cat="feature" class="sug-cat-filter px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${activeFilterCategory === 'feature' ? 'bg-kreato-main text-kreato-bg font-bold' : 'hover:bg-kreato-bg text-kreato-muted'}">
            Novos Recursos
          </button>
          <button data-cat="ai" class="sug-cat-filter px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${activeFilterCategory === 'ai' ? 'bg-kreato-main text-kreato-bg font-bold' : 'hover:bg-kreato-bg text-kreato-muted'}">
            Krea IA
          </button>
          <button data-cat="integration" class="sug-cat-filter px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${activeFilterCategory === 'integration' ? 'bg-kreato-main text-kreato-bg font-bold' : 'hover:bg-kreato-bg text-kreato-muted'}">
            Integrações
          </button>
          <button data-cat="ux" class="sug-cat-filter px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${activeFilterCategory === 'ux' ? 'bg-kreato-main text-kreato-bg font-bold' : 'hover:bg-kreato-bg text-kreato-muted'}">
            UX & Design
          </button>
        </div>

        <div class="text-xs text-kreato-muted" id="suggestions-count-label">
          Carregando sugestões...
        </div>
      </div>

      <!-- List Container -->
      <div id="suggestions-list-container" class="space-y-3">
        <div class="p-8 text-center text-xs text-kreato-muted">Buscando ideias da comunidade...</div>
      </div>
    </div>
  `;

  // Fetch suggestions
  loadAndRenderList(container);

  // Wire filters
  container.querySelectorAll('.sug-cat-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeFilterCategory = (e.currentTarget as HTMLElement).getAttribute('data-cat') || 'todas';
      renderSuggestions(container);
    });
  });

  // Open creation modal
  container.querySelector('#btn-open-suggestion-modal')?.addEventListener('click', () => {
    openNewSuggestionModal(container);
  });
}

async function loadAndRenderList(container: HTMLElement) {
  const listContainer = container.querySelector('#suggestions-list-container');
  const countLabel = container.querySelector('#suggestions-count-label');
  if (!listContainer) return;

  let items: SuggestionItem[] = [];

  try {
    items = await fetchSuggestions();
  } catch (err: any) {
    console.error('[Sugestões] Falha ao carregar:', err);
    listContainer.innerHTML = `
      <div class="p-8 text-center kreato-card border border-kreato space-y-1">
        <p class="text-xs font-bold text-kreato-main">Não foi possível carregar as sugestões.</p>
        <p class="text-[11px] text-kreato-muted">${escapeHtml(err?.message || 'Tente novamente em instantes.')}</p>
      </div>
    `;
    if (countLabel) countLabel.textContent = '';
    return;
  }

  // Filter
  const filtered = items.filter(item => {
    const matchCat = activeFilterCategory === 'todas' || item.category === activeFilterCategory;
    const matchStatus = activeFilterStatus === 'todas' || item.status === activeFilterStatus;
    return matchCat && matchStatus;
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length} sugestão${filtered.length === 1 ? '' : 'ões'} encontrada${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="p-12 text-center kreato-card border border-kreato space-y-2">
        <div class="w-10 h-10 rounded-xl bg-kreato-orange/15 text-kreato-orange flex items-center justify-center mx-auto">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        </div>
        <p class="text-xs font-bold text-kreato-main">Nenhuma sugestão nesta categoria ainda.</p>
        <p class="text-[11px] text-kreato-muted">Seja o primeiro criador a sugerir uma melhoria!</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(item => {
    const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
    const st = STATUS_LABELS[item.status] || STATUS_LABELS.analise;
    const hasVoted = votedIds.has(item.id);
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('pt-BR');

    return `
      <div class="p-4 sm:p-5 kreato-card border border-kreato flex flex-col sm:flex-row items-start justify-between gap-4 transition-all hover:border-kreato-orange/40" data-id="${item.id}">
        <!-- Vote button -->
        <button class="btn-vote-suggestion flex sm:flex-col items-center justify-center gap-1.5 px-3 py-2 sm:w-16 rounded-xl border border-kreato transition-colors cursor-pointer shrink-0 ${
          hasVoted
            ? 'bg-kreato-orange text-white border-kreato-orange shadow-xs'
            : 'bg-kreato-surface hover:bg-kreato-surface-hover text-kreato-main'
        }" data-id="${item.id}">
          <svg class="w-4 h-4 ${hasVoted ? 'text-white' : 'text-kreato-orange'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
          <span class="text-xs font-bold font-mono tabular-nums vote-count">${item.votes}</span>
        </button>

        <!-- Content -->
        <div class="flex-1 space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}">
              ${cat.label}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${st.badge}">
              ${st.label}
            </span>
            <span class="text-[11px] text-kreato-subtle font-mono">· ${dateFormatted}</span>
          </div>

          <h3 class="text-sm font-bold text-kreato-main leading-snug">
            ${escapeHtml(item.title)}
          </h3>

          <p class="text-xs text-kreato-muted leading-relaxed">
            ${escapeHtml(item.description)}
          </p>

          <div class="flex items-center gap-1.5 text-[10px] text-kreato-subtle pt-1">
            <span>Sugerido por <strong>${escapeHtml(item.authorName)}</strong> (${escapeHtml(item.authorHandle)})</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Setup vote handlers
  listContainer.querySelectorAll('.btn-vote-suggestion').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;

      if (votedIds.has(id)) {
        showToast('Você já votou nesta sugestão!', 'info');
        return;
      }

      const buttonEl = e.currentTarget as HTMLElement;
      try {
        const votes = await voteSuggestion(id);
        votedIds.add(id);
        const countEl = buttonEl.querySelector('.vote-count');
        if (countEl) countEl.textContent = String(votes);
        buttonEl.className = 'btn-vote-suggestion flex sm:flex-col items-center justify-center gap-1.5 px-3 py-2 sm:w-16 rounded-xl border border-kreato-orange bg-kreato-orange text-white shadow-xs cursor-pointer shrink-0';
        showToast('Voto computado! Obrigado por fortalecer essa ideia.', 'success');
      } catch (err: any) {
        console.error('[Sugestões] Falha ao votar:', err);
        showToast(`Não foi possível registrar o voto. ${err?.message || ''}`.trim(), 'error');
      }
    });
  });
}

function openNewSuggestionModal(parentContainer: HTMLElement) {
  const profile = storage.getProfile();

  import('../utils/modal').then(({ openModal }) => {
    openModal({
      title: 'Sugerir Nova Implementação no Kreato',
      contentHtml: `
        <form id="form-new-suggestion" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-kreato-main mb-1">Título da Ideia / Recurso *</label>
            <input
              type="text"
              id="sug-title"
              required
              placeholder="Ex: Integração com microfone sem fio e teleprompter no app móvel"
              class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Categoria *</label>
              <select id="sug-category" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
                <option value="feature">Novo Recurso</option>
                <option value="ai">Krea IA & Prompts</option>
                <option value="integration">Integração Externa</option>
                <option value="ux">Design & Produtividade</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Autor da Sugestão</label>
              <input
                type="text"
                id="sug-author"
                disabled
                value="${escapeHtml(profile.name)} (${escapeHtml(profile.handle)})"
                class="w-full px-3.5 py-2 text-xs bg-kreato-bg border border-kreato rounded-xl text-kreato-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-kreato-main mb-1">Como isso ajudaria o seu processo criativo? *</label>
            <textarea
              id="sug-desc"
              rows="4"
              required
              placeholder="Descreva o problema que você enfrenta ou o benefício prático que essa ferramenta traria para os seus vídeos, roteiros ou postagens..."
              class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]"
            ></textarea>
          </div>
        </form>
      `,
      confirmText: 'Enviar Sugestão',
      onConfirm: async () => {
        const titleEl = document.getElementById('sug-title') as HTMLInputElement;
        const descEl = document.getElementById('sug-desc') as HTMLTextAreaElement;
        const catEl = document.getElementById('sug-category') as HTMLSelectElement;

        const title = titleEl?.value.trim();
        const description = descEl?.value.trim();
        const category = catEl?.value || 'feature';

        if (!title || !description) {
          showToast('Preencha o título e a descrição.', 'warning');
          return false;
        }

        try {
          await createSuggestion({
            title,
            description,
            category,
            authorName: profile.name,
            authorHandle: profile.handle,
          });
          showToast('Sugestão enviada com sucesso! Ela já está disponível no quadro.', 'success');
          loadAndRenderList(parentContainer);
          return true;
        } catch (err: any) {
          console.error('[Sugestões] Falha ao enviar:', err);
          showToast(`Não foi possível enviar a sugestão. ${err?.message || ''}`.trim(), 'error', 6000);
          return false;
        }
      },
    });
  });
}

// -------------------------------------------------------------
// Acesso ao banco (tabelas suggestions e suggestion_votes — veja supabase/schema.sql)
// -------------------------------------------------------------
async function currentUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Você precisa estar logado.');
  return id;
}

async function fetchSuggestions(): Promise<SuggestionItem[]> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const userId = await currentUserId();

  const [list, mine] = await Promise.all([
    supabase
      .from('suggestions')
      .select('id, title, description, category, status, author_name, author_handle, created_at, suggestion_votes(count)')
      .order('created_at', { ascending: false }),
    supabase.from('suggestion_votes').select('suggestion_id').eq('user_id', userId),
  ]);
  if (list.error) throw new Error(list.error.message);
  if (mine.error) throw new Error(mine.error.message);

  votedIds = new Set((mine.data || []).map((v: any) => v.suggestion_id as string));

  return (list.data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    votes: r.suggestion_votes?.[0]?.count ?? 0,
    authorName: r.author_name,
    authorHandle: r.author_handle,
    createdAt: r.created_at,
  }));
}

async function createSuggestion(input: {
  title: string;
  description: string;
  category: string;
  authorName: string;
  authorHandle: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const userId = await currentUserId();
  // O autor já recebe 1 voto automaticamente (trigger no banco).
  const { error } = await supabase.from('suggestions').insert({
    user_id: userId,
    title: input.title,
    description: input.description,
    category: input.category,
    author_name: input.authorName,
    author_handle: input.authorHandle,
  });
  if (error) throw new Error(error.message);
}

/** Registra o voto do usuário (1 por sugestão, garantido pelo banco) e devolve o total atualizado. */
async function voteSuggestion(suggestionId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const userId = await currentUserId();
  const { error } = await supabase
    .from('suggestion_votes')
    .insert({ suggestion_id: suggestionId, user_id: userId });
  // 23505 = já votou (chave primária duplicada): só sincroniza o total
  if (error && error.code !== '23505') throw new Error(error.message);

  const { count, error: countError } = await supabase
    .from('suggestion_votes')
    .select('*', { count: 'exact', head: true })
    .eq('suggestion_id', suggestionId);
  if (countError) throw new Error(countError.message);
  return count ?? 0;
}
