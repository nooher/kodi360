import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { IdCard, Lock, UserPlus } from 'lucide-react';
import { useTraderAuth } from '../hooks/useTraderAuth';
import { useLang, t } from '../lib/i18n';
import { traderLoginSchema, fieldErrors } from '../lib/validation';
import type { TraderIdType } from '../types';

export default function TraderLogin() {
  const { login, isAuthenticated } = useTraderAuth();
  const { lang } = useLang();
  const location = useLocation();

  const [idType, setIdType] = useState<TraderIdType>('nida');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/rasimisha';
    return <Navigate to={from} replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const parsed = traderLoginSchema.safeParse({ idType, idNumber, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await login(parsed.data.idType, parsed.data.idNumber, parsed.data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imeshindwa kuingia');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-tz-black/10 bg-white p-8">
        <div className="h-12 w-12 rounded-xl bg-tz-green flex items-center justify-center text-white mx-auto mb-4">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-tz-black text-center mb-1">
          {t(lang, { sw: 'Kuingia — Mfanyabiashara', en: 'Trader Login' })}
        </h1>
        <p className="text-sm text-tz-black/50 text-center mb-6">
          {t(lang, { sw: 'Ingia kwa NIDA au TIN ulizosajili nazo', en: 'Sign in with the NIDA or TIN you registered with' })}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            {(['nida', 'tin'] as TraderIdType[]).map((it) => (
              <button
                type="button"
                key={it}
                onClick={() => setIdType(it)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  idType === it ? 'border-tz-green bg-tz-green/10 text-tz-green-dark' : 'border-tz-black/15 text-tz-black/60'
                }`}
              >
                {it.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tz-black/30" />
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              placeholder={idType === 'nida' ? t(lang, { sw: 'Namba ya NIDA', en: 'NIDA number' }) : t(lang, { sw: 'Namba ya TIN', en: 'TIN number' })}
              className="w-full rounded-lg border border-tz-black/15 pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          {errors.idNumber && <p className="text-xs text-red-600">{errors.idNumber}</p>}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tz-black/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t(lang, { sw: 'Nenosiri', en: 'Password' })}
              className="w-full rounded-lg border border-tz-black/15 pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-tz-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? t(lang, { sw: 'Inaingia…', en: 'Signing in…' }) : t(lang, { sw: 'Ingia', en: 'Sign in' })}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-tz-black/60">
          {t(lang, { sw: 'Huna akaunti bado?', en: "Don't have an account yet?" })}{' '}
          <Link to="/rasimisha" className="text-tz-green-dark font-semibold hover:underline">
            {t(lang, { sw: 'Jisajili', en: 'Register' })}
          </Link>
        </p>
      </div>
    </div>
  );
}
