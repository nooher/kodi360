import { LogOut, UserCircle } from 'lucide-react';
import { useTraderAuth } from '../hooks/useTraderAuth';
import { useLang, t } from '../lib/i18n';
import { activityLabel } from '../lib/statusLabels';

export default function TraderHeader() {
  const { trader, logout } = useTraderAuth();
  const { lang } = useLang();

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-tz-black/10 bg-white px-4 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-tz-black">
        <UserCircle className="h-4 w-4 text-tz-green-dark" />
        {trader?.name}
        <span className="text-xs font-normal text-tz-black/40">
          {trader?.idType.toUpperCase()} · {trader?.activity ? activityLabel(lang, trader.activity) : ''}
        </span>
      </span>
      <button
        onClick={() => void logout()}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-tz-black/60 hover:text-tz-black"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t(lang, { sw: 'Toka', en: 'Log out' })}
      </button>
    </div>
  );
}
