export interface ModalOptions {
  title: string;
  contentHtml: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'purple';
  hideFooter?: boolean;
  maxWidthClass?: string; // e.g. 'max-w-2xl', 'max-w-xl'
  onConfirm?: (modalEl: HTMLElement) => boolean | Promise<boolean>;
  onCancel?: () => void;
  onOpen?: (modalEl: HTMLElement) => void;
}

let activeEscapeListener: ((e: KeyboardEvent) => void) | null = null;

export function openModal(options: ModalOptions) {
  const container = document.getElementById('modal-container');
  const contentWrapper = document.getElementById('modal-content');
  if (!container || !contentWrapper) return;

  // Apply max-width
  contentWrapper.className = `bg-kreato-surface border border-kreato rounded-2xl w-full ${options.maxWidthClass || 'max-w-2xl'} max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`;

  let confirmButtonHtml = '';
  if (!options.hideFooter) {
    let confirmBg = 'bg-kreato-orange hover:bg-kreato-orange-hover text-white';
    if (options.confirmVariant === 'danger') {
      confirmBg = 'bg-red-600 hover:bg-red-700 text-white';
    } else if (options.confirmVariant === 'purple') {
      confirmBg = 'bg-kreato-purple hover:bg-[#8060B7] text-white';
    }

    confirmButtonHtml = `
      <div class="px-6 py-3.5 bg-[#F5EFE4] border-t border-kreato flex items-center justify-end gap-2.5 shrink-0">
        <button id="modal-cancel-btn" type="button" class="px-4 py-2 text-xs font-semibold text-kreato-muted hover:text-kreato-main rounded-xl hover:bg-[#EBE2D0] transition-colors cursor-pointer">
          ${options.cancelText || 'Cancelar'}
        </button>
        <button id="modal-confirm-btn" type="button" class="px-4 py-2 text-xs font-semibold rounded-xl ${confirmBg} transition-colors cursor-pointer shadow-xs">
          ${options.confirmText || 'Salvar'}
        </button>
      </div>
    `;
  }

  contentWrapper.innerHTML = `
    <!-- Modal Header -->
    <div class="px-6 py-4 border-b border-kreato flex items-center justify-between shrink-0 bg-[#FAF7F2] dark:bg-[#141417]">
      <h3 class="text-base font-bold text-kreato-main tracking-tight">${options.title}</h3>
      <button id="modal-close-icon" type="button" class="p-1.5 text-kreato-subtle hover:text-kreato-main rounded-lg hover:bg-[#EFE8D8] transition-colors cursor-pointer" aria-label="Fechar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 overflow-y-auto flex-1 space-y-4">
      ${options.contentHtml}
    </div>

    ${confirmButtonHtml}
  `;

  const closeModal = () => {
    container.classList.add('hidden');
    if (activeEscapeListener) {
      document.removeEventListener('keydown', activeEscapeListener);
      activeEscapeListener = null;
    }
    options.onCancel?.();
  };

  // Wire up close triggers
  const closeIcon = contentWrapper.querySelector('#modal-close-icon');
  const cancelBtn = contentWrapper.querySelector('#modal-cancel-btn');
  const confirmBtn = contentWrapper.querySelector('#modal-confirm-btn');

  closeIcon?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Wire confirm button
  confirmBtn?.addEventListener('click', async () => {
    if (options.onConfirm) {
      const shouldClose = await options.onConfirm(contentWrapper);
      if (shouldClose !== false) {
        container.classList.add('hidden');
        if (activeEscapeListener) {
          document.removeEventListener('keydown', activeEscapeListener);
          activeEscapeListener = null;
        }
      }
    } else {
      closeModal();
    }
  });

  // Backdrop click to close (only if click is directly on container)
  container.onclick = (e) => {
    if (e.target === container) {
      closeModal();
    }
  };

  // Escape key
  activeEscapeListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', activeEscapeListener);

  container.classList.remove('hidden');

  if (options.onOpen) {
    options.onOpen(contentWrapper);
  }
}

export function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    container.classList.add('hidden');
  }
  if (activeEscapeListener) {
    document.removeEventListener('keydown', activeEscapeListener);
    activeEscapeListener = null;
  }
}
