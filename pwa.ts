// PWA Service & Install Prompts Manager

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;
let isIOS = false;

// Check initial status
if (typeof window !== 'undefined') {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  isInstalled = isStandalone;

  const userAgent = window.navigator.userAgent.toLowerCase();
  isIOS = /iphone|ipad|ipod/.test(userAgent);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('kreato:pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('kreato:pwa-installed'));
  });
}

export const pwaService = {
  isInstallable: () => !!deferredPrompt,
  isInstalled: () => isInstalled,
  isIOS: () => isIOS,

  async promptInstall(): Promise<boolean> {
    if (!deferredPrompt) {
      return false;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      isInstalled = true;
      deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('kreato:pwa-installed'));
      return true;
    }
    return false;
  },

  showIOSInstructions() {
    import('../utils/modal').then(({ openModal }) => {
      openModal({
        title: 'Instalar Kreato no iPhone / iPad',
        contentHtml: `
          <div class="space-y-4 text-xs text-kreato-muted">
            <div class="p-3 bg-kreato-bg border border-kreato rounded-xl space-y-2">
              <div class="flex items-center gap-2 font-bold text-kreato-main">
                <span class="w-6 h-6 rounded-full bg-kreato-orange text-white flex items-center justify-center text-xs">1</span>
                <span>Toque no botão de Compartilhar</span>
              </div>
              <p class="pl-8 text-kreato-muted">No Safari, toque no ícone de compartilhamento (o quadrado com uma seta apontando para cima) na barra inferior.</p>
            </div>

            <div class="p-3 bg-kreato-bg border border-kreato rounded-xl space-y-2">
              <div class="flex items-center gap-2 font-bold text-kreato-main">
                <span class="w-6 h-6 rounded-full bg-kreato-orange text-white flex items-center justify-center text-xs">2</span>
                <span>Role para baixo e selecione</span>
              </div>
              <p class="pl-8 text-kreato-muted">Toque em <strong>"Adicionar à Tela de Início"</strong> (Add to Home Screen).</p>
            </div>

            <div class="p-3 bg-kreato-bg border border-kreato rounded-xl space-y-2">
              <div class="flex items-center gap-2 font-bold text-kreato-main">
                <span class="w-6 h-6 rounded-full bg-kreato-orange text-white flex items-center justify-center text-xs">3</span>
                <span>Pronto! Acesso em 1 toque</span>
              </div>
              <p class="pl-8 text-kreato-muted">O ícone do Kreato aparecerá junto aos seus aplicativos como um app nativo, sem barras de navegação do navegador.</p>
            </div>
          </div>
        `,
        hideFooter: true,
      });
    });
  }
};
