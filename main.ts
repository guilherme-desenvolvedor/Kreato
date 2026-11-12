import { initRouter, updateBadgeCounts, navigateTo, getCurrentPage } from './modules/router';
import { storage } from './services/storage';
import { authService } from './services/authService';
import { isSupabaseConfigured } from './services/supabase';
import { openIdeaModal, openScriptModal, openPublicationModal } from './modules/creationModals';
import { openModal } from './utils/modal';
import { showToast } from './utils/toast';
import { escapeHtml, getPlatformBadge } from './utils/formatters';
import './index.css';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme (Light / Dark)
  const savedTheme = storage.getTheme();
  storage.setTheme(savedTheme);
  updateThemeIcons(savedTheme);

  // 2. Setup Global Search
  setupGlobalSearch();

  // 3. Setup Mobile Sidebar & Backdrop Toggle
  setupMobileDrawer();

  // 4. Setup Quick Create Buttons
  setupQuickCreationTriggers();

  // 5. Setup Notifications Drawer / Popover
  setupNotifications();

  // 6. Setup Theme Toggles & Logout Action
  setupAppControls();

  // 7. Subscribe to Data Change Events for Reactive UI
  window.addEventListener('kreato:ideas-updated', () => {
    updateBadgeCounts();
    refreshActiveView();
  });
  window.addEventListener('kreato:scripts-updated', () => {
    updateBadgeCounts();
    refreshActiveView();
  });
  window.addEventListener('kreato:publications-updated', () => {
    refreshActiveView();
  });
  window.addEventListener('kreato:profile-updated', () => {
    syncProfileUI();
  });
  window.addEventListener('kreato:theme-changed', (e: any) => {
    updateThemeIcons(e.detail);
  });
  window.addEventListener('kreato:data-reset', () => {
    syncProfileUI();
    updateBadgeCounts();
    refreshActiveView();
  });

  // 8. Restaura a sessão do Supabase e carrega os dados do banco ANTES de
  //    iniciar o roteador, para que a rota protegida já saiba se há login.
  if (isSupabaseConfigured) {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await storage.startSession(session.user);
      }
    } catch (err) {
      console.error('[Kreator] Falha ao restaurar a sessão:', err);
    }

    // Reage a login, logout e renovação de token em qualquer aba.
    // (setTimeout evita chamar o Supabase de dentro do próprio callback de auth.)
    authService.onAuthStateChange((session) => {
      setTimeout(() => {
        if (session?.user) {
          void storage.startSession(session.user);
        } else if (storage.isLoggedIn()) {
          storage.logout();
        }
      }, 0);
    });
  }

  // 9. Sync User Profile with UI & start Router (Landing, Login, App Pages)
  syncProfileUI();
  initRouter();
});

function syncProfileUI() {
  const profile = storage.getProfile();

  const nameEl = document.getElementById('sidebar-username');
  const nicheEl = document.getElementById('sidebar-userniche');
  const avatarEl = document.getElementById('sidebar-avatar') as HTMLImageElement;
  const mobileAvatarEl = document.getElementById('mobile-avatar') as HTMLImageElement;

  if (nameEl) nameEl.textContent = profile.name;
  if (nicheEl) nicheEl.textContent = `${profile.handle} · ${profile.niche}`;
  // Sem foto no perfil, usa o logo (o HTML traz uma foto de exemplo que não deve aparecer para usuários reais)
  const avatarSrc = profile.avatarUrl || '/logo.png';
  if (avatarEl) avatarEl.src = avatarSrc;
  if (mobileAvatarEl) mobileAvatarEl.src = avatarSrc;

  // onclick (e não addEventListener) para não empilhar listeners a cada atualização do perfil
  const userCard = document.getElementById('sidebar-user-card');
  if (userCard) userCard.onclick = () => navigateTo('configuracoes');
  if (mobileAvatarEl) mobileAvatarEl.onclick = () => navigateTo('configuracoes');
}

function setupAppControls() {
  // Desktop theme toggle
  document.getElementById('desktop-theme-toggle')?.addEventListener('click', () => {
    const next = storage.toggleTheme();
    showToast(`Modo ${next === 'dark' ? 'Escuro' : 'Claro'} ativado`, 'info', 2000);
  });

  // Mobile theme toggle
  document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => {
    const next = storage.toggleTheme();
    showToast(`Modo ${next === 'dark' ? 'Escuro' : 'Claro'} ativado`, 'info', 2000);
  });

  // Sidebar Logout button
  document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
    if (confirm('Deseja encerrar sua sessão no Kreato?')) {
      if (isSupabaseConfigured) {
        await authService.signOut();
      }
      storage.logout();
      showToast('Sessão encerrada com sucesso.', 'info');
      navigateTo('landing');
    }
  });

  // PWA Install Button Handler
  document.getElementById('pwa-sidebar-install-btn')?.addEventListener('click', async () => {
    const { pwaService } = await import('./services/pwa');
    if (pwaService.isInstalled()) {
      showToast('Kreato já está instalado no seu dispositivo!', 'info');
      return;
    }
    if (pwaService.isIOS()) {
      pwaService.showIOSInstructions();
      return;
    }
    const success = await pwaService.promptInstall();
    if (!success) {
      showToast('Para instalar: toque no menu do navegador e escolha "Instalar Aplicativo".', 'info');
    }
  });
}

