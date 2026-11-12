import { storage } from '../services/storage';
import { LibraryItem, LibraryCategory } from '../types';
import { escapeHtml, formatRelativeDate } from '../utils/formatters';
import { openModal } from '../utils/modal';
import { showToast } from '../utils/toast';

let selectedCategory: string = 'todas';

export function renderLibrary(container: HTMLElement) {
  const allItems = storage.getLibraryItems();

  const categories: LibraryCategory[] = [
    'Vídeos & Estética',
    'Moodboards & Design',
    'Setups & Equipamentos',
    'Modelos de Roteiro',
    'Frases & Ganchos'
  ];

  const filtered = selectedCategory === 'todas'
    ? allItems
    : allItems.filter(i => i.category === selectedCategory);

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Biblioteca de Referências</h1>
          <p class="text-xs text-kreato-muted">
            Seu acervo visual de inspirações, fotos de setup, modelos de roteiro e swipe files criativos.
          </p>
        </div>

        <button id="lib-add-item-btn" class="px-4 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Adicionar Referência</span>
        </button>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button data-cat="todas" class="lib-cat-btn px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${selectedCategory === 'todas' ? 'bg-[#231F1B] dark:bg-[#F4F4F7] text-[#FAF7F2] dark:text-[#0A0A0C] font-bold' : 'bg-kreato-surface border border-kreato text-kreato-muted hover:text-kreato-main'}">
          Todas (${allItems.length})
        </button>
        ${categories
          .map(c => {
            const count = allItems.filter(i => i.category === c).length;
            const active = selectedCategory === c;
            return `
            <button data-cat="${c}" class="lib-cat-btn px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${active ? 'bg-[#231F1B] dark:bg-[#F4F4F7] text-[#FAF7F2] dark:text-[#0A0A0C] font-bold' : 'bg-kreato-surface border border-kreato text-kreato-muted hover:text-kreato-main'}">
              ${c} <span class="text-[11px] font-mono opacity-80 tabular-nums">(${count})</span>
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Visual Bento / Masonry-style Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${
          filtered.length === 0
            ? `<div class="col-span-full kreato-card p-12 text-center text-xs text-kreato-muted">Nenhum item nesta coleção.</div>`
            : filtered
                .map(item => {
                  return `
            <div class="kreato-card-interactive overflow-hidden flex flex-col justify-between cursor-pointer group lib-card" data-id="${item.id}">
              ${
                item.thumbnailUrl
                  ? `
                <div class="relative w-full h-48 bg-[#EFE8D8] overflow-hidden">
                  <img
                    src="${item.thumbnailUrl}"
                    alt="${escapeHtml(item.title)}"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#231F1B]/80 text-white text-[10px] font-semibold backdrop-blur-xs">
                    ${escapeHtml(item.category)}
                  </div>
                </div>
              `
                  : `
                <div class="p-4 bg-[#FAF2DF]/40 dark:bg-[#261E0A]/40 border-b border-kreato-subtle flex items-center justify-between">
                  <span class="text-[11px] font-bold text-[#E9BD4D] uppercase tracking-wider">${escapeHtml(item.category)}</span>
                  <span class="text-[11px] font-mono text-kreato-subtle">${item.type.toUpperCase()}</span>
                </div>
              `
              }

              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div class="space-y-1.5">
                  <h3 class="text-xs sm:text-sm font-bold text-kreato-main leading-snug group-hover:text-kreato-orange transition-colors">
                    ${escapeHtml(item.title)}
                  </h3>
                  <p class="text-xs text-kreato-muted line-clamp-3 leading-relaxed">
                    ${escapeHtml(item.content)}
                  </p>
                </div>

                <div class="space-y-2 pt-2 border-t border-kreato-subtle">
                  ${
                    item.tags && item.tags.length > 0
                      ? `
                    <div class="flex items-center gap-1.5 flex-wrap">
                      ${item.tags.map(t => `<span class="bg-[#EDE5D5] px-2 py-0.5 rounded-md text-[10px] font-medium text-kreato-muted">#${escapeHtml(t)}</span>`).join('')}
                    </div>
                  `
                      : ''
                  }

                  <div class="flex items-center justify-between text-[11px] text-kreato-subtle">
                    <span>${formatRelativeDate(item.createdAt)}</span>
                    ${item.sourceUrl ? `<span class="text-kreato-blue hover:underline">Link de origem ↗</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
                })
                .join('')
        }
      </div>
    </div>
  `;

  // Attach listeners
  container.querySelectorAll('.lib-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedCategory = (e.currentTarget as HTMLElement).getAttribute('data-cat') || 'todas';
      renderLibrary(container);
    });
  });

  container.querySelector('#lib-add-item-btn')?.addEventListener('click', () => {
    openAddLibraryItemModal(container);
  });

  // Clicking a card
  container.querySelectorAll('.lib-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const item = allItems.find(i => i.id === id);
      if (item) {
        openViewLibraryItemModal(item, container);
      }
    });
  });
}

function openAddLibraryItemModal(mainContainer: HTMLElement) {
  const categories: LibraryCategory[] = [
    'Vídeos & Estética',
    'Moodboards & Design',
    'Setups & Equipamentos',
    'Modelos de Roteiro',
    'Frases & Ganchos'
  ];

  const contentHtml = `
    <form id="add-lib-form" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Título da Referência *</label>
        <input type="text" id="lib-title" required placeholder="Ex: Iluminação para gravação de vídeos curtos" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Categoria</label>
          <select id="lib-category" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-kreato-main mb-1">Tipo de Material</label>
          <select id="lib-type" class="w-full px-3 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main">
            <option value="image">Imagem / Moodboard</option>
            <option value="link">Link externo / Artigo</option>
            <option value="text">Frase / Gancho / Anotação</option>
            <option value="template">Modelo / Framework</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Descrição / Conteúdo *</label>
        <textarea id="lib-content" rows="4" required placeholder="Insira o texto da referência, modelo ou observações detalhadas..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417]"></textarea>
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">URL de Origem (Opcional)</label>
        <input type="url" id="lib-url" placeholder="https://..." class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>

      <div>
        <label class="block text-xs font-bold text-kreato-main mb-1">Etiquetas (separadas por vírgula)</label>
        <input type="text" id="lib-tags" placeholder="Setup, Iluminação, Storytelling" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
      </div>
    </form>
  `;

  openModal({
    title: 'Adicionar à Biblioteca',
    contentHtml,
    confirmText: 'Salvar Referência',
    onConfirm: (modalEl) => {
      const title = (modalEl.querySelector('#lib-title') as HTMLInputElement).value.trim();
      const category = (modalEl.querySelector('#lib-category') as HTMLSelectElement).value as LibraryCategory;
      const type = (modalEl.querySelector('#lib-type') as HTMLSelectElement).value as any;
      const content = (modalEl.querySelector('#lib-content') as HTMLTextAreaElement).value.trim();
      const sourceUrl = (modalEl.querySelector('#lib-url') as HTMLInputElement).value.trim();
      const tags = (modalEl.querySelector('#lib-tags') as HTMLInputElement).value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (!title || !content) {
        showToast('Preencha o título e o conteúdo.', 'warning');
        return false;
      }

      storage.saveLibraryItem({
        title,
        category,
        type,
        content,
        sourceUrl: sourceUrl || undefined,
        tags
      });

      showToast('Referência adicionada à Biblioteca!', 'success');
      renderLibrary(mainContainer);
      return true;
    }
  });
}

function openViewLibraryItemModal(item: LibraryItem, mainContainer: HTMLElement) {
  const contentHtml = `
    <div class="space-y-4">
      ${
        item.thumbnailUrl
          ? `
        <div class="w-full h-64 bg-[#EFE8D8] rounded-xl overflow-hidden">
          <img src="${item.thumbnailUrl}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover" />
        </div>
      `
          : ''
      }

      <div class="space-y-1">
        <div class="text-[11px] font-bold text-kreato-orange uppercase tracking-wider">${escapeHtml(item.category)}</div>
        <h2 class="text-base font-bold text-kreato-main">${escapeHtml(item.title)}</h2>
      </div>

      <div class="p-4 bg-[#FAF7F2] dark:bg-[#141417] border border-kreato rounded-xl text-xs text-kreato-main leading-relaxed whitespace-pre-line font-sans">
        ${escapeHtml(item.content)}
      </div>

      ${
        item.sourceUrl
          ? `
        <div class="text-xs">
          <span class="text-kreato-muted">Link de Origem: </span>
          <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-kreato-blue hover:underline break-all">${item.sourceUrl}</a>
        </div>
      `
          : ''
      }

      <div class="flex items-center justify-between pt-2 border-t border-kreato-subtle">
        <button id="lib-delete-item-btn" class="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer">
          Excluir da Biblioteca
        </button>
        <button id="lib-copy-content-btn" class="px-3 py-1.5 bg-kreato-orange text-white text-xs font-semibold rounded-xl hover:bg-kreato-orange-hover transition-colors cursor-pointer">
          Copiar Conteúdo
        </button>
      </div>
    </div>
  `;

  openModal({
    title: 'Detalhes da Referência',
    contentHtml,
    hideFooter: true,
    onOpen: (modalEl) => {
      modalEl.querySelector('#lib-copy-content-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(item.content);
        showToast('Conteúdo copiado!', 'success');
      });

      modalEl.querySelector('#lib-delete-item-btn')?.addEventListener('click', () => {
        if (confirm(`Remover "${item.title}" da biblioteca?`)) {
          storage.deleteLibraryItem(item.id);
          showToast('Referência removida', 'info');
          const closeIcon = modalEl.querySelector('#modal-close-icon') as HTMLElement;
          closeIcon?.click();
          renderLibrary(mainContainer);
        }
      });
    }
  });
}
