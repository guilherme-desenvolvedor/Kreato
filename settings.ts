import { storage } from '../services/storage';
import { escapeHtml } from '../utils/formatters';
import { showToast } from '../utils/toast';
import { pwaService } from '../services/pwa';

export function renderSettings(container: HTMLElement) {
  const profile = storage.getProfile();
  let currentAvatar = profile.avatarUrl || '/logo.png';

  const AVATAR_PRESETS = [
    { label: 'Marina', url: '/src/assets/images/creator_avatar_1794167049130.jpg' },
    { label: 'Minimalista', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
    { label: 'Tech & Código', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
    { label: 'Design Editorial', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
  ];

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <!-- Header -->
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Configurações do Criador</h1>
        <p class="text-xs text-kreato-muted">
          Gerencie seu perfil autoral, foto, metas de produção e preferências do seu estúdio Kreato.
        </p>
      </div>

      <!-- Profile Form Card -->
      <section class="kreato-card p-6 md:p-8 space-y-6 shadow-xs border border-kreato">
        <div class="pb-3 border-b border-kreato-subtle">
          <h2 class="text-sm font-bold text-kreato-main">Perfil Autoral & Foto</h2>
          <p class="text-xs text-kreato-muted">Personalize sua identidade e o contexto utilizado pelo copiloto Krea</p>
        </div>

        <form id="settings-profile-form" class="space-y-6">
          <!-- Avatar Upload Area -->
          <div class="p-4 bg-kreato-bg/60 border border-kreato rounded-2xl flex flex-col sm:flex-row items-center gap-5">
            <div class="relative group shrink-0">
              <img id="avatar-preview-img" src="${currentAvatar}" alt="${escapeHtml(profile.name)}" class="w-20 h-20 rounded-full object-cover border-2 border-kreato-orange shadow-md" />
              <button type="button" id="btn-trigger-avatar-file" class="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                <svg class="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>Alterar</span>
              </button>
              <input type="file" id="prof-avatar-file" accept="image/*" class="hidden" />
            </div>

            <div class="flex-1 space-y-2.5 text-center sm:text-left min-w-0 w-full">
              <div>
                <div class="text-xs font-bold text-kreato-main">Foto de Perfil</div>
                <p class="text-[11px] text-kreato-muted">Carregue uma imagem do seu dispositivo ou escolha um dos estilos sugeridos abaixo:</p>
              </div>

              <!-- Presets & Upload Buttons -->
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" id="btn-upload-photo-btn" class="px-3 py-1.5 bg-kreato-orange hover:bg-kreato-orange-hover text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <span>Carregar do Dispositivo</span>
                </button>

                <div class="flex items-center gap-1.5">
                  ${AVATAR_PRESETS.map((preset, idx) => `
                    <button type="button" class="btn-avatar-preset px-2.5 py-1 text-[11px] bg-kreato-surface hover:bg-kreato-surface-hover border border-kreato rounded-lg text-kreato-main font-medium transition-colors cursor-pointer" data-url="${preset.url}">
                      ${preset.label}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Or URL Input -->
              <div class="pt-1">
                <input
                  type="url"
                  id="prof-avatar-url-input"
                  placeholder="Ou cole o link direto de uma imagem (https://...)"
                  class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-lg text-kreato-main focus:bg-white dark:focus:bg-[#141417]"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Nome Completo *</label>
              <input type="text" id="prof-name" value="${escapeHtml(profile.name)}" required class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
            </div>

            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Nome de Usuário (@handle) *</label>
              <input type="text" id="prof-handle" value="${escapeHtml(profile.handle)}" required class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-kreato-main mb-1">Nicho Principal de Conteúdo *</label>
            <input type="text" id="prof-niche" value="${escapeHtml(profile.niche)}" required placeholder="Ex: Tecnologia, Storytelling & Design" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
          </div>

          <div>
            <label class="block text-xs font-bold text-kreato-main mb-1">Bio & Proposta Criativa</label>
            <textarea id="prof-bio" rows="3" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(profile.bio)}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-kreato-subtle">
            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Meta Semanal de Publicações</label>
              <input type="number" id="prof-target-posts" min="1" max="20" value="${profile.targetPostsPerWeek}" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main font-mono tabular-nums" />
            </div>

            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Meta Mensal de Roteiros</label>
              <input type="number" id="prof-target-scripts" min="1" max="50" value="${profile.targetScriptsPerMonth}" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main font-mono tabular-nums" />
            </div>
          </div>

          <div class="pt-3 flex justify-end">
            <button type="submit" class="px-5 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Salvar Alterações de Perfil</span>
            </button>
          </div>
        </form>
      </section>

      <!-- PWA Install & Offline Card -->
      <section class="kreato-card p-6 md:p-8 space-y-4 shadow-xs border border-kreato">
        <div class="pb-3 border-b border-kreato-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-bold text-kreato-main flex items-center gap-2">
              <svg class="w-4 h-4 text-kreato-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span>Aplicativo Móvel & PWA (Progressive Web App)</span>
            </h2>
            <p class="text-xs text-kreato-muted">Instale o Kreato no seu celular ou computador para acesso instantâneo sem abas do navegador</p>
          </div>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-kreato-purple/15 text-kreato-purple uppercase tracking-wide self-start sm:self-auto">
            Offline & Standalone Ready
          </span>
        </div>

        <div class="p-4 bg-kreato-bg/60 border border-kreato rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="space-y-1 text-center sm:text-left">
            <div class="text-xs font-bold text-kreato-main">Acesso como Aplicativo Nativo</div>
            <p class="text-[11px] text-kreato-muted">Funciona com cache local, inicialização rápida na tela de início e modo tela cheia.</p>
          </div>

          <button type="button" id="btn-install-pwa-settings" class="px-4 py-2 bg-kreato-purple hover:bg-[#8061B8] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>Instalar Aplicativo</span>
          </button>
        </div>
      </section>

      <!-- Storage Capacity Monitor -->
      <section class="kreato-card p-6 md:p-8 space-y-4 shadow-xs border border-kreato">
        <div class="pb-3 border-b border-kreato-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-bold text-kreato-main flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2D8A56] animate-pulse"></span>
              <span>Status do Banco de Dados</span>
            </h2>
            <p class="text-xs text-kreato-muted">Registros salvos na sua conta, no banco de dados na nuvem (Supabase)</p>
          </div>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2D8A56]/15 text-[#2D8A56] uppercase tracking-wide self-start sm:self-auto">
            Conectado
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <!-- Space in Use -->
          <div class="p-4 bg-kreato-surface border border-kreato rounded-xl space-y-2">
            <div class="text-[11px] text-kreato-muted font-semibold uppercase tracking-wider">Volume de Dados (estimado)</div>
            <div class="flex items-baseline gap-1.5">
              <span id="db-storage-used" class="text-2xl font-bold font-mono text-kreato-main tabular-nums">Calculando...</span>
            </div>
            <div class="text-[10px] text-kreato-subtle font-mono">Tamanho do backup exportável das suas ideias, roteiros e posts</div>
          </div>

          <!-- Total Records -->
          <div class="p-4 bg-kreato-surface border border-kreato rounded-xl space-y-2">
            <div class="text-[11px] text-kreato-muted font-semibold uppercase tracking-wider">Total de Registros Ativos</div>
            <div class="flex items-baseline gap-1.5">
              <span id="db-records-total" class="text-2xl font-bold font-mono text-kreato-main tabular-nums">...</span>
              <span class="text-xs text-kreato-muted">itens salvos no banco</span>
            </div>
            <div class="text-[10px] text-kreato-muted flex flex-wrap gap-x-2 gap-y-0.5 font-mono">
              <span id="db-count-ideas">0 ideias</span> ·
              <span id="db-count-scripts">0 roteiros</span> ·
              <span id="db-count-pubs">0 posts</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Data Management & Backup -->
      <section class="kreato-card p-6 md:p-8 space-y-4 shadow-xs border border-kreato">
        <div class="pb-3 border-b border-kreato-subtle">
          <h2 class="text-sm font-bold text-kreato-main">Gestão de Dados & Backup</h2>
          <p class="text-xs text-kreato-muted">Exporte um backup ou traga dados de um arquivo para a sua conta</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <!-- Export -->
          <div class="p-4 bg-kreato-surface border border-kreato rounded-xl space-y-2">
            <div class="text-xs font-bold text-kreato-main">Exportar Backup</div>
            <p class="text-[11px] text-kreato-muted">Baixe um arquivo JSON com todas as suas ideias, roteiros e publicações.</p>
            <button id="btn-export-json" class="w-full py-2 px-3 bg-kreato-bg hover:bg-kreato-surface-hover border border-kreato text-kreato-main rounded-lg text-xs font-semibold transition-colors cursor-pointer">
              Exportar JSON
            </button>
          </div>

          <!-- Import -->
          <div class="p-4 bg-kreato-surface border border-kreato rounded-xl space-y-2">
            <div class="text-xs font-bold text-kreato-main">Importar Dados</div>
            <p class="text-[11px] text-kreato-muted">Carregue um arquivo JSON de backup. Os itens são adicionados aos que você já tem.</p>
            <label class="w-full py-2 px-3 bg-kreato-bg hover:bg-kreato-surface-hover border border-kreato text-kreato-main rounded-lg text-xs font-semibold transition-colors cursor-pointer block text-center">
              <span>Carregar Arquivo</span>
              <input type="file" id="btn-import-file" accept=".json" class="hidden" />
            </label>
          </div>

          <!-- Reset -->
          <div class="p-4 bg-kreato-surface border border-kreato rounded-xl space-y-2">
            <div class="text-xs font-bold text-red-600">Apagar Meus Dados</div>
            <p class="text-[11px] text-kreato-muted">Exclui definitivamente todas as ideias, roteiros, publicações, itens da biblioteca e o histórico da Krea da sua conta.</p>
            <button id="btn-reset-demo" class="w-full py-2 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
              Apagar Tudo
            </button>
          </div>
        </div>
      </section>
    </div>
  `;

  // Avatar Handlers
  const fileInput = container.querySelector('#prof-avatar-file') as HTMLInputElement;
  const previewImg = container.querySelector('#avatar-preview-img') as HTMLImageElement;
  const urlInput = container.querySelector('#prof-avatar-url-input') as HTMLInputElement;

  container.querySelector('#btn-trigger-avatar-file')?.addEventListener('click', () => fileInput?.click());
  container.querySelector('#btn-upload-photo-btn')?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('A imagem deve ter menos de 2 MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const original = ev.target?.result as string;
        // Reduz para 256x256 (JPEG) antes de guardar: a foto é salva no banco como texto
        const img = new Image();
        img.onload = () => {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            currentAvatar = original;
          } else {
            // recorte quadrado centralizado
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
            currentAvatar = canvas.toDataURL('image/jpeg', 0.85);
          }
          if (previewImg) previewImg.src = currentAvatar;
          showToast('Nova foto selecionada! Clique em Salvar Alterações para confirmar.', 'info');
        };
        img.onerror = () => showToast('Não foi possível ler essa imagem.', 'error');
        img.src = original;
      };
      reader.readAsDataURL(file);
    }
  });

  urlInput?.addEventListener('input', () => {
    const url = urlInput.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      currentAvatar = url;
      if (previewImg) previewImg.src = url;
    }
  });

  container.querySelectorAll('.btn-avatar-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = (e.currentTarget as HTMLElement).getAttribute('data-url');
      if (url) {
        currentAvatar = url;
        if (previewImg) previewImg.src = url;
        showToast('Estilo de avatar aplicado!', 'info');
      }
    });
  });

  // Attach Profile form submission
  const profileForm = container.querySelector('#settings-profile-form') as HTMLFormElement;
  profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (container.querySelector('#prof-name') as HTMLInputElement).value.trim();
    const handle = (container.querySelector('#prof-handle') as HTMLInputElement).value.trim();
    const niche = (container.querySelector('#prof-niche') as HTMLInputElement).value.trim();
    const bio = (container.querySelector('#prof-bio') as HTMLTextAreaElement).value.trim();
    const targetPosts = parseInt((container.querySelector('#prof-target-posts') as HTMLInputElement).value) || 4;
    const targetScripts = parseInt((container.querySelector('#prof-target-scripts') as HTMLInputElement).value) || 12;

    storage.updateProfile({
      name,
      handle,
      niche,
      bio,
      avatarUrl: currentAvatar,
      targetPostsPerWeek: targetPosts,
      targetScriptsPerMonth: targetScripts
    });

    showToast('Perfil autoral e foto atualizados com sucesso!', 'success');
  });

  // PWA Install Button
  container.querySelector('#btn-install-pwa-settings')?.addEventListener('click', async () => {
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
      showToast('Toque no menu do seu navegador e escolha "Instalar Aplicativo".', 'info');
    }
  });

  // Export JSON
  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    const jsonStr = storage.exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kreato_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  });

  // Import JSON
  const importInput = container.querySelector('#btn-import-file') as HTMLInputElement;
  importInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        showToast('Importando backup...', 'info', 2000);
        const summary = await storage.importDataJson(text);
        if (summary) {
          const total = summary.ideas + summary.scripts + summary.publications + summary.library;
          showToast(`Backup importado: ${total} itens adicionados à sua conta.`, 'success');
          renderSettings(container);
        } else {
          showToast('Não foi possível importar o arquivo de backup.', 'error');
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    }
  });

  // Apagar todos os dados da conta
  container.querySelector('#btn-reset-demo')?.addEventListener('click', async () => {
    if (confirm('Tem certeza de que deseja APAGAR todas as suas ideias, roteiros, publicações, itens da biblioteca e o histórico da Krea? Essa ação não pode ser desfeita.')) {
      const ok = await storage.deleteAllData();
      if (ok) {
        showToast('Todos os seus dados foram apagados.', 'info');
        renderSettings(container);
      }
    }
  });

  // Calculate & Populate Live Database Storage Monitor
  try {
    const allJson = storage.exportDataJson();
    const bytesUsed = new Blob([allJson]).size;
    const kbUsed = (bytesUsed / 1024).toFixed(1);

    const usedEl = container.querySelector('#db-storage-used');
    const totalEl = container.querySelector('#db-records-total');
    const ideasCountEl = container.querySelector('#db-count-ideas');
    const scriptsCountEl = container.querySelector('#db-count-scripts');
    const pubsCountEl = container.querySelector('#db-count-pubs');

    const ideasCount = storage.getIdeas().length;
    const scriptsCount = storage.getScripts().length;
    const pubsCount = storage.getPublications().length;
    const libCount = storage.getLibraryItems().length;
    const totalRecords = ideasCount + scriptsCount + pubsCount + libCount;

    if (usedEl) usedEl.textContent = `${kbUsed} KB`;
    if (totalEl) totalEl.textContent = String(totalRecords);
    if (ideasCountEl) ideasCountEl.textContent = `${ideasCount} ideias`;
    if (scriptsCountEl) scriptsCountEl.textContent = `${scriptsCount} roteiros`;
    if (pubsCountEl) pubsCountEl.textContent = `${pubsCount} posts`;
  } catch (err) {
    console.error('Erro ao calcular espaço:', err);
  }
}