function updateThemeIcons(theme: 'light' | 'dark') {
  const icon = document.getElementById('theme-toggle-icon');
  if (!icon) return;

  if (theme === 'dark') {
    // Sun icon
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>`;
    icon.classList.remove('text-kreato-purple');
    icon.classList.add('text-kreato-yellow');
  } else {
    // Moon icon
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>`;
    icon.classList.remove('text-kreato-yellow');
    icon.classList.add('text-kreato-purple');
  }
}

function setupMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');

  const openDrawer = () => {
    sidebar?.classList.remove('-translate-x-full');
    backdrop?.classList.remove('hidden');
  };

  const closeDrawer = () => {
    sidebar?.classList.add('-translate-x-full');
    backdrop?.classList.add('hidden');
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
}

function setupQuickCreationTriggers() {
  const openNewCreationModal = () => {
    const contentHtml = `
      <div class="space-y-3">
        <p class="text-xs text-kreato-muted">O que você gostaria de criar agora?</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button id="quick-create-idea-opt" class="p-4 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#E9BD4D]/15 text-[#D9A629] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
            <div class="text-xs font-bold text-kreato-main">Anotar Ideia</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Captura rápida no seu acervo</div>
          </button>

          <button id="quick-create-script-opt" class="p-4 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#527DBB]/15 text-[#527DBB] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <div class="text-xs font-bold text-kreato-main">Criar Roteiro</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Gancho, corpo e CTA no estúdio</div>
          </button>

          <button id="quick-create-pub-opt" class="p-4 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left transition-all hover:border-[#D9CCA8] cursor-pointer group">
            <div class="w-8 h-8 rounded-lg bg-[#F28C45]/15 text-[#F28C45] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="text-xs font-bold text-kreato-main">Planejar Post</div>
            <div class="text-[11px] text-kreato-muted mt-0.5">Agendar data no calendário</div>
          </button>
        </div>
      </div>
    `;

    openModal({
      title: 'Criar Novo Conteúdo',
      contentHtml,
      hideFooter: true,
      onOpen: (modalEl) => {
        modalEl.querySelector('#quick-create-idea-opt')?.addEventListener('click', () => {
          (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
          openIdeaModal();
        });
        modalEl.querySelector('#quick-create-script-opt')?.addEventListener('click', () => {
          (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
          openScriptModal();
        });
        modalEl.querySelector('#quick-create-pub-opt')?.addEventListener('click', () => {
          (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
          openPublicationModal();
        });
      }
    });
  };

  document.getElementById('sidebar-quick-create')?.addEventListener('click', openNewCreationModal);
  document.getElementById('header-quick-create')?.addEventListener('click', openNewCreationModal);
  document.getElementById('quick-create-mobile-btn')?.addEventListener('click', openNewCreationModal);
}

function setupGlobalSearch() {
  const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
  const searchClear = document.getElementById('global-search-clear');
  const searchMobileBtn = document.getElementById('global-search-mobile-btn');

  const executeSearch = (query: string) => {
    if (!query.trim()) return;

    const term = query.trim().toLowerCase();
    const ideas = storage.getIdeas().filter(i =>
      i.title.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term) ||
      i.tags?.some(t => t.toLowerCase().includes(term))
    );
    const scripts = storage.getScripts().filter(s =>
      s.title.toLowerCase().includes(term) ||
      s.hook.toLowerCase().includes(term) ||
      s.body.toLowerCase().includes(term)
    );
    const pubs = storage.getPublications().filter(p =>
      p.title.toLowerCase().includes(term)
    );

    const totalResults = ideas.length + scripts.length + pubs.length;

    const contentHtml = `
      <div class="space-y-4">
        <div class="text-xs text-kreato-muted">
          Exibindo <strong>${totalResults}</strong> resultados para a busca "<span class="text-kreato-main font-semibold">${escapeHtml(query)}</span>"
        </div>

        ${totalResults === 0 ? `
          <div class="p-8 text-center text-xs text-kreato-muted">
            Nenhum resultado encontrado para o termo pesquisado.
          </div>
        ` : `
          <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            ${ideas.length > 0 ? `
              <div class="space-y-2">
                <div class="text-[11px] font-bold text-kreato-subtle uppercase tracking-wider">Ideias (${ideas.length})</div>
                <div class="space-y-1.5">
                  ${ideas.map(i => `
                    <div class="p-3 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl cursor-pointer search-result-idea transition-colors" data-id="${i.id}">
                      <div class="flex items-center gap-2 text-[10px] mb-1">
                        <span class="font-semibold text-kreato-orange">${i.category}</span>
                        <span class="text-kreato-subtle">·</span>
                        ${getPlatformBadge(i.platform)}
                      </div>
                      <div class="text-xs font-bold text-kreato-main">${escapeHtml(i.title)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${scripts.length > 0 ? `
              <div class="space-y-2">
                <div class="text-[11px] font-bold text-kreato-subtle uppercase tracking-wider">Roteiros (${scripts.length})</div>
                <div class="space-y-1.5">
                  ${scripts.map(s => `
                    <div class="p-3 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl cursor-pointer search-result-script transition-colors" data-id="${s.id}">
                      <div class="flex items-center gap-2 text-[10px] mb-1">
                        ${getPlatformBadge(s.platform)}
                        <span class="text-kreato-subtle">·</span>
                        <span class="text-kreato-muted">${s.format}</span>
                      </div>
                      <div class="text-xs font-bold text-kreato-main">${escapeHtml(s.title)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${pubs.length > 0 ? `
              <div class="space-y-2">
                <div class="text-[11px] font-bold text-kreato-subtle uppercase tracking-wider">Planejamento (${pubs.length})</div>
                <div class="space-y-1.5">
                  ${pubs.map(p => `
                    <div class="p-3 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl cursor-pointer search-result-pub transition-colors" data-id="${p.id}">
                      <div class="flex items-center gap-2 text-[10px] mb-1">
                        ${getPlatformBadge(p.platform)}
                        <span class="text-kreato-subtle">·</span>
                        <span class="text-kreato-muted font-mono">${p.scheduledDate}</span>
                      </div>
                      <div class="text-xs font-bold text-kreato-main">${escapeHtml(p.title)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `}
      </div>
    `;

    openModal({
      title: 'Resultados da Busca Global',
      contentHtml,
      hideFooter: true,
      onOpen: (modalEl) => {
        modalEl.querySelectorAll('.search-result-idea').forEach(el => {
          el.addEventListener('click', () => {
            const id = el.getAttribute('data-id');
            const item = storage.getIdeas().find(i => i.id === id);
            (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
            if (item) openIdeaModal(item);
          });
        });

        modalEl.querySelectorAll('.search-result-script').forEach(el => {
          el.addEventListener('click', () => {
            (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
            navigateTo('roteiros');
          });
        });

        modalEl.querySelectorAll('.search-result-pub').forEach(el => {
          el.addEventListener('click', () => {
            const id = el.getAttribute('data-id');
            const pub = storage.getPublications().find(p => p.id === id);
            (modalEl.querySelector('#modal-close-icon') as HTMLElement)?.click();
            if (pub) openPublicationModal(pub);
          });
        });
      }
    });
  };

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeSearch(searchInput.value);
    }
  });

  searchInput?.addEventListener('input', () => {
    if (searchInput.value) {
      searchClear?.classList.remove('hidden');
    } else {
      searchClear?.classList.add('hidden');
    }
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.add('hidden');
  });

  searchMobileBtn?.addEventListener('click', () => {
    const query = prompt('O que deseja buscar no Kreato?');
    if (query) executeSearch(query);
  });
}

function setupNotifications() {
  document.getElementById('header-notifications-btn')?.addEventListener('click', () => {
    const contentHtml = `
      <div class="space-y-3">
        <div class="p-3 bg-white dark:bg-[#1A1613] border border-kreato rounded-xl space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-kreato-main">
            <span>Publicação de Reels Amanhã</span>
            <span class="text-[10px] text-kreato-orange font-mono">18:30</span>
          </div>
          <p class="text-[11px] text-kreato-muted">"A anatomia do gancho de 3 segundos" está agendada para publicação no Instagram.</p>
        </div>

        <div class="p-3 bg-white dark:bg-[#1A1613] border border-kreato rounded-xl space-y-1">
          <div class="flex items-center justify-between text-xs font-bold text-kreato-main">
            <span>Meta Semanal no Alvo</span>
            <span class="text-[10px] text-[#2D8A56] font-mono">3 / 4 posts</span>
          </div>
          <p class="text-[11px] text-kreato-muted">Você está a 1 post de cumprir sua meta semanal de consistência!</p>
        </div>
      </div>
    `;

    openModal({
      title: 'Notificações do Estúdio',
      contentHtml,
      hideFooter: true
    });
  });
}

function refreshActiveView() {
  const page = getCurrentPage();
  const mainView = document.getElementById('main-view');
  if (!mainView) return;

  if (page === 'dashboard') {
    import('./views/dashboard').then(m => m.renderDashboard(mainView));
  } else if (page === 'ideias') {
    import('./views/ideas').then(m => m.renderIdeas(mainView));
  } else if (page === 'ai') {
    import('./views/ai').then(m => m.renderAi(mainView));
  } else if (page === 'roteiros') {
    import('./views/scripts').then(m => m.renderScripts(mainView));
  } else if (page === 'planejamento') {
    import('./views/planning').then(m => m.renderPlanning(mainView));
  } else if (page === 'biblioteca') {
    import('./views/library').then(m => m.renderLibrary(mainView));
  } else if (page === 'evolucao') {
    import('./views/evolution').then(m => m.renderEvolution(mainView));
  } else if (page === 'configuracoes') {
    import('./views/settings').then(m => m.renderSettings(mainView));
  } else if (page === 'sugestoes') {
    import('./views/suggestions').then(m => m.renderSuggestions(mainView));
  }
}
