// OfficerErrorLog.tsx — surfaces the client-side error ring buffer
// (src/lib/error-tracking.ts) in the officer dashboard. The data was already
// being collected; this makes it actually visible instead of dead code.

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { getErrors, getErrorStats, clearErrors, type ErrorEntry } from '../lib/error-tracking';
import { useLang, t } from '../lib/i18n';
import { errorTypeLabel } from '../lib/statusLabels';

export default function OfficerErrorLog() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorEntry[]>(() => getErrors());
  const stats = getErrorStats();

  function refresh() {
    setErrors(getErrors());
  }

  function clear() {
    clearErrors();
    setErrors([]);
  }

  return (
    <div className="mb-6 rounded-xl border border-tz-black/10 bg-white">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-tz-black"
      >
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${stats.last24h > 0 ? 'text-tz-gold' : 'text-tz-black/30'}`} />
          {t(lang, { sw: 'Kumbukumbu za makosa (client)', en: 'Client error log' })}
          <span className="text-xs font-normal text-tz-black/40">
            {stats.total} {t(lang, { sw: 'jumla', en: 'total' })} · {stats.last24h} {t(lang, { sw: 'saa 24 zilizopita', en: 'last 24h' })}
          </span>
        </span>
        <span className="text-tz-black/40 text-xs">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-tz-black/5 pt-3">
          {errors.length === 0 ? (
            <p className="text-xs text-tz-black/40">{t(lang, { sw: 'Hakuna makosa yaliyorekodiwa.', en: 'No errors recorded.' })}</p>
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto space-y-2 mb-3">
                {errors.slice().reverse().map((e) => (
                  <div key={e.id} className="rounded-lg bg-paper px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-tz-black/50">{new Date(e.timestamp).toLocaleString()}</span>
                      <span className="rounded-full bg-tz-black/5 px-2 py-0.5 text-[10px] uppercase">{errorTypeLabel(lang, e.type)}</span>
                    </div>
                    <p className="mt-1 text-tz-black/80 break-words">{e.message}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={clear}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t(lang, { sw: 'Futa kumbukumbu', en: 'Clear log' })}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
