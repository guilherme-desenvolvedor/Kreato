import { storage } from '../services/storage';
import { formatRelativeDate, getCategoryAccent, getPlatformBadge, getStatusBadge, escapeHtml } from '../utils/formatters';
import { openIdeaModal, openScriptModal, openPublicationModal } from '../modules/creationModals';
import { navigateTo } from '../modules/router';
import { showToast } from '../utils/toast';

export function renderDashboard(container: HTMLElement) {
  const profile = storage.getProfile();
  const ideas = storage.getIdeas();
  const scripts = storage.getScripts();
  const publications = storage.getPublications();

  const totalIdeas = ideas.length;
  const totalScripts = scripts.length;
  const plannedCount = publications.filter(p => p.status === 'agendado' || p.status === 'pronto').length;
  const publishedCount = publications.filter(p => p.status === 'publicado').length;

  const recentIdeas = ideas.slice(0, 4);
  const upcomingPubs = publications
    .filter(p => p.status !== 'publicado')
    .sort((a, b) => (a.scheduledDate > b.scheduledDate ? 1 : -1))
    .slice(0, 4);

  // Time-based greeting in Portuguese
  const hour = new Date().getHours();
  let greeting = 'Bom dia';
  if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  else if (hour >= 18 || hour < 5) greeting = 'Boa noite';

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  container.innerHTML = `
    <div class="space-y-8 animate-in fade-in duration-200">
      <!-- 1. Editorial Welcome Hero Banner -->
      <section class="relative overflow-hidden bg-gradient-to-br from-[#FAF7F2] to-[#F3ECE0] dark:from-[#141417] dark:to-[#1C1C22] border border-kreato rounded-2xl p-6 md:p-8">
        <div class="relative z-10 max-w-2xl space-y-3">
          <div class="flex items-center gap-2 text-xs text-kreato-muted font-medium">
            <span>${greeting}, ${escapeHtml(profile.name.split(' ')[0])}</span>
            <span class="text-kreato-subtle">·</span>
            <span class="capitalize">${todayStr}</span>
          </div>

          <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-kreato-main tracking-tight text-balance leading-tight">
            Suas próximas grandes ideias começam aqui.
          </h1>

          <p class="text-xs sm:text-sm text-kreato-muted max-w-xl leading-relaxed">
            Organize seu fluxo autoral, estruture roteiros de alta retenção e transforme conceitos brutos em publicações com identidade própria.
          </p>

          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button id="dash-btn-create-idea" class="px-4 py-2.5 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer group">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>Criar nova ideia</span>
            </button>
            <button id="dash-btn-create-script" class="px-4 py-2.5 bg-[#EFE8D8] hover:bg-[#E5DCCB] dark:bg-[#1E1E24] dark:hover:bg-[#27272E] text-kreato-main text-xs font-semibold rounded-xl border border-kreato transition-colors flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-kreato-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>Escrever roteiro</span>
            </button>
          </div>
        </div>

        <!-- Subtle aesthetic background geometric motif -->
        <div class="absolute -right-8 -bottom-10 w-64 h-64 rounded-full bg-[#EBE2D0]/40 dark:bg-kreato-orange/10 pointer-events-none blur-2xl"></div>
        <div class="absolute right-12 top-6 hidden lg:flex flex-col items-end gap-2 text-right">
          <div class="p-3 bg-kreato-surface border border-kreato rounded-xl shadow-xs text-left max-w-xs">
            <div class="text-[10px] text-kreato-muted font-semibold uppercase tracking-wider">Foco Criativo do Mês</div>
            <div class="text-xs font-medium text-kreato-main mt-0.5">${escapeHtml(profile.niche)}</div>
            <div class="mt-2 flex items-center justify-between text-[11px] text-kreato-muted">
              <span>Meta semanal: ${profile.targetPostsPerWeek} posts</span>
              <span class="text-[#2D8A56] font-semibold">92% no ritmo</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Resumo da Produção (Metric cards with tabular numbers) -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-kreato-muted text-xs">
            <span>Total de ideias</span>
            <div class="w-7 h-7 rounded-lg bg-[#E9BD4D]/15 flex items-center justify-center text-[#E9BD4D]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-kreato-main font-mono tabular-nums">${totalIdeas}</span>
            <span class="text-[11px] text-kreato-muted ml-1.5">no acervo</span>
          </div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-kreato-muted text-xs">
            <span>Roteiros no estúdio</span>
            <div class="w-7 h-7 rounded-lg bg-[#527DBB]/15 flex items-center justify-center text-[#527DBB]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-kreato-main font-mono tabular-nums">${totalScripts}</span>
            <span class="text-[11px] text-kreato-muted ml-1.5">desenvolvidos</span>
          </div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-kreato-muted text-xs">
            <span>Conteúdos planejados</span>
            <div class="w-7 h-7 rounded-lg bg-[#F28C45]/15 flex items-center justify-center text-[#F28C45]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-kreato-main font-mono tabular-nums">${plannedCount}</span>
            <span class="text-[11px] text-kreato-muted ml-1.5">no cronograma</span>
          </div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-kreato-muted text-xs">
            <span>Publicações feitas</span>
            <div class="w-7 h-7 rounded-lg bg-[#9274C8]/15 flex items-center justify-center text-[#9274C8]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-bold tracking-tight text-kreato-main font-mono tabular-nums">${publishedCount}</span>
            <span class="text-[11px] text-kreato-muted ml-1.5">no ar</span>
          </div>
        </div>
      </section>

      <!-- 3. Área de Criação Rápida (Atalhos estruturados) -->
      <section class="p-5 bg-kreato-surface border border-kreato rounded-2xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-kreato-main">Ações Rápidas de Criação</h2>
            <p class="text-xs text-kreato-muted">Atalhos diretos para cada etapa do seu ciclo produtivo</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button id="quick-add-idea" class="p-3.5 bg-white dark:bg-[#141417] hover:bg-kreato-surface-hover dark:hover:bg-[#1C1C21] border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#E9BD4D]/15 text-[#D9A629] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </div>
            <div class="text-xs font-semibold text-kreato-main">Anotar Ideia</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Captura rápida sem filtros</div>
          </button>

          <button id="quick-add-script" class="p-3.5 bg-white dark:bg-[#141417] hover:bg-kreato-surface-hover dark:hover:bg-[#1C1C21] border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#527DBB]/15 text-[#527DBB] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <div class="text-xs font-semibold text-kreato-main">Criar Roteiro</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Gancho, corpo e CTA</div>
          </button>

          <button id="quick-add-plan" class="p-3.5 bg-white dark:bg-[#141417] hover:bg-kreato-surface-hover dark:hover:bg-[#1C1C21] border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#F28C45]/15 text-[#F28C45] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="text-xs font-semibold text-kreato-main">Planejar Post</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Agendar no calendário</div>
          </button>

          <button id="quick-open-ai" class="p-3.5 bg-white dark:bg-[#141417] hover:bg-kreato-surface-hover dark:hover:bg-[#1C1C21] border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#9274C8]/15 text-[#9274C8] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="text-xs font-semibold text-kreato-main">Copiloto Krea</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Desbloquear ideação</div>
          </button>
        </div>
      </section>

      <!-- 4. Krea Workspace Spark -->
      <section class="p-5 bg-gradient-to-r from-kreato-surface to-[#F5EFF9] dark:from-[#141417] dark:to-[#1D132B] border border-[#9274C8]/30 rounded-2xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-[#9274C8] flex items-center justify-center text-white shadow-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <h2 class="text-xs font-bold text-kreato-main">Copiloto Criativo Krea</h2>
              <p class="text-[11px] text-kreato-muted">Inicie uma sessão de criação assistida com prompts especializados</p>
            </div>
          </div>

          <a href="#ai" class="text-xs font-semibold text-[#9274C8] hover:text-[#7C5BB5] flex items-center gap-1 transition-colors">
            <span>Abrir estúdio Krea</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button data-ai-prompt="Gere 5 ganchos magnéticos para Reels sobre o tema de organização criativa para designers" class="dash-ai-prompt-btn p-3 bg-white/90 dark:bg-[#141417] hover:bg-white dark:hover:bg-[#1C1C21] border border-[#9274C8]/20 rounded-xl text-left text-xs font-medium text-kreato-main transition-colors cursor-pointer flex items-center justify-between group">
            <span class="truncate pr-2">"5 ganchos de alta retenção para Reels"</span>
            <span class="text-[#9274C8] opacity-60 group-hover:opacity-100 font-bold">→</span>
          </button>
          <button data-ai-prompt="Como transformar um vídeo longo do YouTube em 3 posts de texto para o LinkedIn e 1 carrossel?" class="dash-ai-prompt-btn p-3 bg-white/90 dark:bg-[#141417] hover:bg-white dark:hover:bg-[#1C1C21] border border-[#9274C8]/20 rounded-xl text-left text-xs font-medium text-kreato-main transition-colors cursor-pointer flex items-center justify-between group">
            <span class="truncate pr-2">"Repurposing: YouTube para LinkedIn"</span>
            <span class="text-[#9274C8] opacity-60 group-hover:opacity-100 font-bold">→</span>
          </button>
          <button data-ai-prompt="Escreva uma chamada para ação (CTA) que convide a audiência a comentar sem parecer desesperada" class="dash-ai-prompt-btn p-3 bg-white/90 dark:bg-[#141417] hover:bg-white dark:hover:bg-[#1C1C21] border border-[#9274C8]/20 rounded-xl text-left text-xs font-medium text-kreato-main transition-colors cursor-pointer flex items-center justify-between group">
            <span class="truncate pr-2">"Escrever CTA conversivo e natural"</span>
            <span class="text-[#9274C8] opacity-60 group-hover:opacity-100 font-bold">→</span>
          </button>
        </div>
      </section>

      <!-- 5. Split Section: Ideias Recentes & Próximas Publicações -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ideias Recentes -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-kreato-main">Ideias Recentes</h2>
              <p class="text-xs text-kreato-muted">Últimas ideias capturadas no seu acervo</p>
            </div>
            <a href="#ideias" class="text-xs font-semibold text-kreato-orange hover:underline">Ver todas (${totalIdeas})</a>
          </div>

          <div class="space-y-2.5">
            ${
              recentIdeas.length === 0
                ? `<div class="kreato-card p-6 text-center text-xs text-kreato-muted">Nenhuma ideia cadastrada ainda.</div>`
                : recentIdeas
                    .map(idea => {
                      const catStyle = getCategoryAccent(idea.category);
                      return `
                <div class="kreato-card-interactive p-4 cursor-pointer flex flex-col justify-between gap-2.5 dash-idea-card" data-id="${idea.id}">
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1 min-w-0">
                      <div class="flex items-center gap-2 text-[11px]">
                        <span class="font-semibold ${catStyle.text}">${escapeHtml(idea.category)}</span>
                        <span class="text-kreato-subtle">·</span>
                        ${getPlatformBadge(idea.platform)}
                        <span class="text-kreato-subtle">·</span>
                        <span class="text-kreato-muted">${formatRelativeDate(idea.createdAt)}</span>
                      </div>
                      <h3 class="text-xs font-bold text-kreato-main leading-snug truncate">${escapeHtml(idea.title)}</h3>
                    </div>

                    <button type="button" class="dash-fav-btn p-1 text-kreato-subtle hover:text-[#F28C45] transition-colors cursor-pointer" data-id="${idea.id}" title="${idea.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}">
                      <svg class="w-4 h-4 ${idea.isFavorite ? 'text-[#F28C45] fill-current' : 'text-kreato-subtle'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                    </button>
                  </div>

                  <p class="text-xs text-kreato-muted line-clamp-2 leading-relaxed">
                    ${escapeHtml(idea.description)}
                  </p>

                  <div class="flex items-center justify-between pt-1 border-t border-kreato-subtle text-[11px]">
                    ${getStatusBadge(idea.status)}
                    <span class="text-kreato-orange font-semibold hover:underline flex items-center gap-1">
                      <span>Ver detalhes</span>
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </section>

        <!-- Próximas Publicações -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-kreato-main">Próximas Publicações</h2>
              <p class="text-xs text-kreato-muted">Cronograma dos próximos dias no calendário</p>
            </div>
            <a href="#planejamento" class="text-xs font-semibold text-kreato-orange hover:underline">Ver calendário</a>
          </div>

          <div class="space-y-2.5">
            ${
              upcomingPubs.length === 0
                ? `<div class="kreato-card p-6 text-center text-xs text-kreato-muted">Nenhum conteúdo agendado. Clique em Planejar Post para adicionar.</div>`
                : upcomingPubs
                    .map(pub => {
                      const d = new Date(pub.scheduledDate + 'T' + pub.scheduledTime + ':00');
                      const dateStr = isNaN(d.getTime())
                        ? pub.scheduledDate
                        : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d);

                      return `
                <div class="kreato-card-interactive p-4 cursor-pointer flex items-center justify-between gap-4 dash-pub-card" data-id="${pub.id}">
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2 text-[11px]">
                      ${getPlatformBadge(pub.platform)}
                      <span class="text-kreato-subtle">·</span>
                      <span class="text-kreato-muted font-mono tabular-nums">${dateStr} às ${pub.scheduledTime}</span>
                    </div>
                    <h3 class="text-xs font-bold text-kreato-main truncate">${escapeHtml(pub.title)}</h3>
                  </div>

                  <div class="shrink-0">
                    ${getStatusBadge(pub.status)}
                  </div>
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </section>
      </div>
    </div>
  `;

  // Attach event listeners for dashboard
  container.querySelector('#dash-btn-create-idea')?.addEventListener('click', () => openIdeaModal());
  container.querySelector('#dash-btn-create-script')?.addEventListener('click', () => openScriptModal());
  container.querySelector('#quick-add-idea')?.addEventListener('click', () => openIdeaModal());
  container.querySelector('#quick-add-script')?.addEventListener('click', () => openScriptModal());
  container.querySelector('#quick-add-plan')?.addEventListener('click', () => openPublicationModal());
  container.querySelector('#quick-open-ai')?.addEventListener('click', () => navigateTo('ai'));

  // AI prompt buttons
  container.querySelectorAll('.dash-ai-prompt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prompt = (e.currentTarget as HTMLElement).getAttribute('data-ai-prompt');
      if (prompt) {
        sessionStorage.setItem('kreato_pending_ai_prompt', prompt);
        navigateTo('ai');
      }
    });
  });

  // Favorite button toggle
  container.querySelectorAll('.dash-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        const updated = storage.toggleFavoriteIdea(id);
        if (updated) {
          showToast(updated.isFavorite ? 'Ideia marcada como favorita' : 'Ideia desmarcada dos favoritos', 'info');
          renderDashboard(container);
        }
      }
    });
  });

  // Open idea details
  container.querySelectorAll('.dash-idea-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.dash-fav-btn')) return;
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const idea = storage.getIdeas().find(i => i.id === id);
      if (idea) openIdeaModal(idea);
    });
  });

  // Open pub details
  container.querySelectorAll('.dash-pub-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const pub = storage.getPublications().find(p => p.id === id);
      if (pub) openPublicationModal(pub);
    });
  });
}
