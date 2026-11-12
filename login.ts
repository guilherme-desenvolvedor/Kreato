import { navigateTo } from '../modules/router';
import { storage } from '../services/storage';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabase';
import { showToast } from '../utils/toast';

let isRegisterMode = false;

export function renderLogin(container: HTMLElement) {
  const currentTheme = storage.getTheme();
  const isDark = currentTheme === 'dark';

  container.innerHTML = `
    <div class="min-h-screen bg-kreato-bg text-kreato-main flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-orange-200 selection:text-orange-950">
      <!-- Top Bar: Back to Home + Theme Toggle -->
      <div class="absolute top-6 left-6 right-6 max-w-5xl mx-auto flex items-center justify-between">
        <a href="#landing" class="text-xs font-semibold text-kreato-muted hover:text-kreato-main flex items-center gap-1.5 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          <span>Voltar para Início</span>
        </a>

        <button id="auth-theme-toggle" type="button" class="p-2 rounded-xl text-kreato-muted hover:text-kreato-main hover:bg-kreato-surface transition-colors cursor-pointer" title="Alternar Modo Escuro / Claro">
          ${isDark
            ? `<svg class="w-4 h-4 text-kreato-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
            : `<svg class="w-4 h-4 text-kreato-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`
          }
        </button>
      </div>

      <!-- Auth Container Box -->
      <div class="w-full max-w-md kreato-card p-6 sm:p-8 shadow-xl border border-kreato space-y-6 my-12 animate-in fade-in zoom-in-95 duration-150">
        <!-- Logo and Heading -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Logo Kreato" class="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md hover:scale-105 transition-transform duration-200" />
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-kreato-main tracking-tight">
            ${isRegisterMode ? 'Crie sua conta no Kreato' : 'Bem-vindo de volta'}
          </h1>
          <p class="text-xs text-kreato-muted">
            ${isRegisterMode
              ? 'Organize seu fluxo criativo e produza com o copiloto Krea'
              : 'Acesse seu ambiente pessoal de criação e roteirização'
            }
          </p>
        </div>

        <!-- Form -->
        <form id="auth-main-form" class="space-y-4">
          ${isRegisterMode ? `
            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Seu Nome Completo *</label>
              <input type="text" id="auth-name" required placeholder="Marina Silva" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1613] border border-kreato rounded-xl text-kreato-main focus:bg-white" />
            </div>

            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Nicho de Conteúdo *</label>
              <input type="text" id="auth-niche" required placeholder="Ex: Tecnologia & Storytelling" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1613] border border-kreato rounded-xl text-kreato-main focus:bg-white" />
            </div>
          ` : ''}

          <div>
            <label class="block text-xs font-bold text-kreato-main mb-1">E-mail *</label>
            <input type="email" id="auth-email" required placeholder="seu@email.com" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-bold text-kreato-main">Senha *</label>
              ${!isRegisterMode ? `<a href="#login" id="auth-forgot-btn" class="text-[11px] text-kreato-orange hover:underline font-semibold">Esqueceu?</a>` : ''}
            </div>
            <input type="password" id="auth-password" required minlength="6" placeholder="Mínimo 6 caracteres" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
          </div>

          ${isRegisterMode ? `
            <div>
              <label class="block text-xs font-bold text-kreato-main mb-1">Confirmar Senha *</label>
              <input type="password" id="auth-password-confirm" required minlength="6" placeholder="Repita sua senha" class="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#141417] border border-kreato rounded-xl text-kreato-main focus:bg-white dark:focus:bg-[#141417]" />
            </div>
          ` : ''}

          ${!isRegisterMode ? `
            <div class="flex items-center justify-between text-xs">
              <label class="flex items-center gap-2 cursor-pointer text-kreato-muted">
                <input type="checkbox" checked class="w-3.5 h-3.5 rounded text-kreato-orange border-kreato cursor-pointer" />
                <span>Lembrar de mim</span>
              </label>
            </div>
          ` : ''}

          <button type="submit" class="w-full py-2.5 bg-kreato-orange hover:bg-kreato-orange-hover text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer">
            ${isRegisterMode ? 'Finalizar Cadastro e Acessar' : 'Entrar no Estúdio'}
          </button>
        </form>

        <!-- Switch between Login and Register -->
        <div class="text-center pt-2 text-xs text-kreato-muted">
          ${isRegisterMode
            ? `Já possui uma conta? <button id="auth-toggle-mode" type="button" class="text-kreato-orange font-bold hover:underline cursor-pointer">Fazer Login</button>`
            : `Ainda não tem conta? <button id="auth-toggle-mode" type="button" class="text-kreato-orange font-bold hover:underline cursor-pointer">Criar Conta Gratuita</button>`
          }
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#auth-main-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = container.querySelector('#auth-email') as HTMLInputElement;
    const passwordInput = container.querySelector('#auth-password') as HTMLInputElement;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showToast('Preencha e-mail e senha.', 'warning');
      return;
    }

    if (!isSupabaseConfigured) {
      showToast('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.', 'error', 5000);
      return;
    }

    if (isRegisterMode) {
      const confirmInput = container.querySelector('#auth-password-confirm') as HTMLInputElement;
      if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
      }
      if (confirmInput && password !== confirmInput.value) {
        showToast('As senhas não coincidem.', 'warning');
        return;
      }
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isRegisterMode ? 'Criando conta...' : 'Entrando...';

    try {
      if (isRegisterMode) {
        const nameInput = container.querySelector('#auth-name') as HTMLInputElement;
        const nicheInput = container.querySelector('#auth-niche') as HTMLInputElement;
        const name = nameInput?.value.trim() || email.split('@')[0];

        const res = await authService.signUp(name, email, password);
        if (res.error) {
          showToast(res.error, 'error');
          return;
        }
        if (res.needsEmailConfirmation) {
          showToast('Conta criada! Verifique seu e-mail para confirmar o cadastro.', 'info', 5000);
          isRegisterMode = false;
          renderLogin(container);
          return;
        }
        // Carrega (e, se preciso, cria) o perfil no banco antes de personalizá-lo
        if (res.user) await storage.startSession(res.user);
        storage.updateProfile({
          name,
          niche: nicheInput?.value.trim() || 'Criador Digital',
        });
        showToast('Conta criada com sucesso!', 'success');
        navigateTo('dashboard');
      } else {
        const res = await authService.signIn(email, password);
        if (res.error) {
          showToast(res.error, 'error');
          return;
        }
        // Carrega do banco as ideias, roteiros, publicações etc. deste usuário
        if (res.user) await storage.startSession(res.user);
        showToast('Acesso concedido com sucesso!', 'success');
        navigateTo('dashboard');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  container.querySelector('#auth-toggle-mode')?.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    renderLogin(container);
  });

  container.querySelector('#auth-forgot-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Link de recuperação enviado para seu e-mail de cadastro.', 'info');
  });

  container.querySelector('#auth-theme-toggle')?.addEventListener('click', () => {
    storage.toggleTheme();
    renderLogin(container);
  });
}
