import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Em desenvolvimento lê .env.local e .env; em produção as variáveis vêm do painel da hospedagem.
dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Cabeçalhos básicos de segurança
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Verificação de saúde para a hospedagem (Render, Railway, Cloud Run etc.)
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Initialize Google Gemini Client on server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// Proteção da rota de IA: só usuários logados no Supabase, com limite de uso
// (sem isso, qualquer pessoa poderia gastar a cota da sua chave do Gemini)
// -------------------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

const TOKEN_CACHE_MS = 60_000;
const tokenCache = new Map<string, { userId: string; expires: number }>();

const RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateHits = new Map<string, number[]>();

async function verifySupabaseToken(token: string): Promise<string | null> {
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.userId;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY as string },
  });
  if (!r.ok) return null;
  const user = (await r.json()) as { id?: string };
  if (!user?.id) return null;

  if (tokenCache.size > 1000) tokenCache.clear();
  tokenCache.set(token, { userId: user.id, expires: Date.now() + TOKEN_CACHE_MS });
  return user.id;
}

async function requireUser(req: Request, res: Response, next: () => void) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no servidor para proteger /api/ai/chat.');
    return res.status(503).json({ success: false, error: 'Servidor sem configuração de autenticação.' });
  }

  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ success: false, error: 'Faça login para usar a Krea.' });
  }

  try {
    const userId = await verifySupabaseToken(token);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada. Entre novamente.' });
    }

    // Limite de uso por usuário (janela deslizante de 1 minuto)
    const now = Date.now();
    const hits = (rateHits.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (hits.length >= RATE_LIMIT_MAX) {
      rateHits.set(userId, hits);
      return res.status(429).json({
        success: false,
        error: 'Você enviou muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.',
      });
    }
    hits.push(now);
    rateHits.set(userId, hits);
    if (rateHits.size > 5000) rateHits.clear();

    next();
  } catch (err) {
    console.error('Falha ao validar sessão no Supabase:', err);
    return res.status(503).json({ success: false, error: 'Não foi possível validar sua sessão agora.' });
  }
}

