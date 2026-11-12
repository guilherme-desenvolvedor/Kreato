import { supabase } from '../services/supabase';
import { storage } from '../services/storage';
import { AiMessage } from '../types';
import { escapeHtml } from '../utils/formatters';
import { showToast } from '../utils/toast';
import { openScriptModal } from '../modules/creationModals';

let isGenerating = false;

// Pre-packaged realistic simulated creative responses
function getSimulatedAiResponse(userPrompt: string): { text: string; actionType?: AiMessage['actionType'] } {
  const lower = userPrompt.toLowerCase();

  if (lower.includes('gancho') || lower.includes('hook') || lower.includes('retenção')) {
    return {
      actionType: 'hook',
      text: `Aqui estão **3 opções de ganchos de alta retenção** para testar nos seus próximos vídeos curtos:

### 1. Quebra de Crença Comum (Curiosidade Rápida)
> *"Todo mundo diz que você precisa postar todo santo dia para crescer no digital, mas a verdade é que isso só garante burnout. Aqui está o método de 3 posts intencionais que dobrou meu alcance..."*
- **Por que funciona:** Ataca uma dor latente da audiência logo no segundo 1.5.

### 2. O Gancho de Contraste Visual + Verbal
> *"Eu passei 30 dias testando duas formas completamente diferentes de roteirizar vídeos. Um formato flopou com 800 views; o outro bateu 140 mil. O segredo está nessa frase aqui..."*
- **Dica de filmagem:** Faça um corte seco aproximando a câmera na frase final do gancho.

### 3. Pergunta Inesperada com Resposta Imediata
> *"Qual foi a última vez que você salvou um post e realmente voltou para ler? Se a resposta foi nunca, seus seguidores fazem o mesmo com você. Vamos mudar isso agora."*

💡 *Dica do Krea:* Você pode transformar qualquer um desses ganchos diretamente em um roteiro no estúdio!`
    };
  }

  if (lower.includes('roteiro') || lower.includes('script') || lower.includes('estruturar')) {
    return {
      actionType: 'script',
      text: `Estruturei um roteiro completo de **60 segundos** focado em alta retenção e autoridade:

### 🎬 TÍTULO: O erro invisível ao começar no digital

**1. O Gancho (00:00 - 00:04):**
*"O maior erro que cometi quando comecei a criar conteúdo não foi equipamento ruim nem falta de consistência. Foi tentar agradar todo mundo."*

**2. O Desenvolvimento (00:04 - 00:45):**
*"Quando você fala com todo mundo, você não conecta de verdade com ninguém. 
Em vez de falar de 'marketing digital amplo', comece a falar de 'como freelancers de design conseguem seu primeiro cliente internacional'.
Quanto mais específico o problema, mais valiosa a solução que você entrega. 
Audiência de nicho não apenas assiste: ela confia, salva e compra."*

**3. Chamada para Ação (00:45 - 00:60):**
*"Comente a palavra 'NICHO' aqui nos comentários se você quer que eu analise o seu perfil no próximo vídeo!"*

📌 **Notas de Gravação:** Use um microfone direcional próximo, iluminação e adicione zoom suave no início do desenvolvimento.`
    };
  }

  if (lower.includes('repurpose') || lower.includes('transformar') || lower.includes('linkedin') || lower.includes('formato')) {
    return {
      actionType: 'repurpose',
      text: `Aqui está o plano de **Repurposing Multiplataforma** para multiplicar o alcance desse conteúdo em 4 formatos:

1. **LinkedIn (Post de Texto Editorial):**
Abra com uma lição de bastidor em 1 linha. Detalhe os 3 aprendizados principais em marcadores curtos e finalize com uma pergunta direcionada para a sua rede de conexões.

2. **Instagram Carrossel (7 Slides):**
- *Capa:* Título com contraste alto e promessa prática.
- *Slide 2:* O problema invisível que quase ninguém nota.
- *Slides 3 a 5:* O framework em 3 passos simples.
- *Slide 6:* Resumo visual tipo checklist.
- *Slide 7:* Chamada para salvar o conteúdo.

3. **Reels / TikTok (Vídeo Dinâmico de 45s):**
Grave apenas o cerne do slide 3 e 4, mostrando a tela do computador ou o resultado final na prática.

4. **Newsletter:**
Conte a história de como você chegou nessa conclusão, com bastidores mais pessoais e links para as referências na sua Biblioteca.`
    };
  }

  if (lower.includes('legenda') || lower.includes('caption') || lower.includes('seo')) {
    return {
      actionType: 'caption',
      text: `Aqui está uma sugestão de **legenda com storytelling e otimização para busca (SEO)**:

*Se você pudesse dar apenas um conselho para você mesmo no início da sua jornada criativa, qual seria?* 👇

Durante muito tempo, achei que o que me impedia de ter consistência era a falta de tempo. Mas na realidade, era a falta de um fluxo claro de ideação e roteiro.

Quando você aprende a separar o momento de ter ideias do momento de sentar para gravar, a ansiedade criativa simplesmente desaparece.

Salve este post para consultar quando o bloqueio criativo bater. 🏷️

---
#criacaodeconteudo #criatividade #produtividade #storytelling #creatorlife #fluxocriativo`
    };
  }

  // Default ideas generator response
  return {
    actionType: 'ideas',
    text: `Analisei o seu nicho criativo e gerei **5 ideias originais de conteúdo** prontas para gravação:

1. **"Por que parei de usar [Ferramenta Famosa] no meu fluxo de trabalho":**
   - *Ângulo:* Quebra de padrão honesta sobre ferramentas que prometem demais e entregam complexidade desnecessária.
   - *Melhor formato:* Vídeo longo no YouTube ou Carrossel.

2. **"O método dos 15 minutos para nunca mais sofrer de bloqueio de ideias":**
   - *Ângulo:* Exercício prático de associação livre usando o acervo de referências do Kreato.
   - *Melhor formato:* Reels ou TikTok dinâmico.

3. **"Como estruturei minha primeira oferta digital sem ter audiência gigante":**
   - *Ângulo:* Estudo de caso com números reais e foco em monetização sustentável.
   - *Melhor formato:* Artigo no LinkedIn ou Newsletter.

4. **"3 detalhes no meu setup que parecem caros mas custaram menos de R$ 100":**
   - *Ângulo:* Curadoria acessível de iluminação e posicionamento de câmera.
   - *Melhor formato:* Reels ou Shorts.

5. **"A anatomia de um carrossel que converteu 400 novos seguidores":**
   - *Ângulo:* Desconstrução do design, tipografia e hierarquia de leitura.
   - *Melhor formato:* Carrossel no Instagram.

Você pode salvar qualquer uma dessas ideias diretamente no seu acervo clicando nos botões abaixo!`
  };
}

