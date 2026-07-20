import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useLang, t } from '../lib/i18n';

export default function InstallButton({ compact = false }: { compact?: boolean }) {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const { lang } = useLang();
  const [showHelp, setShowHelp] = useState(false);

  if (isInstalled) return null;

  async function handleClick() {
    if (canInstall) {
      await promptInstall();
    } else {
      setShowHelp(true);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => void handleClick()}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-tz-black/15 px-3 py-1.5 text-sm font-medium text-tz-black/80 hover:bg-tz-black/5'
            : 'inline-flex items-center gap-2 rounded-xl bg-tz-black px-5 py-3 font-semibold text-white hover:bg-tz-black/85 transition-colors'
        }
      >
        <Download className={compact ? 'h-4 w-4' : 'h-4.5 w-4.5'} />
        {t(lang, { sw: 'Sakinisha App', en: 'Install App' })}
      </button>

      {showHelp && (
        <div className="absolute z-50 mt-2 right-0 w-72 rounded-xl border border-tz-black/10 bg-white p-4 shadow-lg text-sm">
          <div className="flex items-start justify-between mb-2">
            <p className="font-semibold text-tz-black">{t(lang, { sw: 'Jinsi ya Kusakinisha', en: 'How to Install' })}</p>
            <button onClick={() => setShowHelp(false)} className="text-tz-black/40 hover:text-tz-black">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-tz-black/70 leading-relaxed">
            {t(lang, {
              sw: 'Fungua menyu ya kivinjari chako (⋮ au ⇧) kisha chagua "Ongeza kwenye Skrini ya Nyumbani" au "Sakinisha App". Kwenye iPhone: bofya kitufe cha Shea (Share) kisha "Add to Home Screen".',
              en: 'Open your browser\'s menu (⋮ or share icon) and choose "Add to Home Screen" or "Install App". On iPhone: tap the Share button, then "Add to Home Screen".',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
