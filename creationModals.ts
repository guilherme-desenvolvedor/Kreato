import { storage } from '../services/storage';
import { Idea, Script, Publication, Platform, IdeaCategory, IdeaStatus, PublicationStatus, ScriptFormat, ScriptStatus } from '../types';
import { openModal } from '../utils/modal';
import { showToast } from '../utils/toast';
import { escapeHtml } from '../utils/formatters';
import { navigateTo } from './router';

export function openIdeaModal(existing?: Idea) {
  const isEdit = !!existing;
  const categories: IdeaCategory[] = ['Tecnologia', 'Storytelling', 'Monetização', 'Bastidores', 'Design', 'Produtividade', 'Tendências'];
  const platforms: Platform[] = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Newsletter', 'Podcast'];
  const statuses: IdeaStatus[] = ['Nova', 'Em desenvolvimento', 'Aprovada', 'Arquivada'];

  const contentHtml = `
    <form id="idea-form" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Título da Ideia *</label>
        <input type="text" id="idea-title" required value="${escapeHtml(existing?.title || '')}" placeholder="Ex: A regra dos 3 segundos para reter atenção em vídeos curtos" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Descrição e Ângulo Criativo *</label>
        <textarea id="idea-desc" rows="3" required placeholder="Explique o núcleo do conteúdo, a dor do público ou a quebra de padrão..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(existing?.description || '')}</textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Categoria</label>
          <select id="idea-category" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${categories.map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Plataforma</label>
          <select id="idea-platform" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${platforms.map(p => `<option value="${p}" ${existing?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Status</label>
          <select id="idea-status" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${statuses.map(s => `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Etiquetas (separadas por vírgula)</label>
        <input type="text" id="idea-tags" value="${escapeHtml(existing?.tags?.join(', ') || '')}" placeholder="Ex: Retenção, Roteiro, Viral" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input type="checkbox" id="idea-favorite" ${existing?.isFavorite ? 'checked' : ''} class="w-4 h-4 rounded text-kreato-orange border-kreato cursor-pointer" />
        <label for="idea-favorite" class="text-xs font-medium text-kreato-main cursor-pointer">Marcar esta ideia como favorita</label>
      </div>

      ${isEdit ? `
        <div class="pt-3 border-t border-kreato-subtle flex items-center justify-between">
          <button type="button" id="modal-convert-to-script" class="text-xs text-kreato-blue hover:underline font-semibold flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            <span>Transformar esta ideia em Roteiro</span>
          </button>
          <button type="button" id="modal-delete-idea" class="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer">
            Excluir ideia
          </button>
        </div>
      ` : ''}
    </form>
  `;

  openModal({
    title: isEdit ? 'Editar Ideia Criativa' : 'Anotar Nova Ideia',
    contentHtml,
    confirmText: isEdit ? 'Salvar Alterações' : 'Adicionar ao Acervo',
    onOpen: (modalEl) => {
      const convertBtn = modalEl.querySelector('#modal-convert-to-script');
      convertBtn?.addEventListener('click', () => {
        if (!existing) return;
        const newScript = storage.saveScript({
          title: existing.title,
          platform: existing.platform,
          format: 'Vídeo Curto (60s)',
          hook: `Você sabia que ${existing.description.slice(0, 100)}...?`,
          body: existing.description,
          cta: 'Comente abaixo o que você achou dessa perspectiva!',
          notes: `Roteiro originado da ideia "${existing.title}".`,
          status: 'Rascunho'
        });
        showToast('Ideia convertida em roteiro com sucesso!', 'success');
        navigateTo('roteiros');
      });

      const deleteBtn = modalEl.querySelector('#modal-delete-idea');
      deleteBtn?.addEventListener('click', () => {
        if (!existing) return;
        if (confirm(`Tem certeza que deseja excluir a ideia "${existing.title}"?`)) {
          storage.deleteIdea(existing.id);
          showToast('Ideia excluída', 'info');
          const closeIcon = modalEl.querySelector('#modal-close-icon') as HTMLElement;
          closeIcon?.click();
        }
      });
    },
    onConfirm: (modalEl) => {
      const titleInput = modalEl.querySelector('#idea-title') as HTMLInputElement;
      const descInput = modalEl.querySelector('#idea-desc') as HTMLTextAreaElement;
      const catInput = modalEl.querySelector('#idea-category') as HTMLSelectElement;
      const platInput = modalEl.querySelector('#idea-platform') as HTMLSelectElement;
      const statusInput = modalEl.querySelector('#idea-status') as HTMLSelectElement;
      const tagsInput = modalEl.querySelector('#idea-tags') as HTMLInputElement;
      const favInput = modalEl.querySelector('#idea-favorite') as HTMLInputElement;

      const title = titleInput.value.trim();
      const description = descInput.value.trim();

      if (!title) {
        showToast('Por favor, informe o título da ideia.', 'warning');
        titleInput.focus();
        return false;
      }

      if (!description) {
        showToast('Por favor, descreva o ângulo criativo.', 'warning');
        descInput.focus();
        return false;
      }

      const tags = tagsInput.value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      storage.saveIdea({
        id: existing?.id,
        title,
        description,
        category: catInput.value as IdeaCategory,
        platform: platInput.value as Platform,
        status: statusInput.value as IdeaStatus,
        isFavorite: favInput.checked,
        tags
      });

      showToast(isEdit ? 'Ideia atualizada!' : 'Nova ideia adicionada ao seu acervo!', 'success');
      return true;
    }
  });
}

export function openScriptModal(existing?: Script) {
  const isEdit = !!existing;
  const platforms: Platform[] = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'Newsletter', 'Podcast'];
  const formats: ScriptFormat[] = [
    'Vídeo Curto (60s)',
    'Vídeo Longo (8-15 min)',
    'Carrossel Educativo',
    'Artigo / Newsletter',
    'Roteiro de Podcast'
  ];
  const statuses: ScriptStatus[] = ['Rascunho', 'Em gravação', 'Pronto', 'Gravado'];

  const contentHtml = `
    <form id="script-form" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Título do Roteiro *</label>
        <input type="text" id="script-title" required value="${escapeHtml(existing?.title || '')}" placeholder="Ex: Como estruturar vídeos de 60s com alta retenção" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Plataforma</label>
          <select id="script-platform" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${platforms.map(p => `<option value="${p}" ${existing?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Formato</label>
          <select id="script-format" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${formats.map(f => `<option value="${f}" ${existing?.format === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Status</label>
          <select id="script-status" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${statuses.map(s => `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Hook (Gancho) -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-bold text-kreato-main flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#F28C45]"></span>
            <span>1. O Gancho (Primeiros 3 a 5 segundos)</span>
          </label>
          <span class="text-[11px] text-kreato-muted">Quebre a expectativa</span>
        </div>
        <textarea id="script-hook" rows="2" placeholder="Frase ou ação de abertura imediata que prende a atenção..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(existing?.hook || '')}</textarea>
      </div>

      <!-- Body (Desenvolvimento) -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-bold text-kreato-main flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#527DBB]"></span>
            <span>2. Desenvolvimento & Narrativa</span>
          </label>
          <span class="text-[11px] text-kreato-muted">Pontos-chave estruturados</span>
        </div>
        <textarea id="script-body" rows="5" placeholder="Passo 1...\nPasso 2...\nExemplo prático..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none font-sans focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(existing?.body || '')}</textarea>
      </div>

      <!-- CTA -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-bold text-kreato-main flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#9274C8]"></span>
            <span>3. Chamada para Ação (CTA)</span>
          </label>
          <span class="text-[11px] text-kreato-muted">Conversão ou comentário</span>
        </div>
        <input type="text" id="script-cta" value="${escapeHtml(existing?.cta || '')}" placeholder="Ex: Comente 'ROTEIRO' que envio o mapa mental completo..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <!-- Observações & Direção de Cena -->
      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Notas de Produção & B-roll</label>
        <textarea id="script-notes" rows="2" placeholder="Ex: Gravar com luz quente lateral, inserir b-roll do teclado, trilha lofi suave..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(existing?.notes || '')}</textarea>
      </div>

      ${isEdit ? `
        <div class="pt-3 border-t border-kreato-subtle flex items-center justify-between">
          <button type="button" id="modal-duplicate-script" class="text-xs text-kreato-muted hover:text-kreato-main font-semibold flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
            <span>Duplicar roteiro</span>
          </button>
          <button type="button" id="modal-delete-script" class="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer">
            Excluir roteiro
          </button>
        </div>
      ` : ''}
    </form>
  `;

  openModal({
    title: isEdit ? 'Editar Roteiro' : 'Novo Roteiro no Estúdio',
    contentHtml,
    maxWidthClass: 'max-w-3xl',
    confirmText: isEdit ? 'Salvar Roteiro' : 'Criar Roteiro',
    onOpen: (modalEl) => {
      const dupBtn = modalEl.querySelector('#modal-duplicate-script');
      dupBtn?.addEventListener('click', () => {
        if (!existing) return;
        storage.duplicateScript(existing.id);
        showToast('Roteiro duplicado!', 'success');
        const closeIcon = modalEl.querySelector('#modal-close-icon') as HTMLElement;
        closeIcon?.click();
        navigateTo('roteiros');
      });

      const delBtn = modalEl.querySelector('#modal-delete-script');
      delBtn?.addEventListener('click', () => {
        if (!existing) return;
        if (confirm(`Tem certeza que deseja excluir o roteiro "${existing.title}"?`)) {
          storage.deleteScript(existing.id);
          showToast('Roteiro excluído', 'info');
          const closeIcon = modalEl.querySelector('#modal-close-icon') as HTMLElement;
          closeIcon?.click();
        }
      });
    },
    onConfirm: (modalEl) => {
      const title = (modalEl.querySelector('#script-title') as HTMLInputElement).value.trim();
      const platform = (modalEl.querySelector('#script-platform') as HTMLSelectElement).value as Platform;
      const format = (modalEl.querySelector('#script-format') as HTMLSelectElement).value as ScriptFormat;
      const status = (modalEl.querySelector('#script-status') as HTMLSelectElement).value as ScriptStatus;
      const hook = (modalEl.querySelector('#script-hook') as HTMLTextAreaElement).value.trim();
      const body = (modalEl.querySelector('#script-body') as HTMLTextAreaElement).value.trim();
      const cta = (modalEl.querySelector('#script-cta') as HTMLInputElement).value.trim();
      const notes = (modalEl.querySelector('#script-notes') as HTMLTextAreaElement).value.trim();

      if (!title) {
        showToast('Por favor, defina um título para o roteiro.', 'warning');
        return false;
      }

      storage.saveScript({
        id: existing?.id,
        title,
        platform,
        format,
        status,
        hook,
        body,
        cta,
        notes
      });

      showToast(isEdit ? 'Roteiro atualizado com sucesso!' : 'Novo roteiro salvo!', 'success');
      return true;
    }
  });
}

export function openPublicationModal(existing?: Publication, defaultDate?: string) {
  const isEdit = !!existing;
  const platforms: Platform[] = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Newsletter', 'Podcast'];
  const categories: IdeaCategory[] = ['Tecnologia', 'Storytelling', 'Monetização', 'Bastidores', 'Design', 'Produtividade', 'Tendências'];
  const statuses: PublicationStatus[] = ['rascunho', 'pronto', 'agendado', 'publicado'];
  const scripts = storage.getScripts();

  const today = new Date().toISOString().split('T')[0];
  const targetDate = existing?.scheduledDate || defaultDate || today;
  const targetTime = existing?.scheduledTime || '18:00';

  const contentHtml = `
    <form id="pub-form" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Título do Conteúdo *</label>
        <input type="text" id="pub-title" required value="${escapeHtml(existing?.title || '')}" placeholder="Ex: Reels: 3 ganchos para dobrar sua retenção" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Data Agendada *</label>
          <input type="date" id="pub-date" value="${targetDate}" required class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main" />
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Horário de Pico</label>
          <input type="time" id="pub-time" value="${targetTime}" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main font-mono" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Plataforma</label>
          <select id="pub-platform" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${platforms.map(p => `<option value="${p}" ${existing?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Categoria</label>
          <select id="pub-category" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${categories.map(c => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Status de Produção</label>
          <select id="pub-status" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${statuses.map(s => `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Vincular a um Roteiro (Opcional)</label>
        <select id="pub-script" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
          <option value="">Nenhum roteiro vinculado</option>
          ${scripts.map(s => `<option value="${s.id}" ${existing?.scriptId === s.id ? 'selected' : ''}>${escapeHtml(s.title)} (${s.platform})</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Observações de Publicação & Legenda</label>
        <textarea id="pub-notes" rows="2" placeholder="Notas sobre capas, links na bio, hashtags específicas..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]">${escapeHtml(existing?.notes || '')}</textarea>
      </div>

      ${isEdit ? `
        <div class="pt-3 border-t border-kreato-subtle flex items-center justify-end">
          <button type="button" id="modal-delete-pub" class="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer">
            Remover do planejamento
          </button>
        </div>
      ` : ''}
    </form>
  `;

  openModal({
    title: isEdit ? 'Editar Publicação Agendada' : 'Planejar Nova Publicação',
    contentHtml,
    confirmText: isEdit ? 'Salvar Publicação' : 'Agendar no Calendário',
    onOpen: (modalEl) => {
      const delBtn = modalEl.querySelector('#modal-delete-pub');
      delBtn?.addEventListener('click', () => {
        if (!existing) return;
        if (confirm(`Remover "${existing.title}" do calendário?`)) {
          storage.deletePublication(existing.id);
          showToast('Publicação removida do calendário', 'info');
          const closeIcon = modalEl.querySelector('#modal-close-icon') as HTMLElement;
          closeIcon?.click();
        }
      });
    },
    onConfirm: (modalEl) => {
      const title = (modalEl.querySelector('#pub-title') as HTMLInputElement).value.trim();
      const date = (modalEl.querySelector('#pub-date') as HTMLInputElement).value;
      const time = (modalEl.querySelector('#pub-time') as HTMLInputElement).value;
      const platform = (modalEl.querySelector('#pub-platform') as HTMLSelectElement).value as Platform;
      const category = (modalEl.querySelector('#pub-category') as HTMLSelectElement).value as IdeaCategory;
      const status = (modalEl.querySelector('#pub-status') as HTMLSelectElement).value as PublicationStatus;
      const scriptId = (modalEl.querySelector('#pub-script') as HTMLSelectElement).value;
      const notes = (modalEl.querySelector('#pub-notes') as HTMLTextAreaElement).value.trim();

      if (!title) {
        showToast('Informe o título da publicação.', 'warning');
        return false;
      }
      if (!date) {
        showToast('Informe a data de publicação.', 'warning');
        return false;
      }

      storage.savePublication({
        id: existing?.id,
        title,
        scheduledDate: date,
        scheduledTime: time || '18:00',
        platform,
        category,
        status,
        scriptId: scriptId || undefined,
        notes
      });

      showToast(isEdit ? 'Publicação atualizada!' : 'Conteúdo agendado com sucesso!', 'success');
      return true;
    }
  });
}