export function renderAi(container: HTMLElement) {
  const history = storage.getAiHistory();

  container.innerHTML = `
    <div class="h-[calc(100dvh-75px)] md:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-3 lg:gap-6 animate-in fade-in duration-200">
      <!-- Left Panel on Desktop: Creative Prompts & Actions (Hidden on mobile to prioritize chat & input) -->
      <aside class="hidden lg:flex w-72 flex-col gap-4 shrink-0">
        <div class="p-4 bg-kreato-surface border border-kreato rounded-2xl space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-kreato-purple text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <h2 class="text-xs font-bold text-kreato-main">Copiloto Krea</h2>
              <p class="text-[10px] text-kreato-muted">Treinado para o seu tom autoral</p>
            </div>
          </div>

          <div class="pt-2 text-xs text-kreato-muted space-y-1">
            <div class="flex justify-between py-1 border-b border-kreato-subtle">
              <span>Nicho ativo:</span>
              <span class="font-semibold text-kreato-main">Design & Tech</span>
            </div>
            <div class="flex justify-between py-1 border-b border-kreato-subtle">
              <span>Tom de voz:</span>
              <span class="font-semibold text-kreato-main">Acolhedor & Direto</span>
            </div>
          </div>
        </div>

        <!-- Quick AI Direct Actions on Desktop -->
        <div class="p-4 bg-kreato-surface border border-kreato rounded-2xl flex-1 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="text-[11px] font-bold text-kreato-subtle uppercase tracking-wider mb-2">Ações Rápidas</div>

            <button data-action="ideas" class="ai-quick-btn w-full p-2.5 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left text-xs font-medium text-kreato-main flex items-center gap-2.5 transition-colors cursor-pointer">
              <span class="w-6 h-6 rounded-lg bg-[#E9BD4D]/15 text-[#E9BD4D] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </span>
              <span>Gerar 5 ideias novas</span>
            </button>

            <button data-action="script" class="ai-quick-btn w-full p-2.5 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left text-xs font-medium text-kreato-main flex items-center gap-2.5 transition-colors cursor-pointer">
              <span class="w-6 h-6 rounded-lg bg-[#527DBB]/15 text-[#527DBB] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </span>
              <span>Estruturar roteiro de 60s</span>
            </button>

            <button data-action="hook" class="ai-quick-btn w-full p-2.5 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left text-xs font-medium text-kreato-main flex items-center gap-2.5 transition-colors cursor-pointer">
              <span class="w-6 h-6 rounded-lg bg-[#F28C45]/15 text-[#F28C45] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </span>
              <span>Melhorar gancho de abertura</span>
            </button>

            <button data-action="repurpose" class="ai-quick-btn w-full p-2.5 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left text-xs font-medium text-kreato-main flex items-center gap-2.5 transition-colors cursor-pointer">
              <span class="w-6 h-6 rounded-lg bg-[#9274C8]/15 text-[#9274C8] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </span>
              <span>Multiplicar formatos (Repurposing)</span>
            </button>

            <button data-action="caption" class="ai-quick-btn w-full p-2.5 bg-white dark:bg-[#1A1613] hover:bg-kreato-surface border border-kreato rounded-xl text-left text-xs font-medium text-kreato-main flex items-center gap-2.5 transition-colors cursor-pointer">
              <span class="w-6 h-6 rounded-lg bg-[#2D8A56]/15 text-[#2D8A56] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
              </span>
              <span>Sugerir legenda com SEO</span>
            </button>
          </div>

          <div class="pt-4 border-t border-kreato-subtle mt-4">
            <button id="ai-clear-history-btn" class="text-xs text-kreato-muted hover:text-kreato-main flex items-center gap-1.5 transition-colors cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Limpar histórico do chat</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Chat Conversation Workspace (Takes full vertical space) -->
      <div class="flex-1 flex flex-col bg-kreato-surface border border-kreato rounded-2xl overflow-hidden shadow-xs relative min-w-0">
        <!-- Chat Header with Quick Actions on Mobile -->
        <div class="px-4 sm:px-6 py-3 border-b border-kreato bg-kreato-surface flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-kreato-purple text-white flex items-center justify-center font-bold text-xs shrink-0">
              <svg class="w-4 h-4 text-kreato-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <span class="text-xs font-bold text-kreato-main">Copiloto Krea</span>
              <span class="hidden sm:inline-block text-kreato-subtle mx-1">·</span>
              <span class="hidden sm:inline-block text-[11px] text-[#2D8A56] font-medium">Pronto para criar</span>
            </div>
          </div>

          <button id="ai-new-session-btn" class="px-2.5 py-1 text-xs font-semibold text-kreato-muted hover:text-kreato-main rounded-lg hover:bg-kreato-bg transition-colors flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <span class="hidden sm:inline">Reiniciar</span>
          </button>
        </div>

        <!-- Mobile Horizontal Quick Actions Strip (Swipeable chips right above chat) -->
        <div class="lg:hidden px-3 py-2 border-b border-kreato-subtle bg-kreato-surface flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar text-xs">
          <button data-action="ideas" class="ai-quick-btn whitespace-nowrap px-2.5 py-1 bg-white dark:bg-[#1A1613] border border-kreato rounded-lg font-medium text-kreato-main flex items-center gap-1 shrink-0 cursor-pointer text-[11px]">
            <span>💡 5 Ideias</span>
          </button>
          <button data-action="hook" class="ai-quick-btn whitespace-nowrap px-2.5 py-1 bg-white dark:bg-[#1A1613] border border-kreato rounded-lg font-medium text-kreato-main flex items-center gap-1 shrink-0 cursor-pointer text-[11px]">
            <span>🎯 Gancho 3s</span>
          </button>
          <button data-action="script" class="ai-quick-btn whitespace-nowrap px-2.5 py-1 bg-white dark:bg-[#1A1613] border border-kreato rounded-lg font-medium text-kreato-main flex items-center gap-1 shrink-0 cursor-pointer text-[11px]">
            <span>✍️ Roteiro 60s</span>
          </button>
          <button data-action="repurpose" class="ai-quick-btn whitespace-nowrap px-2.5 py-1 bg-white dark:bg-[#1A1613] border border-kreato rounded-lg font-medium text-kreato-main flex items-center gap-1 shrink-0 cursor-pointer text-[11px]">
            <span>🔄 Repurpose</span>
          </button>
          <button data-action="caption" class="ai-quick-btn whitespace-nowrap px-2.5 py-1 bg-white dark:bg-[#1A1613] border border-kreato rounded-lg font-medium text-kreato-main flex items-center gap-1 shrink-0 cursor-pointer text-[11px]">
            <span>📝 Legenda SEO</span>
          </button>
        </div>

        <!-- Messages Flow Container (Scrollable) -->
        <div id="ai-messages-container" class="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4">
          ${history
            .map(msg => renderMessageHtml(msg))
            .join('')}
          ${isGenerating ? renderTypingIndicator() : ''}
        </div>

        <!-- Message Input Box (Fixed/Anchored at the bottom) -->
        <div class="p-3 sm:p-4 border-t border-kreato bg-white dark:bg-[#141417] shrink-0 sticky bottom-0 z-20">
          <form id="ai-chat-form" class="flex flex-col gap-1.5">
            <div class="relative flex items-center">
              <textarea
                id="ai-user-input"
                rows="1"
                placeholder="Pergunte ao Krea: gere ganchos, roteiros ou ideias..."
                class="w-full pl-3.5 pr-14 py-2.5 text-xs bg-[#FAF7F2] dark:bg-[#0A0A0C] border border-kreato rounded-xl text-kreato-main resize-none focus:bg-white dark:focus:bg-[#141417] focus:outline-none transition-colors max-h-24 leading-normal"
              ></textarea>
              <button
                type="submit"
                id="ai-send-btn"
                class="absolute right-1.5 p-2 bg-kreato-orange hover:bg-kreato-orange-hover text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center shrink-0"
                title="Enviar mensagem"
                aria-label="Enviar mensagem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
            <div class="hidden sm:flex items-center justify-between text-[10px] text-kreato-muted px-1">
              <span>Pressione Enter para enviar</span>
              <span class="text-kreato-subtle font-semibold">Copiloto Krea</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Check if there was a pending prompt passed from Dashboard
  const pendingPrompt = sessionStorage.getItem('kreato_pending_ai_prompt');
  if (pendingPrompt) {
    sessionStorage.removeItem('kreato_pending_ai_prompt');
    const inputEl = container.querySelector('#ai-user-input') as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.value = pendingPrompt;
      sendMessage(pendingPrompt, container);
    }
  }

  // Scroll to bottom
  scrollToBottom(container);

  // Wire events
  const form = container.querySelector('#ai-chat-form') as HTMLFormElement;
  const input = container.querySelector('#ai-user-input') as HTMLTextAreaElement;

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text && !isGenerating) {
      input.value = '';
      input.style.height = 'auto';
      sendMessage(text, container);
    }
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  // Auto-resize textarea as user types
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  // Quick Action Buttons (both desktop sidebar and mobile top strip)
  container.querySelectorAll('.ai-quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = (e.currentTarget as HTMLElement).getAttribute('data-action');
      let promptText = '';
      if (action === 'ideas') promptText = 'Gere 5 ideias originais para meu próximo lote de criação';
      else if (action === 'script') promptText = 'Crie um roteiro estruturado de 60 segundos com gancho magnético';
      else if (action === 'hook') promptText = 'Sugira 3 ganchos magnéticos para reter a atenção nos primeiros 3 segundos';
      else if (action === 'repurpose') promptText = 'Como transformar um vídeo longo em 3 posts de texto e 1 carrossel?';
      else if (action === 'caption') promptText = 'Escreva uma legenda envolvente com gancho, história e CTA';

      if (promptText) {
        sendMessage(promptText, container);
      }
    });
  });

  // Clear history
  container.querySelector('#ai-clear-history-btn')?.addEventListener('click', () => {
    if (confirm('Deseja limpar todo o histórico do chat de IA?')) {
      storage.clearAiHistory();
      renderAi(container);
      showToast('Histórico reiniciado', 'info');
    }
  });

  container.querySelector('#ai-new-session-btn')?.addEventListener('click', () => {
    storage.clearAiHistory();
    renderAi(container);
    showToast('Nova sessão iniciada', 'info');
  });

  // Copy to clipboard & Convert to script or idea
  setupMessageActionHandlers(container);
}

function renderMessageHtml(msg: AiMessage): string {
  const isUser = msg.role === 'user';
  const timeStr = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return `
      <div class="flex items-start justify-end gap-2.5">
        <div class="max-w-[85%] sm:max-w-xl bg-kreato-orange text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs">
          <p class="text-xs leading-relaxed">${escapeHtml(msg.text)}</p>
          <div class="text-[10px] text-white/70 text-right mt-1 font-mono">${timeStr}</div>
        </div>
      </div>
    `;
  }

  // Assistant Message (Markdown-like formatting for lists, quotes, titles)
  const formattedBody = formatAiMarkdown(msg.text);

  return `
    <div class="flex items-start gap-2.5 sm:gap-3 ai-message-bubble" data-msg-id="${msg.id}">
      <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-kreato-purple text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5">
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div class="flex-1 max-w-[90%] sm:max-w-2xl bg-white dark:bg-[#1A1613] border border-kreato rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div class="text-xs leading-relaxed text-kreato-main space-y-2 prose-sm break-words">
          ${formattedBody}
        </div>

        <div class="pt-2 border-t border-kreato-subtle flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span class="text-kreato-subtle font-mono text-[10px] sm:text-[11px]">${timeStr}</span>

          <div class="flex items-center gap-1.5 sm:gap-2">
            <button type="button" class="ai-copy-btn px-2 py-1 text-kreato-muted hover:text-kreato-main rounded-md hover:bg-kreato-surface transition-colors cursor-pointer flex items-center gap-1 text-[11px]" data-text="${encodeURIComponent(msg.text)}">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span>Copiar</span>
            </button>
            <button type="button" class="ai-create-script-btn px-2.5 py-1 bg-[#EEF3FA] dark:bg-[#121B29] text-kreato-blue font-semibold rounded-md hover:bg-[#DEE8F5] transition-colors cursor-pointer flex items-center gap-1 text-[11px]" data-text="${encodeURIComponent(msg.text)}">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>Roteiro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTypingIndicator(): string {
  return `
    <div id="ai-typing-indicator" class="flex items-start gap-2.5 sm:gap-3">
      <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-kreato-purple text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      </div>
      <div class="bg-white dark:bg-[#1A1613] border border-kreato rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
        <div class="w-1.5 h-1.5 rounded-full bg-kreato-purple animate-bounce"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-kreato-purple animate-bounce [animation-delay:0.2s]"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-kreato-purple animate-bounce [animation-delay:0.4s]"></div>
        <span class="text-xs text-kreato-muted ml-2 font-medium">Krea está pensando...</span>
      </div>
    </div>
  `;
}

function formatAiMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-kreato-main">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-2 border-kreato-orange pl-3 py-1 bg-kreato-bg rounded-r-md italic text-kreato-main">$1</blockquote>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-bold text-kreato-main mt-2 mb-1 tracking-tight">$1</h4>');
  // Lists
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

  // Convert newlines to breaks
  return html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
}

