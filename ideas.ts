import { storage } from '../services/storage';
import { Idea, IdeaCategory, IdeaStatus } from '../types';
import { formatRelativeDate, getCategoryAccent, getPlatformBadge, getStatusBadge, escapeHtml } from '../utils/formatters';
import { openIdeaModal } from '../modules/creationModals';
import { showToast } from '../utils/toast';

let currentCategory: string = 'todas';
let currentStatus: string = 'todas';
let currentSearch: string = '';
let currentViewMode: 'grid' | 'list' = 'grid';

export function renderIdeas(container: HTMLElement) {
  const allIdeas = storage.getIdeas();

  // Categories list
  const categories: IdeaCategory[] = [
    'Tecnologia',
    'Storytelling',
    'Monetização',
    'Bastidores',
    'Design',
    'Produtividade',
    'Tendências'
  ];

  // Filtering
  const filteredIdeas = allIdeas.filter(idea => {
    const matchesCat = currentCategory === 'todas' || idea.category === currentCategory;
    const matchesStatus = currentStatus === 'todas' || idea.status === currentStatus;
    const matchesSearch =
      !currentSearch ||
      idea.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
      idea.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
      idea.tags?.some(t => t.toLowerCase().includes(currentSearch.toLowerCase()));
    return matchesCat && matchesStatus && matchesSearch;
  });

  const totalCount = allIdeas.length;
  const filteredCount = filteredIdeas.length;
  const favoritesCount = allIdeas.filter(i => i.isFavorite).length;

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Header & Action Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Banco de Ideias</h1>
          <p class="text-xs text-kreato-muted">
            Espaço de captura e maturação de conceitos brutos para suas produções.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- View Mode Toggle -->
          <div class="flex items-center bg-[#FAF7F2] dark:bg-[#141417] border border-kreato p-1 rounded-xl">
            <button id="view-mode-grid" class="p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentViewMode === 'grid' ? 'bg-[#EFE8D8] text-kreato-main shadow-xs' : 'text-kreato-muted hover:text-kreato-main'}" title="Visualização em Grade">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            </button>
            <button id="view-mode-list" class="p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentViewMode === 'list' ? 'bg-[#EFE8D8] text-kreato-main shadow-xs' : 'text-kreato-muted hover:text-kreato-main'}" title="Visualização em Lista">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>

          <!-- Create Idea Button -->
          <button id="btn-create-idea" class="px-4 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Nova Ideia</span>
          </button>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="p-4 bg-[#FAF7F2] dark:bg-[#141417] border border-kreato rounded-2xl space-y-3">
        <div class="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <!-- Search input -->
          <div class="relative flex-1 max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-kreato-subtle">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input type="text" id="ideas-search" value="${escapeHtml(currentSearch)}" placeholder="Buscar por palavra-chave, tema ou tags..." class="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:bg-[#141417]" />
            ${currentSearch ? `<button id="clear-ideas-search" class="absolute inset-y-0 right-0 pr-3 flex items-center text-kreato-subtle hover:text-kreato-main"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>` : ''}
          </div>

          <!-- Status Filter Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-kreato-muted font-medium whitespace-nowrap">Status:</span>
            <select id="ideas-status-filter" class="px-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
              <option value="todas" ${currentStatus === 'todas' ? 'selected' : ''}>Todos os status</option>
              <option value="Nova" ${currentStatus === 'Nova' ? 'selected' : ''}>Nova</option>
              <option value="Em desenvolvimento" ${currentStatus === 'Em desenvolvimento' ? 'selected' : ''}>Em desenvolvimento</option>
              <option value="Aprovada" ${currentStatus === 'Aprovada' ? 'selected' : ''}>Aprovada</option>
              <option value="Arquivada" ${currentStatus === 'Arquivada' ? 'selected' : ''}>Arquivada</option>
            </select>

            <button id="filter-favorites-only" class="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${currentCategory === 'favoritas' ? 'bg-[#FAF2DF] border-[#E9BD4D] text-[#B88718]' : 'bg-white dark:bg-[#141417] border-kreato text-kreato-muted hover:text-kreato-main'}">
              <span class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5 text-[#E9BD4D]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> Favoritas</span>
              <span class="text-[11px] font-mono tabular-nums">(${favoritesCount})</span>
            </button>
          </div>
        </div>

        <!-- Category Pills (Interactive Filter segmented strip) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button data-cat="todas" class="category-filter-btn px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${currentCategory === 'todas' ? 'bg-[#231F1B] text-[#FAF7F2]' : 'bg-white dark:bg-[#141417] border border-kreato text-kreato-muted hover:text-kreato-main'}">
            Todas as Ideias (${totalCount})
          </button>
          ${categories
            .map(c => {
              const count = allIdeas.filter(i => i.category === c).length;
              const isActive = currentCategory === c;
              return `
              <button data-cat="${c}" class="category-filter-btn px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${isActive ? 'bg-[#231F1B] text-[#FAF7F2]' : 'bg-white dark:bg-[#141417] border border-kreato text-kreato-muted hover:text-kreato-main'}">
                ${c} <span class="text-[11px] font-mono opacity-80 tabular-nums">(${count})</span>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>

      <!-- Ideas Display Area -->
      ${
        filteredIdeas.length === 0
          ? `
        <div class="kreato-card p-12 text-center space-y-3">
          <div class="w-12 h-12 mx-auto rounded-full bg-[#EFE8D8] flex items-center justify-center text-kreato-muted">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <h3 class="text-sm font-bold text-kreato-main">Nenhuma ideia encontrada</h3>
          <p class="text-xs text-kreato-muted max-w-sm mx-auto">
            Não encontramos ideias correspondentes aos filtros atuais. Tente buscar outros termos ou adicione uma nova ideia.
          </p>
          <button id="empty-add-idea" class="px-4 py-2 bg-kreato-orange text-white text-xs font-semibold rounded-xl hover:bg-kreato-orange-hover transition-colors inline-flex items-center gap-1.5 shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Anotar Primeira Ideia</span>
          </button>
        </div>
      `
          : currentViewMode === 'grid'
          ? `
        <!-- GRID VIEW (Creative Visual Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredIdeas
            .map(idea => {
              const catStyle = getCategoryAccent(idea.category);
              return `
              <div class="kreato-card-interactive p-5 flex flex-col justify-between gap-4 cursor-pointer idea-card-item group" data-id="${idea.id}">
                <div class="space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2 text-xs">
                      <span class="font-semibold ${catStyle.text}">${escapeHtml(idea.category)}</span>
                      <span class="text-kreato-subtle">·</span>
                      ${getPlatformBadge(idea.platform)}
                    </div>

                    <button type="button" class="idea-fav-btn p-1 text-kreato-subtle hover:text-[#F28C45] transition-colors cursor-pointer" data-id="${idea.id}" title="${idea.isFavorite ? 'Desfavoritar' : 'Favoritar'}">
                      <svg class="w-4 h-4 ${idea.isFavorite ? 'text-[#F28C45] fill-current' : 'text-kreato-subtle'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                    </button>
                  </div>

                  <h3 class="text-sm font-bold text-kreato-main leading-snug group-hover:text-kreato-orange transition-colors">
                    ${escapeHtml(idea.title)}
                  </h3>

                  <p class="text-xs text-kreato-muted line-clamp-3 leading-relaxed">
                    ${escapeHtml(idea.description)}
                  </p>
                </div>

                <div class="space-y-3 pt-3 border-t border-kreato-subtle">
                  ${
                    idea.tags && idea.tags.length > 0
                      ? `
                    <div class="flex items-center gap-1.5 flex-wrap text-[11px] text-kreato-muted">
                      ${idea.tags.map(t => `<span class="bg-[#EDE5D5] px-2 py-0.5 rounded-md text-[10px] font-medium text-kreato-muted">#${escapeHtml(t)}</span>`).join('')}
                    </div>
                  `
                      : ''
                  }

                  <div class="flex items-center justify-between text-xs">
                    ${getStatusBadge(idea.status)}
                    <span class="text-kreato-subtle text-[11px]">${formatRelativeDate(idea.createdAt)}</span>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
          : `
        <!-- LIST VIEW -->
        <div class="kreato-card overflow-hidden divide-y divide-kreato-subtle">
          ${filteredIdeas
            .map(idea => {
              const catStyle = getCategoryAccent(idea.category);
              return `
              <div class="p-4 hover:bg-[#FAF7F2] dark:bg-[#141417] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 idea-card-item" data-id="${idea.id}">
                <div class="space-y-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2 text-xs">
                    <span class="font-semibold ${catStyle.text}">${escapeHtml(idea.category)}</span>
                    <span class="text-kreato-subtle">·</span>
                    ${getPlatformBadge(idea.platform)}
                    <span class="text-kreato-subtle">·</span>
                    <span class="text-kreato-muted text-[11px]">${formatRelativeDate(idea.createdAt)}</span>
                  </div>
                  <h3 class="text-xs font-bold text-kreato-main truncate">${escapeHtml(idea.title)}</h3>
                  <p class="text-xs text-kreato-muted truncate">${escapeHtml(idea.description)}</p>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                  ${getStatusBadge(idea.status)}
                  <button type="button" class="idea-fav-btn p-1 text-kreato-subtle hover:text-[#F28C45] transition-colors cursor-pointer" data-id="${idea.id}">
                    <svg class="w-4 h-4 ${idea.isFavorite ? 'text-[#F28C45] fill-current' : 'text-kreato-subtle'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  </button>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }
    </div>
  `;

  // Attach listeners
  container.querySelector('#btn-create-idea')?.addEventListener('click', () => openIdeaModal());
  container.querySelector('#empty-add-idea')?.addEventListener('click', () => openIdeaModal());

  // Search input
  const searchInput = container.querySelector('#ideas-search') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    currentSearch = (e.target as HTMLInputElement).value;
    renderIdeas(container);
  });
  container.querySelector('#clear-ideas-search')?.addEventListener('click', () => {
    currentSearch = '';
    renderIdeas(container);
  });

  // Status filter
  const statusFilter = container.querySelector('#ideas-status-filter') as HTMLSelectElement;
  statusFilter?.addEventListener('change', (e) => {
    currentStatus = (e.target as HTMLSelectElement).value;
    renderIdeas(container);
  });

  // Favorites filter
  container.querySelector('#filter-favorites-only')?.addEventListener('click', () => {
    if (currentCategory === 'favoritas') {
      currentCategory = 'todas';
    } else {
      currentCategory = 'favoritas';
    }
    renderIdeas(container);
  });

  // Category buttons
  container.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') || 'todas';
      currentCategory = cat;
      renderIdeas(container);
    });
  });

  // View mode switcher
  container.querySelector('#view-mode-grid')?.addEventListener('click', () => {
    currentViewMode = 'grid';
    renderIdeas(container);
  });
  container.querySelector('#view-mode-list')?.addEventListener('click', () => {
    currentViewMode = 'list';
    renderIdeas(container);
  });

  // Toggle favorite
  container.querySelectorAll('.idea-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        const item = storage.toggleFavoriteIdea(id);
        if (item) {
          showToast(item.isFavorite ? 'Ideia favoritada' : 'Ideia desmarcada', 'info');
          renderIdeas(container);
        }
      }
    });
  });

  // Open idea edit modal
  container.querySelectorAll('.idea-card-item').forEach(card => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.idea-fav-btn')) return;
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const idea = storage.getIdeas().find(i => i.id === id);
      if (idea) openIdeaModal(idea);
    });
  });
}
