import { storage } from '../services/storage';
import { escapeHtml } from '../utils/formatters';

export function renderEvolution(container: HTMLElement) {
  const profile = storage.getProfile();
  const ideas = storage.getIdeas();
  const scripts = storage.getScripts();
  const pubs = storage.getPublications();

  const totalPublished = pubs.filter(p => p.status === 'publicado').length;
  const currentWeekScheduled = pubs.filter(p => p.status === 'agendado' || p.status === 'publicado').length;
  const weekProgressPercent = Math.min(100, Math.round((currentWeekScheduled / profile.targetPostsPerWeek) * 100));

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  pubs.forEach(p => {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  });

  // Weekly output data for SVG chart (Mon-Sun)
  const weeklyData = [
    { day: 'Seg', count: 3, label: '3 produções' },
    { day: 'Ter', count: 5, label: '5 produções' },
    { day: 'Qua', count: 2, label: '2 produções' },
    { day: 'Qui', count: 6, label: '6 produções' },
    { day: 'Sex', count: 4, label: '4 produções' },
    { day: 'Sáb', count: 1, label: '1 produção' },
    { day: 'Dom', count: 2, label: '2 produções' }
  ];

  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in duration-200">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">Minha Evolução Criativa</h1>
          <p class="text-xs text-kreato-muted">
            Acompanhe seu ritmo de publicação, constância de escrita e metas mensais.
          </p>
        </div>

        <div class="p-2.5 bg-kreato-surface border border-kreato rounded-xl flex items-center gap-2 self-start sm:self-auto">
          <span class="w-2 h-2 rounded-full bg-[#2D8A56]"></span>
          <span class="text-xs font-semibold text-kreato-main">Ritmo Ativo: 14 dias de consistência</span>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="text-xs text-kreato-muted">Taxa de Consistência</div>
          <div class="my-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold font-mono text-kreato-main tabular-nums">92%</span>
            <span class="text-[11px] text-[#2D8A56] font-semibold">+6% este mês</span>
          </div>
          <div class="w-full bg-[#EDE5D5] h-1.5 rounded-full overflow-hidden">
            <div class="bg-[#2D8A56] h-full rounded-full" style="width: 92%"></div>
          </div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="text-xs text-kreato-muted">Meta Semanal de Posts</div>
          <div class="my-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold font-mono text-kreato-main tabular-nums">${currentWeekScheduled}</span>
            <span class="text-xs text-kreato-muted">de ${profile.targetPostsPerWeek} posts</span>
          </div>
          <div class="w-full bg-[#EDE5D5] h-1.5 rounded-full overflow-hidden">
            <div class="bg-kreato-orange h-full rounded-full" style="width: ${weekProgressPercent}%"></div>
          </div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="text-xs text-kreato-muted">Roteiros Concluídos</div>
          <div class="my-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold font-mono text-kreato-main tabular-nums">${scripts.length}</span>
            <span class="text-xs text-kreato-muted">no mês</span>
          </div>
          <div class="text-[11px] text-kreato-muted">Meta do mês: ${profile.targetScriptsPerMonth} roteiros</div>
        </div>

        <div class="kreato-card p-4 flex flex-col justify-between">
          <div class="text-xs text-kreato-muted">Ideias Criadas no Acervo</div>
          <div class="my-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold font-mono text-kreato-main tabular-nums">${ideas.length}</span>
            <span class="text-xs text-kreato-muted">conceitos</span>
          </div>
          <div class="text-[11px] text-kreato-muted">${ideas.filter(i => i.status === 'Aprovada').length} prontas para gravação</div>
        </div>
      </div>

      <!-- Charts Section: Two Column Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Chart 1: Production Cadence Bar Chart (8 cols) -->
        <div class="lg:col-span-7 kreato-card p-6 space-y-4 shadow-xs">
          <div class="flex items-center justify-between pb-2 border-b border-kreato-subtle">
            <div>
              <h2 class="text-sm font-bold text-kreato-main">Cadência Semanal de Criação</h2>
              <p class="text-xs text-kreato-muted">Volume de anotações, roteirizações e publicações diárias</p>
            </div>
            <span class="text-xs font-mono font-semibold text-kreato-orange">Semana Atual</span>
          </div>

          <!-- SVG Bar Chart -->
          <div class="pt-4 pb-2">
            <div class="flex items-end justify-between gap-3 h-48 px-2 border-b border-kreato">
              ${weeklyData
                .map(d => {
                  const heightPercent = Math.round((d.count / maxWeeklyCount) * 85);
                  return `
                  <div class="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div class="text-[10px] font-mono font-bold text-kreato-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      ${d.count}
                    </div>
                    <div
                      class="w-full max-w-[42px] bg-[#E8DEC8] group-hover:bg-kreato-orange rounded-t-lg transition-all duration-300 relative"
                      style="height: ${heightPercent}%;"
                    ></div>
                    <span class="text-[11px] font-medium text-kreato-muted">${d.day}</span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-kreato-muted pt-2">
            <span>Dia mais produtivo: <strong>Quinta-feira</strong></span>
            <span>Média: <strong>3.3 criações/dia</strong></span>
          </div>
        </div>

        <!-- Chart 2: Platform Distribution (5 cols) -->
        <div class="lg:col-span-5 kreato-card p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div class="pb-2 border-b border-kreato-subtle">
            <h2 class="text-sm font-bold text-kreato-main">Distribuição por Canal</h2>
            <p class="text-xs text-kreato-muted">Onde sua energia criativa está concentrada</p>
          </div>

          <div class="space-y-3 py-2">
            ${['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Newsletter']
              .map(p => {
                const count = platformCounts[p] || 0;
                const total = pubs.length || 1;
                const pct = Math.round((count / total) * 100);
                let barColor = 'bg-kreato-orange';
                if (p === 'YouTube') barColor = 'bg-[#DC2626]';
                else if (p === 'Instagram') barColor = 'bg-[#E1306C]';
                else if (p === 'LinkedIn') barColor = 'bg-[#0A66C2]';
                else if (p === 'TikTok') barColor = 'bg-[#231F1B]';
                else if (p === 'Newsletter') barColor = 'bg-kreato-purple';

                return `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-medium">
                    <span class="text-kreato-main">${p}</span>
                    <span class="font-mono text-kreato-muted tabular-nums">${count} posts (${pct}%)</span>
                  </div>
                  <div class="w-full bg-[#EDE5D5] h-2 rounded-full overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>

          <div class="p-3 bg-kreato-surface border border-kreato rounded-xl text-xs text-kreato-muted">
            <span class="inline-flex items-center gap-1.5"><svg class="w-3.5 h-3.5 text-kreato-yellow shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg><strong>Insight Kreato:</strong></span> Seus conteúdos no YouTube e Instagram têm gerado a maior taxa de reaproveitamento para LinkedIn.
          </div>
        </div>
      </div>

      <!-- Activity Timeline / Creative Milestones -->
      <section class="kreato-card p-6 space-y-4 shadow-xs">
        <div class="pb-2 border-b border-kreato-subtle">
          <h2 class="text-sm font-bold text-kreato-main">Histórico de Atividades & Marcos Recentes</h2>
          <p class="text-xs text-kreato-muted">Registro temporal das suas conquistas criativas no Kreato</p>
        </div>

        <div class="space-y-3 pt-2">
          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-[#2D8A56]/15 text-[#2D8A56] flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div class="space-y-0.5">
              <div class="text-xs font-bold text-kreato-main">Publicação agendada: "Reels: A anatomia do gancho de 3 segundos"</div>
              <p class="text-[11px] text-kreato-muted">Agendado para Instagram no horário nobre (18:30).</p>
              <div class="text-[10px] text-kreato-subtle font-mono">Hoje às 10:15</div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-[#527DBB]/15 text-[#527DBB] flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <div class="space-y-0.5">
              <div class="text-xs font-bold text-kreato-main">Roteiro concluído: "Como organizar seu calendário editorial no Notion"</div>
              <p class="text-[11px] text-kreato-muted">380 palavras · Roteiro de vídeo longo para YouTube.</p>
              <div class="text-[10px] text-kreato-subtle font-mono">Ontem às 17:40</div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-[#9274C8]/15 text-[#9274C8] flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="space-y-0.5">
              <div class="text-xs font-bold text-kreato-main">Sessão criativa no Kreato AI finalizada</div>
              <p class="text-[11px] text-kreato-muted">5 novas ideias de retenção geradas e arquivadas no Banco de Ideias.</p>
              <div class="text-[10px] text-kreato-subtle font-mono">Há 2 dias</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
