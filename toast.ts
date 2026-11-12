export type ToastType = 'success' | 'info' | 'warning' | 'error';

export function showToast(message: string, type: ToastType = 'success', durationMs = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium transition-all duration-200 transform translate-y-2 opacity-0';

  let bgClass = 'bg-[#FAF7F2] dark:bg-[#141417] text-kreato-main border-[#E5DCCB]';
  let iconSvg = '';

  if (type === 'success') {
    bgClass = 'bg-[#FAF7F2] dark:bg-[#141417] text-kreato-main border-[#F28C45]/40';
    iconSvg = `<svg class="w-4 h-4 text-[#F28C45] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'info') {
    bgClass = 'bg-[#FAF7F2] dark:bg-[#141417] text-kreato-main border-[#527DBB]/40';
    iconSvg = `<svg class="w-4 h-4 text-[#527DBB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  } else if (type === 'warning') {
    bgClass = 'bg-[#FAF7F2] dark:bg-[#141417] text-kreato-main border-[#E9BD4D]/50';
    iconSvg = `<svg class="w-4 h-4 text-[#E9BD4D] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else if (type === 'error') {
    bgClass = 'bg-[#FAF7F2] dark:bg-[#141417] text-[#991B1B] border-[#EF4444]/40';
    iconSvg = `<svg class="w-4 h-4 text-[#EF4444] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  }

  toast.className += ` ${bgClass}`;
  toast.innerHTML = `
    ${iconSvg}
    <span class="flex-1">${message}</span>
    <button type="button" class="text-kreato-subtle hover:text-kreato-main ml-1 cursor-pointer">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 200);
  };
  closeBtn?.addEventListener('click', dismiss);

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(dismiss, durationMs);
}
