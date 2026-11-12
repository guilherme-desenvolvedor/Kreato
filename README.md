# Kreator — Estúdio Criativo para Criadores

Plataforma para criadores organizarem ideias, roteiros, planejamento editorial e biblioteca,
com o copiloto de IA **Krea**.

## Banco de dados (Supabase)

Autenticação e dados (perfil, ideias, roteiros, publicações, biblioteca e histórico da Krea)
ficam no **Supabase**. Cada usuário só acessa as próprias linhas (Row Level Security).

### 1. Criar as tabelas (uma vez só)

1. Abra o painel do Supabase > **SQL Editor** > **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   O script pode ser executado novamente sem problemas.

### 2. Variáveis de ambiente

Crie o arquivo `.env.local` na raiz (veja `.env.example`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Use somente a chave **publicável** (anon). Nunca coloque a chave secreta (`sb_secret_...` / `service_role`)
no front-end. Em produção (Netlify, Vercel etc.), cadastre as mesmas variáveis no painel da hospedagem.

> Este projeto usa Vite, então as variáveis começam com `VITE_` (e não `NEXT_PUBLIC_`),
> e o cliente é o `@supabase/supabase-js` (não é preciso o `@supabase/ssr`).

### 3. Confirmação de e-mail

Em **Authentication > Providers > Email**, o Supabase vem com "Confirm email" ligado: quem se cadastra
precisa confirmar o e-mail antes de entrar. Para testes rápidos você pode desligar essa opção.
Em **Authentication > URL Configuration**, ajuste *Site URL* e *Redirect URLs* para o endereço do site publicado.

## Como a camada de dados funciona

- `src/services/supabase.ts` — cliente Supabase.
- `src/services/authService.ts` — cadastro, login e logout.
- `src/services/storage.ts` — ao logar, carrega os dados do banco para um cache em memória; as telas
  leem do cache e toda alteração é gravada no banco em segundo plano (em fila). Se a gravação falhar,
  o usuário é avisado e os dados são recarregados do banco.
- O tema claro/escuro continua no `localStorage` (preferência do aparelho).

## Hospedar (produção)

O Kreator é um app **Node** (Express serve o site e a rota da IA `/api/ai/chat`), então precisa de uma
hospedagem que rode Node ou Docker — por exemplo **Render**, Railway, Fly.io ou Google Cloud Run.
Hospedagem somente estática (Netlify, GitHub Pages) não roda a Krea.

### Variáveis de ambiente (no painel da hospedagem)

| Variável | Para quê |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (também é lida pelo servidor para validar o login) |
| `VITE_SUPABASE_ANON_KEY` | chave **publicável** do Supabase |
| `GEMINI_API_KEY` | chave do Gemini — fica só no servidor. Sem ela, a Krea responde com textos de exemplo |
| `GEMINI_MODEL` | opcional, padrão `gemini-3.8-flash` |
| `AI_RATE_LIMIT_PER_MINUTE` | opcional, mensagens por minuto por usuário (padrão 20) |

> As variáveis `VITE_*` são embutidas no site **na hora do build**: se mudar, faça um novo deploy.

### Render (mais simples)

1. Suba o projeto para um repositório no GitHub (o `.env.local` não vai: está no `.gitignore`).
2. No Render: **New > Blueprint**, escolha o repositório (usa o `render.yaml`) e preencha as variáveis acima.
3. Ao terminar, abra a URL gerada. A verificação de saúde é `/healthz`.

Comandos equivalentes: build `npm ci --include=dev && npm run build`, start `npm start`.

### Docker (Railway, Fly.io, Cloud Run…)

```
docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... -t kreator .
docker run -p 3000:3000 -e VITE_SUPABASE_URL=... -e VITE_SUPABASE_ANON_KEY=... -e GEMINI_API_KEY=... kreator
```

### Depois do deploy: configurar o Supabase

Em **Authentication > URL Configuration**: defina *Site URL* com o endereço do site e adicione-o em *Redirect URLs*.
Sem isso, os links de confirmação de e-mail apontam para o lugar errado.

### Sugestões & Roadmap

As sugestões ficam no Supabase (`suggestions` e `suggestion_votes`). Cada usuário vota uma vez por sugestão.
Para mudar o status de uma sugestão (Em análise → Planejado → Em desenvolvimento → Concluído), edite a coluna
`status` no **Table Editor** do Supabase.

## Rodar localmente

**Pré-requisito:** Node.js 20+

1. `npm install`
2. Configure `GEMINI_API_KEY` e as variáveis do Supabase no `.env.local`
3. `npm run dev`
