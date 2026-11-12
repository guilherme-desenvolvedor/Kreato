import { renderLanding } from '../views/landing';
import { renderLogin } from '../views/login';
import { renderDashboard } from '../views/dashboard';
import { renderIdeas } from '../views/ideas';
import { renderAi } from '../views/ai';
import { renderScripts } from '../views/scripts';
import { renderPlanning } from '../views/planning';
import { renderLibrary } from '../views/library';
import { renderEvolution } from '../views/evolution';
import { renderSettings } from '../views/settings';
import { renderSuggestions } from '../views/suggestions';
import { storage } from '../services/storage';

export type PageName =
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'ideias'
  | 'ai'
  | 'roteiros'
  | 'planejamento'
  | 'biblioteca'
  | 'evolucao'
  | 'configuracoes'
  | 'sugestoes';

const PAGE_META: Record<PageName, { title: string; subtitle: string }> = {
  landing: { title: 'Kreato', subtitle: 'Estúdio Criativo para Criadores' },
  login: { title: 'Entrar', subtitle: 'Acesse seu Estúdio' },
  dashboard: { title: 'Dashboard', subtitle: 'Visão Geral do Criador' },
  ideias: { title: 'Minhas ideias', subtitle: 'Banco de Ideias e Conceitos' },
  ai: { title: 'Krea', subtitle: 'Copiloto Criativo Autoral' },
  roteiros: { title: 'Roteiros', subtitle: 'Estúdio de Escrita Estruturada' },
  planejamento: { title: 'Planejamento', subtitle: 'Calendário Editorial Multiplataforma' },
  biblioteca: { title: 'Biblioteca', subtitle: 'Acervo de Referências e Modelos' },
  evolucao: { title: 'Minha evolução', subtitle: 'Constância e Metas de Produção' },
  configuracoes: { title: 'Configurações', subtitle: 'Perfil e Preferências' },
  sugestoes: { title: 'Sugestões & Roadmap', subtitle: 'Futuras Implementações Colaborativas' },
};

export function navigateTo(page: PageName) {
  window.location.hash = page;
}

export function getCurrentPage(): PageName {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash in PAGE_META) {
    return hash as PageName;
  }
  // Default to landing if not logged in; default to dashboard if logged in
  return storage.isLoggedIn() ? 'dashboard' : 'landing';
}

export function initRouter() {
  const mainView = document.getElementById('main-view');
  const sidebar = document.getElementById('sidebar');
  const mobileHeader = document.getElementById('app-mobile-header');
  const desktopHeader = document.getElementById('app-desktop-header');
  const appMainColumn = document.getElementById('app-main-column');

  if (!mainView) return;

  const handleRoute = () => {
    let page = getCurrentPage();

    // Route Protection: If not logged in and requesting protected app page, route to login
    const isPublicPage = page === 'landing' || page === 'login';
    if (!isPublicPage && !storage.isLoggedIn()) {
      page = 'login';
      window.location.hash = 'login';
    }

    // Toggle Shell Visibility for Public vs App views
    if (isPublicPage) {
      if (sidebar) sidebar.style.display = 'none';
      if (mobileHeader) mobileHeader.style.display = 'none';
      if (desktopHeader) desktopHeader.style.display = 'none';
      mainView.className = 'w-full min-h-screen';
    } else if (page === 'ai') {
      if (sidebar) sidebar.style.display = '';
      if (mobileHeader) mobileHeader.style.display = '';
      if (desktopHeader) desktopHeader.style.display = '';
      sidebar?.classList.remove('hidden');
      mobileHeader?.classList.remove('hidden');
      desktopHeader?.classList.remove('hidden');
      mainView.className = 'flex-1 p-2 sm:p-4 md:p-8 max-w-7xl w-full mx-auto pb-2 md:pb-8 flex flex-col';
    } else {
      if (sidebar) sidebar.style.display = '';
      if (mobileHeader) mobileHeader.style.display = '';
      if (desktopHeader) desktopHeader.style.display = '';
      sidebar?.classList.remove('hidden');
      mobileHeader?.classList.remove('hidden');
      desktopHeader?.classList.remove('hidden');
      mainView.className = 'flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-12';
    }

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === page) {
        link.classList.remove('text-kreato-muted');
        link.classList.add('text-kreato-main', 'bg-[#FAF0E6]', 'dark:bg-[#2A231D]', 'font-bold');
      } else {
        link.classList.add('text-kreato-muted');
        link.classList.remove('text-kreato-main', 'bg-[#FAF0E6]', 'dark:bg-[#2A231D]', 'font-bold');
      }
    });

    // Update Header breadcrumb titles
    const meta = PAGE_META[page];
    const titleEl = document.getElementById('header-context-title');
    const subtitleEl = document.getElementById('header-context-subtitle');
    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle;

    // Update dynamic badge counts
    updateBadgeCounts();

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Render target view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (page) {
      case 'landing':
        renderLanding(mainView);
        break;
      case 'login':
        renderLogin(mainView);
        break;
      case 'dashboard':
        renderDashboard(mainView);
        break;
      case 'ideias':
        renderIdeas(mainView);
        break;
      case 'ai':
        renderAi(mainView);
        break;
      case 'roteiros':
        renderScripts(mainView);
        break;
      case 'planejamento':
        renderPlanning(mainView);
        break;
      case 'biblioteca':
        renderLibrary(mainView);
        break;
      case 'evolucao':
        renderEvolution(mainView);
        break;
      case 'configuracoes':
        renderSettings(mainView);
        break;
      case 'sugestoes':
        renderSuggestions(mainView);
        break;
      default:
        renderLanding(mainView);
    }
  };

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('kreato:auth-changed', handleRoute);
  handleRoute();
}

export function updateBadgeCounts() {
  const ideasCountEl = document.getElementById('nav-ideas-count');
  const scriptsCountEl = document.getElementById('nav-scripts-count');

  if (ideasCountEl) {
    ideasCountEl.textContent = String(storage.getIdeas().length);
  }
  if (scriptsCountEl) {
    scriptsCountEl.textContent = String(storage.getScripts().length);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');
  if (sidebar) sidebar.classList.add('-translate-x-full');
  if (backdrop) backdrop.classList.add('hidden');
}