async function sendMessage(prompt: string, container: HTMLElement) {
  isGenerating = true;
  storage.addAiMessage({ role: 'user', text: prompt });

  const messagesBox = container.querySelector('#ai-messages-container');
  if (messagesBox) {
    const userMsg: AiMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString()
    };
    messagesBox.insertAdjacentHTML('beforeend', renderMessageHtml(userMsg));
    messagesBox.insertAdjacentHTML('beforeend', renderTypingIndicator());
    scrollToBottom(container);
  }

  const profile = storage.getProfile();
  const history = storage.getAiHistory();

  try {
    // A rota da IA exige login: envia o token da sessão do Supabase
    const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const accessToken = sessionData.session?.access_token;

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({
        prompt,
        niche: profile.niche,
        tone: 'Autoral, direto e magnético',
        history: history.slice(-6).map(h => ({ role: h.role, text: h.text }))
      })
    });

    let answerText = '';

    if (res.ok) {
      const data = await res.json();
      answerText = data.text;
    } else if (res.status === 429) {
      let msg = 'Você enviou muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.';
      try { msg = (await res.json()).error || msg; } catch { /* mantém a mensagem padrão */ }
      answerText = msg;
    } else {
      const fallback = getSimulatedAiResponse(prompt);
      answerText = fallback.text;
    }

    isGenerating = false;
    container.querySelector('#ai-typing-indicator')?.remove();

    const savedMsg = storage.addAiMessage({
      role: 'assistant',
      text: answerText,
    });

    if (messagesBox) {
      messagesBox.insertAdjacentHTML('beforeend', renderMessageHtml(savedMsg));
      scrollToBottom(container);
      setupMessageActionHandlers(container);
    }
  } catch (err) {
    console.error('Error fetching AI chat:', err);
    isGenerating = false;
    container.querySelector('#ai-typing-indicator')?.remove();
    const fallback = getSimulatedAiResponse(prompt);
    const savedMsg = storage.addAiMessage({
      role: 'assistant',
      text: fallback.text,
      actionType: fallback.actionType
    });
    if (messagesBox) {
      messagesBox.insertAdjacentHTML('beforeend', renderMessageHtml(savedMsg));
      scrollToBottom(container);
      setupMessageActionHandlers(container);
    }
  }
}

function scrollToBottom(container: HTMLElement) {
  const messagesBox = container.querySelector('#ai-messages-container');
  if (messagesBox) {
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

function setupMessageActionHandlers(container: HTMLElement) {
  container.querySelectorAll('.ai-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const encoded = (e.currentTarget as HTMLElement).getAttribute('data-text');
      if (encoded) {
        const text = decodeURIComponent(encoded);
        navigator.clipboard.writeText(text);
        showToast('Texto copiado para a área de transferência!', 'success');
      }
    });
  });

  container.querySelectorAll('.ai-create-script-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const encoded = (e.currentTarget as HTMLElement).getAttribute('data-text');
      if (encoded) {
        const text = decodeURIComponent(encoded);
        openScriptModal({
          id: '',
          title: 'Roteiro gerado pelo Krea',
          platform: 'Instagram',
          format: 'Vídeo Curto (60s)',
          hook: text.slice(0, 120) + '...',
          body: text,
          cta: 'Comente abaixo o que você achou!',
          notes: 'Gerado via sessão do Copiloto Krea.',
          status: 'Rascunho',
          wordCount: 0,
          readingTimeMinutes: 1,
          updatedAt: new Date().toISOString()
        });
      }
    });
  });
}
