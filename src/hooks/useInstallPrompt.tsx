// useInstallPrompt.tsx — captures the browser's native PWA install prompt
// (beforeinstallprompt) so the app can offer a real "Install" action instead
// of just telling users it's possible. Browsers that never fire that event
// (iOS Safari, in particular) fall back to `supportsNativePrompt: false`, so
// the UI can show manual "Add to Home Screen" instructions instead.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptContextType {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

const InstallPromptContext = createContext<InstallPromptContextType>({
  canInstall: false,
  isInstalled: false,
  promptInstall: async () => 'unavailable',
});

export function useInstallPrompt() {
  return useContext(InstallPromptContext);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone());

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setIsInstalled(true);
      setDeferred(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }

  return (
    <InstallPromptContext.Provider value={{ canInstall: !!deferred && !isInstalled, isInstalled, promptInstall }}>
      {children}
    </InstallPromptContext.Provider>
  );
}