/** Texto curto e sem quebras de linha (evita injetar instruções no prompt de sistema). */
function cleanShort(value: unknown, fallback: string, max = 200): string {
  if (typeof value !== 'string') return fallback;
  const v = value.replace(/\s+/g, ' ').trim().slice(0, max);
  return v || fallback;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// -------------------------------------------------------------
// Real Gemini AI Chat Endpoint
// -------------------------------------------------------------
app.post('/api/ai/chat', requireUser, async (req: Request, res: Response) => {
  const body = req.body || {};
  const prompt: unknown = body.prompt;
  const niche = cleanShort(body.niche, 'Criação de Conteúdo & Design');
  const tone = cleanShort(body.tone, 'Autoral, direto e magnético');
  const history: unknown = body.history;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt é obrigatório.' });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ success: false, error: 'A mensagem é longa demais (máximo de 4.000 caracteres).' });
  }

  // System instruction specifically tuned for high-retention creator workflows
  const systemInstruction = `Você é o Krea, o copiloto criativo de inteligência artificial do Kreato — uma plataforma SaaS premium para criadores de conteúdo organizarem ideias, desenvolverem roteiros e planejarem publicações.

DIRETRIZES FUNDAMENTAIS:
1. Seu tom deve ser: ${tone}.
2. Nicho de atuação do criador: ${niche}.
3. Evite qualquer clichê ou respostas genéricas de IA (como "Claro! Vamos lá", "Hoje em dia o digital...").
4. Vá direto ao ponto, com estrutura visual impecável: títulos em Markdown, ganchos em bloco de citação (>), listas numeradas e dicas de direção de câmera/gravação quando relevante.
5. Se o criador pedir ganchos: forneça 3 opções diferentes (Quebra de crença, Curiosidade visual, Contraste de resultado).
6. Se pedir roteiro: divida em Gancho (00:00-00:03), Desenvolvimento (00:04-00:45) e Chamada para Ação (CTA).
7. Sempre termine com uma dica curta e prática de gravação ou repurposing.`;

  // Check if API key is provided for real generation
  const activeKey = process.env.GEMINI_API_KEY;
  if (!activeKey || activeKey === 'MY_GEMINI_API_KEY') {
    // Graceful offline simulated response if key not yet injected
    return res.json({
      success: true,
      text: getFallbackCreativeResponse(prompt, niche),
      source: 'simulated_fallback',
      notice: 'Para respostas dinâmicas ilimitadas com o modelo Gemini, configure sua GEMINI_API_KEY no painel de segredos.'
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format contents with context
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6); // last 6 turns
      for (const msg of recentHistory) {
        if (!msg || typeof msg.text !== 'string' || !msg.text.trim()) continue;
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.slice(0, 4000) }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text || 'Não foi possível gerar uma resposta no momento.';

    return res.json({
      success: true,
      text,
      source: GEMINI_MODEL,
    });
  } catch (error: any) {
    console.error(`Gemini API Error (modelo ${GEMINI_MODEL}):`, error?.message || error);
    // Return graceful fallback with notification
    return res.json({
      success: true,
      text: getFallbackCreativeResponse(prompt, niche),
      source: 'simulated_fallback',
      warning: `Gemini API temporariamente indisponível: ${error?.message || 'erro interno'}. Usando resposta local autoral.`
    });
  }
});

function getFallbackCreativeResponse(prompt: string, niche: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('gancho') || p.includes('hook') || p.includes('abertura')) {
    return `Aqui estão **3 opções de ganchos de alta retenção** para testar no seu nicho (${niche}):

### 1. Quebra de Crença Comum (Curiosidade Rápida)
> *"Todo mundo diz que você precisa postar todo santo dia para crescer no digital, mas a verdade é que isso só garante burnout. Aqui está o método de 3 posts intencionais que dobrou meu alcance..."*
- **Por que funciona:** Ataca uma dor latente da audiência logo no segundo 1.5.

### 2. O Gancho de Contraste Visual + Verbal
> *"Eu passei 30 dias testando duas formas completamente diferentes de roteirizar vídeos. Um formato flopou com 800 views; o outro bateu 140 mil. O segredo está nessa frase aqui..."*
- **Dica de filmagem:** Faça um corte seco aproximando a câmera na frase final do gancho.

### 3. Pergunta Inesperada com Resposta Imediata
> *"Qual foi a última vez que você salvou um post e realmente voltou para ler? Se a resposta foi nunca, seus seguidores fazem o mesmo com você. Vamos mudar isso agora."*

💡 *Dica do Krea:* Você pode transformar qualquer um desses ganchos diretamente em um roteiro no estúdio!`;
  }

  if (p.includes('roteiro') || p.includes('script') || p.includes('estruturar')) {
    return `Estruturei um roteiro completo de **60 segundos** focado em alta retenção e autoridade:

### 🎬 TÍTULO: O erro invisível ao começar no nicho de ${niche}

**1. O Gancho (00:00 - 00:04):**
*"O maior erro que cometi quando comecei a criar conteúdo não foi equipamento ruim nem falta de consistência. Foi tentar agradar todo mundo."*

**2. O Desenvolvimento (00:04 - 00:45):**
*"Quando você fala com todo mundo, você não conecta de verdade com ninguém.
Em vez de falar de temas genéricos, comece a falar exatamente para quem vive a sua dor diária.
Quanto mais específico o problema, mais valiosa a solução que você entrega.
Audiência de nicho não apenas assiste: ela confia, salva e compra."*

**3. Chamada para Ação (00:45 - 00:60):**
*"Comente a palavra 'ESTUDIO' aqui nos comentários se você quer que eu te envie o checklist completo de roteiro!"*

📌 **Notas de Gravação:** Grave com luz natural lateral e corte seco a cada 4 segundos para manter o ritmo visual dinâmico.`;
  }

  return `Analisei sua solicitação com foco em criatividade e consistência no nicho de **${niche}**:

1. **Ângulo de Autoridade:** Conte um bastidor real onde um erro técnico te ensinou uma lição que economizou tempo ou dinheiro.
2. **Formato Ideal:** Roteiro curto (Reels/TikTok) com legenda estendida no carrossel.
3. **CTA Estratégico:** Peça para a audiência salvar o post para consultar durante a próxima sessão de planejamento.

Você pode salvar essa ideia diretamente no seu painel ou expandir em um roteiro estruturado!`;
}

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  // Produção = NODE_ENV=production OU rodando o build (node server.js). Em dev (tsx server.ts) usa o Vite.
  const isProduction = process.env.NODE_ENV === 'production' || !(process.argv[1] || '').endsWith('.ts');

  // Qualquer /api/* desconhecida responde 404 em JSON (nunca devolve o index.html)
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada.' });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          // Arquivos com hash no nome (assets/) podem ficar em cache por 1 ano;
          // o HTML e o service worker precisam ser sempre revalidados.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    // SPA: qualquer outra rota devolve o index.html
    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Kreator rodando na porta ${PORT} (${isProduction ? 'produção' : 'desenvolvimento'})`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
