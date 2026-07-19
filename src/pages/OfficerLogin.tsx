import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLang, t } from '../lib/i18n';
import { isConfigured } from '../lib/supabase';

export default function OfficerLogin() {
  const { login, loginDemo, isAuthenticated, mfaPending, verifyMfaChallenge } = useAuth();
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyMfaChallenge(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Msimbo si sahihi');
    } finally {
      setBusy(false);
    }
  }

  if (mfaPending) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-tz-black/10 bg-white p-8">
          <div className="h-12 w-12 rounded-xl bg-tz-green flex items-center justify-center text-white mx-auto mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-tz-black text-center mb-1">
            {t(lang, { sw: 'Uthibitisho wa Hatua ya Pili (2FA)', en: 'Two-Factor Verification' })}
          </h1>
          <p className="text-sm text-tz-black/50 text-center mb-6">
            {t(lang, {
              sw: 'Ingiza msimbo wa tarakimu 6 kutoka programu yako ya uthibitisho (Authenticator).',
              en: 'Enter the 6-digit code from your authenticator app.',
            })}
          </p>
          <form onSubmit={submitMfa} className="space-y-3">
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-center text-lg tracking-[0.4em] font-mono"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full rounded-xl bg-tz-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t(lang, { sw: 'Thibitisha', en: 'Verify' })}
            </button>
          </form>
        </div>
      </div>
    );
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
