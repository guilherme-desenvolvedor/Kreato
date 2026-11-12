import { storage } from '../services/storage';
import { Script, Platform, ScriptFormat, ScriptStatus } from '../types';
import { getPlatformBadge, getStatusBadge, escapeHtml } from '../utils/formatters';
import { openScriptModal } from '../modules/creationModals';
import { showToast } from '../utils/toast';
import { exportScriptToPdf } from '../services/pdfExport';

let selectedScriptId: string | null = null;
let scriptSearchQuery: string = '';
let selectedPlatformFilter: string = 'todas';

export function renderScripts(container: HTMLElement) {
  const allScripts = storage.getScripts();

  // If no script is selected or current selected doesn't exist, select the first
  if (!selectedScriptId || !allScripts.some(s => s.id === selectedScriptId)) {
    selectedScriptId = allScripts.length > 0 ? allScripts[0].id : null;
  }

  const activeScript = allScripts.find(s => s.id === selectedScriptId);

  // Filter scripts
  const filteredScripts = allScripts.filter(s => {
    const matchesSearch = !scriptSearchQuery ||
      s.title.toLowerCase().includes(scriptSearchQuery.toLowerCase()) ||
      s.hook.toLowerCase().includes(scriptSearchQuery.toLowerCase()) ||
      s.body.toLowerCase().includes(scriptSearchQuery.toLowerCase());
    const matchesPlatform = selectedPlatformFilter === 'todas' || s.platform === selectedPlatformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platforms: Platform[] = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'Newsletter', 'Podcast'];
  const formats: ScriptFormat[] = [
    'Vídeo Curto (60s)',
    'Vídeo Longo (8-15 min)',
    'Carrossel Educativo',
    'Artigo / Newsletter',
    'Roteiro de Podcast'
  ];

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Top Title & Global Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Estúdio de Roteiros</h1>
          <p class="text-xs text-kreato-muted">
            Ambiente focado em escrita estruturada: gancho, desenvolvimento e chamada para ação.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="scripts-ai-generate-btn" class="px-3.5 py-2 bg-[#FAF0FA] hover:bg-[#F3E5F5] dark:bg-[#2A1D33] dark:hover:bg-[#342440] border border-kreato-purple/30 text-kreato-purple text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
            <svg class="w-4 h-4 text-kreato-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Gerar com Krea</span>
          </button>

          <button id="scripts-new-btn" class="px-4 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Roteiro</span>
          </button>
        </div>
      </div>

      <!-- Studio Layout: Sidebar + Focus Editor Canvas -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        <!-- Left Column: Scripts Drawer (4 cols) -->
        <div class="lg:col-span-4 flex flex-col gap-3">
          <!-- Search & Filter -->
          <div class="p-3 bg-kreato-surface border border-kreato rounded-2xl space-y-2">
            <div class="relative">
              <input type="text" id="script-search-input" value="${escapeHtml(scriptSearchQuery)}" placeholder="Buscar roteiros..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
              <svg class="w-3.5 h-3.5 text-kreato-subtle absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <select id="script-platform-filter" class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
              <option value="todas" ${selectedPlatformFilter === 'todas' ? 'selected' : ''}>Todas as plataformas</option>
              ${platforms.map(p => `<option value="${p}" ${selectedPlatformFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>

          <!-- Scripts List -->
          <div class="kreato-card overflow-hidden flex-1 flex flex-col divide-y divide-kreato-subtle max-h-[600px] overflow-y-auto">
            ${
              filteredScripts.length === 0
                ? `<div class="p-8 text-center text-xs text-kreato-muted">Nenhum roteiro encontrado.</div>`
                : filteredScripts
                    .map(script => {
                      const isSelected = script.id === selectedScriptId;
                      return `
                <div class="p-3.5 cursor-pointer transition-colors script-item-row ${isSelected ? 'bg-[#FAF0E6] dark:bg-[#2A231D] border-l-2 border-l-kreato-orange' : 'hover:bg-kreato-surface-hover'}" data-id="${script.id}">
                  <div class="flex items-center justify-between gap-2 text-[11px] mb-1">
                    ${getPlatformBadge(script.platform)}
                    <span class="text-kreato-subtle font-mono tabular-nums">${script.readingTimeMinutes} min</span>
                  </div>

                  <h3 class="text-xs font-bold text-kreato-main truncate mb-1 ${isSelected ? 'text-kreato-orange' : ''}">
                    ${escapeHtml(script.title)}
                  </h3>

                  <p class="text-[11px] text-kreato-muted line-clamp-2 leading-relaxed">
                    ${escapeHtml(script.hook || script.body || 'Sem conteúdo')}
                  </p>

                  <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-kreato-subtle/60 text-[10px]">
                    <span class="text-kreato-muted">${script.format}</span>
                    ${getStatusBadge(script.status)}
                  </div>
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </div>

        <!-- Right Column: Focus Script Editor (8 cols) -->
        <div class="lg:col-span-8 flex flex-col">
          ${
            !activeScript
              ? `
            <div class="kreato-card p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-[#EFE8D8] flex items-center justify-center text-kreato-muted">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </div>
              <h3 class="text-sm font-bold text-kreato-main">Nenhum roteiro selecionado</h3>
              <p class="text-xs text-kreato-muted">Escolha um roteiro na lista à esquerda ou crie um novo para começar.</p>
              <button id="scripts-empty-new-btn" class="px-4 py-2 bg-kreato-orange text-white text-xs font-semibold rounded-xl hover:bg-kreato-orange-hover transition-colors">
                Criar Roteiro
              </button>
            </div>
          `
              : `
            <div class="kreato-card p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-between shadow-xs">
              <!-- Editor Header: Title & Meta Controls -->
              <div class="space-y-4 pb-4 border-b border-kreato-subtle">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold text-kreato-subtle uppercase tracking-wider">Editando Roteiro</span>
                    <span class="text-kreato-subtle">·</span>
                    <span id="editor-word-count" class="text-xs font-mono text-kreato-muted tabular-nums">${activeScript.wordCount} palavras</span>
                    <span class="text-kreato-subtle">·</span>
                    <span id="editor-reading-time" class="text-xs font-mono text-kreato-muted tabular-nums">~${activeScript.readingTimeMinutes} min de fala</span>
                  </div>

                  <!-- Actions: PDF Export, Duplicate, Delete, Save -->
                  <div class="flex items-center gap-2 flex-wrap">
                    <button id="editor-export-pdf-btn" class="px-3 py-1.5 text-xs font-semibold text-kreato-main bg-kreato-surface hover:bg-kreato-surface-hover border border-kreato rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs" title="Exportar Roteiro em PDF diagramado">
                      <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <span>Exportar PDF</span>
                    </button>
                    <button id="editor-ai-hook-btn" class="px-2.5 py-1.5 text-xs font-medium text-kreato-purple bg-[#FAF0FA] dark:bg-[#2A1D33] hover:bg-[#F3E5F5] dark:hover:bg-[#342440] rounded-xl transition-colors flex items-center gap-1 cursor-pointer" title="Sugerir ganchos com IA">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span>Melhorar Gancho</span>
                    </button>
                    <button id="editor-duplicate-btn" class="p-1.5 text-kreato-muted hover:text-kreato-main rounded-xl hover:bg-kreato-surface-hover transition-colors cursor-pointer" title="Duplicar Roteiro">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                    </button>
                    <button id="editor-delete-btn" class="p-1.5 text-red-500 hover:text-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer" title="Excluir Roteiro">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                    <button id="editor-save-btn" class="px-4 py-1.5 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>

                <!-- Editable Title -->
                <div>
                  <input
                    type="text"
                    id="editor-input-title"
                    value="${escapeHtml(activeScript.title)}"
                    class="w-full text-base sm:text-lg font-extrabold text-kreato-main tracking-tight bg-transparent border-b border-transparent hover:border-kreato focus:border-kreato-orange focus:bg-white dark:focus:bg-[#141417] px-1 py-1 rounded-md transition-all"
                    placeholder="Título do Roteiro..."
                  />
                </div>

                <!-- Meta Selectors: Platform, Format, Status -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-kreato-muted mb-1">Plataforma</label>
                    <select id="editor-select-platform" class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
                      ${platforms.map(p => `<option value="${p}" ${activeScript.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-kreato-muted mb-1">Formato</label>
                    <select id="editor-select-format" class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
                      ${formats.map(f => `<option value="${f}" ${activeScript.format === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-kreato-muted mb-1">Status</label>
                    <select id="editor-select-status" class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
                      <option value="Rascunho" ${activeScript.status === 'Rascunho' ? 'selected' : ''}>Rascunho</option>
                      <option value="Em gravação" ${activeScript.status === 'Em gravação' ? 'selected' : ''}>Em gravação</option>
                      <option value="Pronto" ${activeScript.status === 'Pronto' ? 'selected' : ''}>Pronto</option>
                      <option value="Gravado" ${activeScript.status === 'Gravado' ? 'selected' : ''}>Gravado</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Structured Script Writing Canvas -->
              <div class="space-y-5 flex-1">
                <!-- 1. O Gancho (Hook) -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-kreato-main flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-kreato-orange"></span>
                      <span>1. Gancho de Retenção (00:00 - 00:04)</span>
                    </label>
                    <span class="text-[11px] text-kreato-muted">Frase de abertura imediata</span>
                  </div>
                  <textarea
                    id="editor-input-hook"
                    rows="2"
                    placeholder="Escreva a abertura que fisga a atenção nos primeiros 3 segundos..."
                    class="w-full p-3.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417] focus:outline-none transition-colors"
                  >${escapeHtml(activeScript.hook)}</textarea>
                </div>

                <!-- 2. Desenvolvimento & Narrativa -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-kreato-main flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-kreato-blue"></span>
                      <span>2. Desenvolvimento & Conteúdo Central</span>
                    </label>
                    <span class="text-[11px] text-kreato-muted">Estrutura em blocos ou tópicos</span>
                  </div>
                  <textarea
                    id="editor-input-body"
                    rows="8"
                    placeholder="Desenvolva o raciocínio, passos práticos ou história principal..."
                    class="w-full p-3.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417] focus:outline-none transition-colors font-sans leading-relaxed"
                  >${escapeHtml(activeScript.body)}</textarea>
                </div>

                <!-- 3. Chamada para Ação (CTA) -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-kreato-main flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-kreato-purple"></span>
                      <span>3. Chamada para Ação (CTA Final)</span>
                    </label>
                    <span class="text-[11px] text-kreato-muted">Comentário, compartilhamento ou conversão</span>
                  </div>
                  <input
                    type="text"
                    id="editor-input-cta"
                    value="${escapeHtml(activeScript.cta)}"
                    placeholder="Ex: Comente 'FLUXO' para receber meu modelo..."
                    class="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417] focus:outline-none transition-colors"
                  />
                </div>

                <!-- 4. Observações de Gravação & B-roll -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-kreato-muted">
                    Notas de Direção, Iluminação & B-roll
                  </label>
                  <textarea
                    id="editor-input-notes"
                    rows="2"
                    placeholder="Ex: Iluminação lateral, mostrar tela do Notion em 00:30, corte seco com whoosh..."
                    class="w-full p-3 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417] focus:outline-none transition-colors"
                  >${escapeHtml(activeScript.notes)}</textarea>
                </div>
              </div>
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelector('#scripts-new-btn')?.addEventListener('click', () => openScriptModal());
  container.querySelector('#scripts-empty-new-btn')?.addEventListener('click', () => openScriptModal());

  // Search input
  const searchInput = container.querySelector('#script-search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    scriptSearchQuery = (e.target as HTMLInputElement).value;
    renderScripts(container);
  });

  // Platform filter
  const platformFilter = container.querySelector('#script-platform-filter') as HTMLSelectElement;
  platformFilter?.addEventListener('change', (e) => {
    selectedPlatformFilter = (e.target as HTMLSelectElement).value;
    renderScripts(container);
  });

  // Select script from list
  container.querySelectorAll('.script-item-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      if (id) {
        selectedScriptId = id;
        renderScripts(container);
      }
    });
  });

  // AI Generate Script Wizard Modal
  container.querySelector('#scripts-ai-generate-btn')?.addEventListener('click', () => {
    openAiScriptGeneratorModal(container);
  });

  if (activeScript) {
    // Save button
    const saveBtn = container.querySelector('#editor-save-btn');
    const titleInput = container.querySelector('#editor-input-title') as HTMLInputElement;
    const platformSelect = container.querySelector('#editor-select-platform') as HTMLSelectElement;
    const formatSelect = container.querySelector('#editor-select-format') as HTMLSelectElement;
    const statusSelect = container.querySelector('#editor-select-status') as HTMLSelectElement;
    const hookInput = container.querySelector('#editor-input-hook') as HTMLTextAreaElement;
    const bodyInput = container.querySelector('#editor-input-body') as HTMLTextAreaElement;
    const ctaInput = container.querySelector('#editor-input-cta') as HTMLInputElement;
    const notesInput = container.querySelector('#editor-input-notes') as HTMLTextAreaElement;

    // Word count live update helper
    const updateStats = () => {
      const fullText = `${hookInput.value} ${bodyInput.value} ${ctaInput.value}`;
      const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
      const readMin = Math.max(1, Math.round(words / 130));
      const wordEl = container.querySelector('#editor-word-count');
      const timeEl = container.querySelector('#editor-reading-time');
      if (wordEl) wordEl.textContent = `${words} palavras`;
      if (timeEl) timeEl.textContent = `~${readMin} min de fala`;
    };

    hookInput?.addEventListener('input', updateStats);
    bodyInput?.addEventListener('input', updateStats);
    ctaInput?.addEventListener('input', updateStats);

    saveBtn?.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        showToast('O roteiro precisa de um título.', 'warning');
        return;
      }

      storage.saveScript({
        id: activeScript.id,
        title,
        platform: platformSelect.value as Platform,
        format: formatSelect.value as ScriptFormat,
        status: statusSelect.value as ScriptStatus,
        hook: hookInput.value.trim(),
        body: bodyInput.value.trim(),
        cta: ctaInput.value.trim(),
        notes: notesInput.value.trim()
      });

      showToast('Roteiro salvo com sucesso!', 'success');
      renderScripts(container);
    });

    // Export PDF button
    container.querySelector('#editor-export-pdf-btn')?.addEventListener('click', () => {
      exportScriptToPdf({
        ...activeScript,
        title: titleInput.value.trim() || activeScript.title,
        hook: hookInput.value.trim(),
        body: bodyInput.value.trim(),
        cta: ctaInput.value.trim(),
        notes: notesInput.value.trim(),
        platform: platformSelect.value as Platform,
        format: formatSelect.value as ScriptFormat,
        status: statusSelect.value as ScriptStatus,
      });
      showToast('Roteiro exportado em PDF com sucesso!', 'success');
    });

    // Duplicate button
    container.querySelector('#editor-duplicate-btn')?.addEventListener('click', () => {
      const dup = storage.duplicateScript(activeScript.id);
      if (dup) {
        selectedScriptId = dup.id;
        showToast('Roteiro duplicado!', 'success');
        renderScripts(container);
      }
    });

    // Delete button
    container.querySelector('#editor-delete-btn')?.addEventListener('click', () => {
      if (confirm(`Deseja excluir o roteiro "${activeScript.title}"?`)) {
        storage.deleteScript(activeScript.id);
        selectedScriptId = null;
        showToast('Roteiro excluído', 'info');
        renderScripts(container);
      }
    });

    // AI improve hook
    container.querySelector('#editor-ai-hook-btn')?.addEventListener('click', () => {
      const suggestedHook = `Você já percebeu que ${activeScript.title.toLowerCase()} é o maior divisor de águas na sua produção? Se você faz do jeito tradicional, pare agora.`;
      hookInput.value = suggestedHook;
      updateStats();
      showToast('Gancho aprimorado pelo Kreato AI inserido!', 'success');
    });
  }
}

function openAiScriptGeneratorModal(mainContainer: HTMLElement) {
  openScriptModal({
    id: '',
    title: 'Como monetizar conhecimento no digital com autenticidade',
    platform: 'Instagram',
    format: 'Vídeo Curto (60s)',
    hook: 'O que 99% das pessoas não te contam sobre criar produtos digitais é que vender sem audiência gigante é perfeitamente possível.',
    body: 'Passo 1: Foque em resolver um problema ultra específico que seus amigos ou clientes sempre te pedem ajuda.\nPasso 2: Não crie um curso de 40 horas; crie um modelo aplicável em 30 minutos.\nPasso 3: Use o Kreato para organizar e documentar seu processo ao vivo.',
    cta: 'Comente "GUIA" aqui para receber o checklist gratuito no seu direct.',
    notes: 'Gravar em plano médio, microfone de lapela visível.',
    status: 'Rascunho',
    wordCount: 75,
    readingTimeMinutes: 1,
    updatedAt: new Date().toISOString()
  });
}
