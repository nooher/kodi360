import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLang, t } from '../lib/i18n';
import { isConfigured } from '../lib/supabase';

export default function OfficerLogin() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/officer" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imeshindwa kuingia');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-tz-black/10 bg-white p-8">
        <div className="h-12 w-12 rounded-xl bg-tz-black flex items-center justify-center text-white mx-auto mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-tz-black text-center mb-1">
          {t(lang, { sw: 'Kuingia kwa Afisa wa TRA', en: 'TRA Officer Login' })}
        </h1>
        <p className="text-sm text-tz-black/50 text-center mb-6">
          {t(lang, { sw: 'Dashibodi ya ndani — si kwa umma', en: 'Internal dashboard — not for the public' })}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="afisa@tra.go.tz"
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(lang, { sw: 'Nenosiri', en: 'Password' })}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-tz-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t(lang, { sw: 'Ingia', en: 'Sign in' })}
          </button>
        </form>

        {!isConfigured() && (
          <>
            <div className="my-4 flex items-center gap-2 text-xs text-tz-black/40">
              <div className="h-px flex-1 bg-tz-black/10" />
              {t(lang, { sw: 'au', en: 'or' })}
              <div className="h-px flex-1 bg-tz-black/10" />
            </div>
            <button
              onClick={loginDemo}
              className="w-full rounded-xl border border-tz-black/15 px-4 py-2.5 text-sm font-semibold text-tz-black hover:bg-tz-black/5"
            >
              {t(lang, { sw: 'Ingia Demo (bila mtandao)', en: 'Enter Demo Mode (offline)' })}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
