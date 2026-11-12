import { storage } from '../services/storage';
import { Publication, Platform } from '../types';
import { getPlatformBadge, getStatusBadge, getCategoryAccent, escapeHtml } from '../utils/formatters';
import { openPublicationModal } from '../modules/creationModals';

let currentPlanningView: 'month' | 'week' | 'list' = 'month';
let activeDate = new Date(2026, 10, 8); // November 2026

export function renderPlanning(container: HTMLElement) {
  const publications = storage.getPublications();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = activeDate.getFullYear();
  const currentMonth = activeDate.getMonth();
  const monthLabel = `${monthNames[currentMonth]} de ${currentYear}`;

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Header with Navigation & View Toggles -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Calendário Editorial</h1>
          <p class="text-xs text-kreato-muted">
            Planejamento e distribuição estratégica de publicações por data e canal.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Month Switcher Nav -->
          <div class="flex items-center bg-[#FAF7F2] dark:bg-[#141417] border border-kreato rounded-xl p-1">
            <button id="cal-prev-btn" class="p-1.5 text-kreato-muted hover:text-kreato-main rounded-lg hover:bg-[#EFE8D8] transition-colors cursor-pointer" title="Mês anterior">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-bold text-kreato-main px-3 min-w-[130px] text-center">${monthLabel}</span>
            <button id="cal-next-btn" class="p-1.5 text-kreato-muted hover:text-kreato-main rounded-lg hover:bg-[#EFE8D8] transition-colors cursor-pointer" title="Próximo mês">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- View Mode Selector -->
          <div class="flex items-center bg-[#FAF7F2] dark:bg-[#141417] border border-kreato rounded-xl p-1 text-xs">
            <button id="cal-view-month" class="px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${currentPlanningView === 'month' ? 'bg-[#EFE8D8] text-kreato-main font-semibold shadow-xs' : 'text-kreato-muted hover:text-kreato-main'}">
              Mês
            </button>
            <button id="cal-view-week" class="px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${currentPlanningView === 'week' ? 'bg-[#EFE8D8] text-kreato-main font-semibold shadow-xs' : 'text-kreato-muted hover:text-kreato-main'}">
              Semana
            </button>
            <button id="cal-view-list" class="px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${currentPlanningView === 'list' ? 'bg-[#EFE8D8] text-kreato-main font-semibold shadow-xs' : 'text-kreato-muted hover:text-kreato-main'}">
              Lista
            </button>
          </div>

          <!-- Create Button -->
          <button id="cal-create-pub-btn" class="px-3.5 py-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Planejar Post</span>
          </button>
        </div>
      </div>

      <!-- Calendar View Renderer -->
      <div id="planning-content-view">
        ${
          currentPlanningView === 'month'
            ? renderMonthGrid(activeDate, publications)
            : currentPlanningView === 'week'
            ? renderWeekGrid(activeDate, publications)
            : renderListView(publications)
        }
      </div>
    </div>
  `;

  // Attach controls
  container.querySelector('#cal-create-pub-btn')?.addEventListener('click', () => openPublicationModal());

  container.querySelector('#cal-prev-btn')?.addEventListener('click', () => {
    activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1);
    renderPlanning(container);
  });

  container.querySelector('#cal-next-btn')?.addEventListener('click', () => {
    activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);
    renderPlanning(container);
  });

  container.querySelector('#cal-view-month')?.addEventListener('click', () => {
    currentPlanningView = 'month';
    renderPlanning(container);
  });

  container.querySelector('#cal-view-week')?.addEventListener('click', () => {
    currentPlanningView = 'week';
    renderPlanning(container);
  });

  container.querySelector('#cal-view-list')?.addEventListener('click', () => {
    currentPlanningView = 'list';
    renderPlanning(container);
  });

  // Clicking on scheduled cards
  container.querySelectorAll('.cal-post-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const pub = publications.find(p => p.id === id);
      if (pub) openPublicationModal(pub);
    });
  });

  // Clicking on an empty day cell to add post on that day
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.cal-post-card')) return;
      const dateStr = (e.currentTarget as HTMLElement).getAttribute('data-date');
      if (dateStr) openPublicationModal(undefined, dateStr);
    });
  });
}

function renderMonthGrid(activeDate: Date, publications: Publication[]): string {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  // First day of month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Number of days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  let cellsHtml = '';

  // Blank cells before month starts
  for (let i = 0; i < firstDayIndex; i++) {
    cellsHtml += `<div class="min-h-[110px] bg-[#EDE5D5]/20 border-b border-r border-kreato-subtle p-2 text-kreato-subtle opacity-40"></div>`;
  }

  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateFormatted = `${year}-${monthStr}-${dayStr}`;

    const isToday =
      new Date().getFullYear() === year &&
      new Date().getMonth() === month &&
      new Date().getDate() === day;

    const dayPubs = publications.filter(p => p.scheduledDate === dateFormatted);

    cellsHtml += `
      <div class="cal-day-cell min-h-[110px] bg-[#FAF7F2] dark:bg-[#141417] hover:bg-[#FAF3E6] border-b border-r border-kreato-subtle p-2 flex flex-col justify-between transition-colors cursor-pointer group" data-date="${dateFormatted}">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-bold tabular-nums ${isToday ? 'w-6 h-6 rounded-full bg-kreato-orange text-white flex items-center justify-center' : 'text-kreato-main'}">
            ${day}
          </span>
          <span class="text-[10px] text-kreato-subtle opacity-0 group-hover:opacity-100 transition-opacity">+ Post</span>
        </div>

        <div class="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-[85px] no-scrollbar">
          ${dayPubs
            .map(pub => {
              const catStyle = getCategoryAccent(pub.category);
              return `
              <div class="cal-post-card p-1.5 bg-white dark:bg-[#141417] border border-kreato rounded-lg shadow-xs hover:border-kreato-orange transition-colors cursor-pointer text-left" data-id="${pub.id}">
                <div class="flex items-center justify-between text-[10px] mb-0.5">
                  ${getPlatformBadge(pub.platform)}
                  <span class="font-mono text-kreato-muted tabular-nums">${pub.scheduledTime}</span>
                </div>
                <div class="text-[11px] font-bold text-kreato-main truncate leading-tight">${escapeHtml(pub.title)}</div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="kreato-card overflow-hidden shadow-xs">
      <!-- Weekday Header -->
      <div class="grid grid-cols-7 border-b border-kreato bg-[#F5EFE4] text-center text-xs font-bold text-kreato-muted py-2.5">
        ${weekDays.map(d => `<div>${d}</div>`).join('')}
      </div>

      <!-- Month Cells Grid -->
      <div class="grid grid-cols-7 border-l border-t border-kreato-subtle">
        ${cellsHtml}
      </div>
    </div>
  `;
}

function renderWeekGrid(activeDate: Date, publications: Publication[]): string {
  // Get start of week (Sunday or Monday)
  const startOfWeek = new Date(activeDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);

  const days: { date: Date; dateStr: string; label: string; isToday: boolean }[] = [];
  const weekDayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    const isToday =
      new Date().getFullYear() === year &&
      new Date().getMonth() === d.getMonth() &&
      new Date().getDate() === d.getDate();

    days.push({
      date: d,
      dateStr,
      label: weekDayLabels[i],
      isToday
    });
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
      ${days
        .map(d => {
          const dayPubs = publications.filter(p => p.scheduledDate === d.dateStr);
          return `
          <div class="cal-day-cell kreato-card p-3 min-h-[350px] flex flex-col justify-between cursor-pointer hover:border-kreato-orange transition-colors" data-date="${d.dateStr}">
            <div class="pb-2 border-b border-kreato-subtle flex items-center justify-between">
              <div>
                <div class="text-[11px] font-semibold text-kreato-muted">${d.label}</div>
                <div class="text-sm font-bold text-kreato-main font-mono tabular-nums ${d.isToday ? 'text-kreato-orange' : ''}">
                  ${d.date.getDate()} de ${d.date.toLocaleDateString('pt-BR', { month: 'short' })}
                </div>
              </div>
              <button type="button" class="text-xs text-kreato-subtle hover:text-kreato-main">+</button>
            </div>

            <div class="space-y-2 mt-3 flex-1 overflow-y-auto">
              ${
                dayPubs.length === 0
                  ? `<div class="text-[11px] text-kreato-subtle text-center pt-8">Sem publicações</div>`
                  : dayPubs
                      .map(pub => {
                        return `
                  <div class="cal-post-card p-2.5 bg-white dark:bg-[#141417] border border-kreato rounded-xl shadow-xs hover:border-kreato-orange transition-colors cursor-pointer text-left space-y-1" data-id="${pub.id}">
                    <div class="flex items-center justify-between text-[11px]">
                      ${getPlatformBadge(pub.platform)}
                      <span class="font-mono text-kreato-muted text-[10px] tabular-nums">${pub.scheduledTime}</span>
                    </div>
                    <div class="text-xs font-bold text-kreato-main leading-tight line-clamp-2">${escapeHtml(pub.title)}</div>
                    <div class="pt-1">${getStatusBadge(pub.status)}</div>
                  </div>
                `;
                      })
                      .join('')
              }
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

function renderListView(publications: Publication[]): string {
  const sorted = [...publications].sort((a, b) => (a.scheduledDate > b.scheduledDate ? 1 : -1));

  if (sorted.length === 0) {
    return `<div class="kreato-card p-12 text-center text-xs text-kreato-muted">Nenhuma publicação cadastrada.</div>`;
  }

  return `
    <div class="kreato-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#F5EFE4] dark:bg-[#1C1C21] text-kreato-muted font-bold border-b border-kreato">
            <tr>
              <th class="p-3.5 pl-5">Data & Hora</th>
              <th class="p-3.5">Título do Conteúdo</th>
              <th class="p-3.5">Canal</th>
              <th class="p-3.5">Categoria</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 pr-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-kreato-subtle">
            ${sorted
              .map(pub => {
                const catStyle = getCategoryAccent(pub.category);
                return `
                <tr class="hover:bg-[#FAF7F2] dark:hover:bg-[#1C1C21] transition-colors cal-post-card cursor-pointer" data-id="${pub.id}">
                  <td class="p-3.5 pl-5 font-mono text-kreato-main tabular-nums whitespace-nowrap">
                    ${pub.scheduledDate} · ${pub.scheduledTime}
                  </td>
                  <td class="p-3.5 font-bold text-kreato-main">
                    ${escapeHtml(pub.title)}
                  </td>
                  <td class="p-3.5 whitespace-nowrap">
                    ${getPlatformBadge(pub.platform)}
                  </td>
                  <td class="p-3.5 whitespace-nowrap">
                    <span class="font-semibold ${catStyle.text}">${escapeHtml(pub.category)}</span>
                  </td>
                  <td class="p-3.5 whitespace-nowrap">
                    ${getStatusBadge(pub.status)}
                  </td>
                  <td class="p-3.5 pr-5 text-right whitespace-nowrap">
                    <span class="text-kreato-orange font-semibold hover:underline">Editar</span>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
