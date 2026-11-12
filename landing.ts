import { navigateTo } from '../modules/router';
import { storage } from '../services/storage';

export function renderLanding(container: HTMLElement) {
  const currentTheme = storage.getTheme();
  const isDark = currentTheme === 'dark';

  container.innerHTML = `
    <div class="min-h-screen bg-kreato-bg text-kreato-main flex flex-col font-sans selection:bg-orange-200 selection:text-orange-950">
      <!-- 1. Top Bar Contract (3 zones) -->
      <header class="sticky top-0 z-40 bg-kreato-surface/90 backdrop-blur-md border-b border-kreato">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <!-- Zone 1: Single text element wordmark + Logo -->
          <a href="#landing" class="flex items-center gap-3 whitespace-nowrap shrink-0 group">
            <img src="/logo.png" alt="Logo Kreato" class="w-11 h-11 object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
            <div class="flex flex-col">
              <span class="font-extrabold tracking-tight text-2xl text-kreato-main leading-none">Kreato</span>
              <span class="text-[10px] font-semibold text-kreato-muted tracking-widest uppercase">Creator Studio</span>
            </div>
          </a>

          <!-- Zone 2: 3 clean single-line nav links -->
          <nav class="hidden md:flex items-center gap-8 text-xs font-semibold text-kreato-muted">
            <a href="#recursos" class="hover:text-kreato-main transition-colors whitespace-nowrap shrink-0">Recursos</a>
            <a href="#krea" class="hover:text-kreato-main transition-colors whitespace-nowrap shrink-0">Copiloto Krea</a>
            <a href="#metodo" class="hover:text-kreato-main transition-colors whitespace-nowrap shrink-0">Como Funciona</a>
          </nav>

          <!-- Zone 3: 1 primary action + theme toggle -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- Theme Toggle -->
            <button id="landing-theme-toggle" type="button" class="p-2 rounded-xl text-kreato-muted hover:text-kreato-main hover:bg-kreato-surface transition-colors cursor-pointer" title="Alternar Modo Escuro / Claro">
              ${isDark
                ? `<svg class="w-4 h-4 text-kreato-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
                : `<svg class="w-4 h-4 text-kreato-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`
              }
            </button>

            <a href="#login" class="text-xs font-semibold text-kreato-main hover:text-kreato-orange transition-colors px-2 py-1.5 whitespace-nowrap shrink-0">
              Entrar
            </a>

            <button id="landing-hero-cta-btn" class="px-4 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer">
              Começar Grátis
            </button>
          </div>
        </div>
      </header>

      <!-- 2. Hero Section -->
      <section class="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div class="max-w-5xl mx-auto px-6 text-center space-y-6">
          <!-- Kicker Tag -->
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-kreato-surface border border-kreato rounded-full text-xs text-kreato-muted font-medium shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-kreato-orange"></span>
            <span>A nova casa dos criadores de conteúdo independentes</span>
          </div>

          <!-- Hero Headline -->
          <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-kreato-main leading-[1.15] text-balance max-w-4xl mx-auto">
            O estúdio criativo onde ideias se tornam conteúdos inesquecíveis.
          </h1>

          <!-- Supporting Text -->
          <p class="text-sm sm:text-base text-kreato-muted max-w-2xl mx-auto leading-relaxed">
            Elimine o bloqueio criativo com um fluxo contínuo de captura de ideias, estúdio focado de roteirização, calendário editorial e o copiloto de inteligência autoral <strong>Krea</strong>.
          </p>

          <!-- Hero Actions -->
          <div class="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button id="landing-primary-start" class="px-6 py-3 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:scale-[1.02] cursor-pointer flex items-center gap-2">
              <span>Criar Conta Gratuita</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>

            <button id="landing-demo-start" class="px-6 py-3 bg-kreato-surface hover:bg-kreato-surface-hover text-kreato-main border border-kreato text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2">
              <svg class="w-4 h-4 text-kreato-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Ver Demonstração Interativa</span>
            </button>
          </div>

          <!-- Proof Metric Strip (Claim-to-Proof Adjacency) -->
          <div class="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-kreato-muted">
            <div class="flex items-center gap-1.5 font-mono tabular-nums">
              <strong class="text-kreato-main font-bold">12.000+</strong> roteiros produzidos
            </div>
            <span class="text-kreato-subtle">·</span>
            <div class="flex items-center gap-1.5 font-mono tabular-nums">
              <strong class="text-kreato-main font-bold">45.000+</strong> ideias capturadas
            </div>
            <span class="text-kreato-subtle">·</span>
            <div class="flex items-center gap-1.5">
              <strong class="text-kreato-main font-bold">94%</strong> taxa de consistência
            </div>
          </div>

          <!-- Product Showcase Mockup Card -->
          <div class="pt-8 max-w-5xl mx-auto">
            <div class="kreato-card p-3 sm:p-5 shadow-xl border border-kreato overflow-hidden relative group">
              <!-- Visual UI Mockup -->
              <div class="rounded-xl overflow-hidden bg-[#FAF7F2] dark:bg-[#1C1814] border border-kreato/70 text-left">
                <!-- Mock Top Header -->
                <div class="px-4 py-3 bg-[#F5EFE4] dark:bg-[#25201A] border-b border-kreato flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="flex gap-1.5">
                      <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <span class="text-[11px] font-semibold text-kreato-muted ml-2">Kreato Studio — Marina Silva</span>
                  </div>
                  <span class="text-[10px] font-mono text-kreato-muted">kreato.studio/app</span>
                </div>

                <!-- Mock Dashboard Body Preview -->
                <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Col 1: Ideias -->
                  <div class="p-4 bg-white dark:bg-[#221C18] border border-kreato rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-kreato-yellow">Produtividade</span>
                      <span class="text-kreato-subtle">YouTube</span>
                    </div>
                    <div class="text-xs font-bold text-kreato-main">A regra dos 3 segundos no Reels</div>
                    <p class="text-[11px] text-kreato-muted">Análise de retenção mostrando por que o primeiro frame define o vídeo.</p>
                  </div>

                  <!-- Col 2: Roteiro -->
                  <div class="p-4 bg-white dark:bg-[#221C18] border border-kreato rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-kreato-blue">Roteiro Ativo</span>
                      <span class="font-mono text-kreato-muted">142 palavras</span>
                    </div>
                    <div class="text-xs font-bold text-kreato-main">1. Gancho de Quebra</div>
                    <div class="p-2 bg-[#FAF7F2] dark:bg-[#181512] rounded text-[10px] text-kreato-muted font-mono">
                      "Se os primeiros 3s fossem um trailer de cinema..."
                    </div>
                  </div>

                  <!-- Col 3: Krea Spark -->
                  <div class="p-4 bg-gradient-to-br from-[#FAF7F2] to-[#F5EFF9] dark:from-[#221C18] dark:to-[#2B2035] border border-kreato-purple/30 rounded-xl space-y-2">
                    <div class="flex items-center gap-1.5 text-[11px] font-bold text-kreato-purple">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span>Copiloto Krea</span>
                    </div>
                    <div class="text-xs font-bold text-kreato-main">3 Ganchos Gerados</div>
                    <p class="text-[11px] text-kreato-muted">"Pronto para exportar para o estúdio de roteiro."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Recursos Principais (Features Grid) -->
      <section id="recursos" class="py-16 md:py-24 border-t border-kreato bg-kreato-surface">
        <div class="max-w-6xl mx-auto px-6 space-y-12">
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <h2 class="text-xs font-bold text-kreato-orange uppercase tracking-wider">Recursos Feitos para Criadores</h2>
            <h3 class="text-2xl sm:text-3xl font-extrabold text-kreato-main tracking-tight">
              Tudo o que você precisa para criar com consistência.
            </h3>
            <p class="text-xs sm:text-sm text-kreato-muted">
              Chega de espalhar ideias entre notas soltas, planilhas confusas e mensagens enviadas para você mesmo no WhatsApp.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <!-- 1. Ideias -->
            <div class="kreato-card p-6 space-y-3">
              <div class="w-10 h-10 rounded-xl bg-[#E9BD4D]/15 text-[#E9BD4D] flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-kreato-main">Banco de Ideias Inteligente</h4>
              <p class="text-xs text-kreato-muted leading-relaxed">
                Capture fagulhas de inspiração em segundos. Categorize por tema, plataforma, marque favoritas e nunca mais perca um insight criativo.
              </p>
            </div>

            <!-- 2. Roteiros -->
            <div class="kreato-card p-6 space-y-3">
              <div class="w-10 h-10 rounded-xl bg-[#527DBB]/15 text-[#527DBB] flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-kreato-main">Estúdio de Roteirização</h4>
              <p class="text-xs text-kreato-muted leading-relaxed">
                Escreva com foco usando a estrutura comprovada de retenção: Gancho de abertura, Desenvolvimento e Chamada para Ação com tempo de fala.
              </p>
            </div>

            <!-- 3. Krea -->
            <div class="kreato-card p-6 space-y-3">
              <div class="w-10 h-10 rounded-xl bg-[#9274C8]/15 text-[#9274C8] flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-kreato-main">Copiloto Criativo Krea</h4>
              <p class="text-xs text-kreato-muted leading-relaxed">
                Inteligência artificial feita para criadores: gere novos ângulos, melhore ganchos, reescreva vídeos em carrosséis e monte legendas com SEO.
              </p>
            </div>

            <!-- 4. Planejamento -->
            <div class="kreato-card p-6 space-y-3">
              <div class="w-10 h-10 rounded-xl bg-[#F28C45]/15 text-[#F28C45] flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-kreato-main">Calendário Editorial</h4>
              <p class="text-xs text-kreato-muted leading-relaxed">
                Visualize seus lançamentos em modo mensal, semanal e lista. Distribua conteúdo no YouTube, Instagram, TikTok e LinkedIn sem sobrecarga.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Deep Dive: Copiloto Krea -->
      <section id="krea" class="py-16 md:py-24 border-t border-kreato bg-kreato-bg">
        <div class="max-w-5xl mx-auto px-6">
          <div class="kreato-card p-8 md:p-12 bg-gradient-to-br from-[#FAF7F2] to-[#F5EFF9] dark:from-[#211B17] dark:to-[#2B2035] border border-kreato-purple/30 space-y-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="space-y-3 max-w-xl">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-kreato-purple"></span>
                  <span class="text-xs font-bold text-kreato-purple uppercase tracking-wider">Conheça o Copiloto</span>
                </div>
                <h3 class="text-2xl sm:text-3xl font-extrabold text-kreato-main tracking-tight">
                  Krea: A inteligência artificial que respeita seu estilo autoral.
                </h3>
                <p class="text-xs sm:text-sm text-kreato-muted leading-relaxed">
                  Sem respostas genéricas de robô. Krea entende seu nicho, seu público e o formato exato que você está criando para acelerar sua ideação sem tirar sua originalidade.
                </p>
              </div>

              <button id="landing-krea-start" class="px-5 py-2.5 bg-kreato-purple hover:bg-[#8060B7] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer whitespace-nowrap self-start md:self-auto">
                Experimentar Krea
              </button>
            </div>

            <!-- Prompts Showcases -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div class="p-3.5 bg-white dark:bg-[#1A1613] border border-kreato rounded-xl space-y-1">
                <div class="text-[11px] font-bold text-kreato-orange">Ganchos Magnéticos</div>
                <div class="text-xs text-kreato-main">"Gere 3 ganchos com quebra de crença para reter o público nos primeiros 3 segundos."</div>
              </div>

              <div class="p-3.5 bg-white dark:bg-[#1A1613] border border-kreato rounded-xl space-y-1">
                <div class="text-[11px] font-bold text-kreato-blue">Repurposing Completo</div>
                <div class="text-xs text-kreato-main">"Transforme este roteiro do YouTube em 1 carrossel de 7 slides para o Instagram."</div>
              </div>

              <div class="p-3.5 bg-white dark:bg-[#1A1613] border border-kreato rounded-xl space-y-1">
                <div class="text-[11px] font-bold text-[#2D8A56]">Legendas & SEO</div>
                <div class="text-xs text-kreato-main">"Escreva uma legenda envolvente com chamada para ação clara para comentários."</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Footer Detalhado -->
      <footer class="mt-auto pt-14 pb-10 border-t border-kreato bg-kreato-surface">
        <div class="max-w-7xl mx-auto px-6 space-y-10">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Coluna 1: Marca -->
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <img src="/logo.png" alt="Logo Kreato" class="w-10 h-10 object-contain drop-shadow-xs" />
                <div class="flex flex-col">
                  <span class="font-extrabold text-lg text-kreato-main leading-none">Kreato</span>
                  <span class="text-[10px] font-semibold text-kreato-muted tracking-widest uppercase mt-0.5">Creator Studio</span>
                </div>
              </div>
              <p class="text-xs text-kreato-muted leading-relaxed">
                O estúdio criativo completo para criadores independentes organizarem ideias, estruturarem roteiros, planejarem publicações e cocriarem com a Krea.
              </p>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-kreato-bg border border-kreato text-[11px] font-semibold text-kreato-muted">
                <span class="w-2 h-2 rounded-full bg-[#2D8A56]"></span>
                <span>MVP em fase de testes</span>
              </div>
            </div>

            <!-- Coluna 2: Produto -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-kreato-main uppercase tracking-wider">Produto</h4>
              <ul class="space-y-2 text-xs text-kreato-muted">
                <li><a href="#recursos" class="hover:text-kreato-orange transition-colors">Banco de Ideias</a></li>
                <li><a href="#recursos" class="hover:text-kreato-orange transition-colors">Estúdio de Roteiros</a></li>
                <li><a href="#recursos" class="hover:text-kreato-orange transition-colors">Calendário Editorial</a></li>
                <li><a href="#krea" class="hover:text-kreato-orange transition-colors">Copiloto Krea AI</a></li>
                <li><a href="#metodo" class="hover:text-kreato-orange transition-colors">Como Funciona</a></li>
              </ul>
            </div>

            <!-- Coluna 3: Recursos -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-kreato-main uppercase tracking-wider">Para Criadores</h4>
              <ul class="space-y-2 text-xs text-kreato-muted">
                <li><a href="#login" class="hover:text-kreato-orange transition-colors">Acessar Estúdio</a></li>
                <li><a href="#login" class="hover:text-kreato-orange transition-colors">Exportação de Roteiros em PDF</a></li>
                <li><a href="#login" class="hover:text-kreato-orange transition-colors">Biblioteca de Referências</a></li>
                <li><a href="#login" class="hover:text-kreato-orange transition-colors">Sugestões & Roadmap</a></li>
              </ul>
            </div>

            <!-- Coluna 4: Plataforma & Contato -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-kreato-main uppercase tracking-wider">Plataforma</h4>
              <ul class="space-y-2 text-xs text-kreato-muted">
                <li><span class="text-kreato-main font-semibold">PWA Instalável:</span> Desktop, Android e iOS</li>
                <li><span class="text-kreato-main font-semibold">Temas:</span> Modo Claro & Modo Escuro</li>
                <li><a href="#termos" class="hover:text-kreato-orange transition-colors">Termos de Uso</a></li>
                <li><a href="#privacidade" class="hover:text-kreato-orange transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div class="pt-6 border-t border-kreato-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-kreato-muted">
            <span>© 2026 Kreato Studio. Todos os direitos reservados.</span>
            <span>Feito para criadores de conteúdo independentes.</span>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Attach interactive listeners
  container.querySelector('#landing-hero-cta-btn')?.addEventListener('click', () => navigateTo('login'));
  container.querySelector('#landing-primary-start')?.addEventListener('click', () => navigateTo('login'));
  container.querySelector('#landing-demo-start')?.addEventListener('click', () => {
    navigateTo('login');
  });
  container.querySelector('#landing-krea-start')?.addEventListener('click', () => navigateTo('login'));

  container.querySelectorAll('.plan-select-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo('login'));
  });

  // Dark mode toggle in landing
  container.querySelector('#landing-theme-toggle')?.addEventListener('click', () => {
    storage.toggleTheme();
    renderLanding(container);
  });
}
