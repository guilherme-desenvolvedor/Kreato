import { Platform, IdeaCategory, IdeaStatus, PublicationStatus, ScriptStatus } from '../types';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  } catch {
    return isoDate;
  }
}

export function formatRelativeDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return isoDate;
  }
}

export function getPlatformBadge(platform: Platform): string {
  switch (platform) {
    case 'YouTube':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626]">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        YouTube
      </span>`;
    case 'Instagram':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E1306C]">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        Instagram
      </span>`;
    case 'TikTok':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111111]">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.34 6.34 0 0 0 1.88-4.49V8.89a8.27 8.27 0 0 0 4.89 1.57V7.02c-.34-.03-.68-.14-1-.33z"/></svg>
        TikTok
      </span>`;
    case 'LinkedIn':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2]">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        LinkedIn
      </span>`;
    case 'Newsletter':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F28C45]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        Newsletter
      </span>`;
    case 'Podcast':
      return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9274C8]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
        Podcast
      </span>`;
  }
}

export function getCategoryAccent(category: IdeaCategory): { text: string; bg: string; dot: string } {
  switch (category) {
    case 'Tecnologia':
      return { text: 'text-[#527DBB]', bg: 'bg-[#527DBB]/10', dot: 'bg-[#527DBB]' };
    case 'Storytelling':
      return { text: 'text-[#9274C8]', bg: 'bg-[#9274C8]/10', dot: 'bg-[#9274C8]' };
    case 'Monetização':
      return { text: 'text-[#2D8A56]', bg: 'bg-[#2D8A56]/10', dot: 'bg-[#2D8A56]' };
    case 'Bastidores':
      return { text: 'text-[#F28C45]', bg: 'bg-[#F28C45]/10', dot: 'bg-[#F28C45]' };
    case 'Design':
      return { text: 'text-[#E9BD4D]', bg: 'bg-[#E9BD4D]/15', dot: 'bg-[#E9BD4D]' };
    case 'Produtividade':
      return { text: 'text-[#527DBB]', bg: 'bg-[#527DBB]/10', dot: 'bg-[#527DBB]' };
    case 'Tendências':
      return { text: 'text-[#9274C8]', bg: 'bg-[#9274C8]/10', dot: 'bg-[#9274C8]' };
    default:
      return { text: 'text-kreato-muted', bg: 'bg-kreato-border/40', dot: 'bg-kreato-muted' };
  }
}

export function getStatusBadge(status: IdeaStatus | PublicationStatus | ScriptStatus): string {
  switch (status) {
    case 'Nova':
    case 'rascunho':
    case 'Rascunho':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-kreato-muted">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        <span>${status === 'rascunho' ? 'Rascunho' : status}</span>
      </span>`;
    case 'Em desenvolvimento':
    case 'Em gravação':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-[#527DBB] font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-[#527DBB]"></span>
        <span>${status}</span>
      </span>`;
    case 'Aprovada':
    case 'Pronto':
    case 'pronto':
    case 'Gravado':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-[#2D8A56] font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-[#2D8A56]"></span>
        <span>${status === 'pronto' ? 'Pronto' : status}</span>
      </span>`;
    case 'agendado':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-[#F28C45] font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-[#F28C45]"></span>
        <span>Agendado</span>
      </span>`;
    case 'publicado':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-[#9274C8] font-medium">
        <svg class="w-3.5 h-3.5 text-[#9274C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span>Publicado</span>
      </span>`;
    case 'Arquivada':
      return `<span class="inline-flex items-center gap-1.5 text-xs text-kreato-subtle">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <span>Arquivada</span>
      </span>`;
    default:
      return `<span class="text-xs text-kreato-muted">${status}</span>`;
  }
}
