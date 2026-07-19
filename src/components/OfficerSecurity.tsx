// OfficerSecurity.tsx — inline 2FA (TOTP) enrollment panel for the officer
// dashboard. Supabase Auth MFA: enroll -> scan QR -> confirm with a 6-digit
// code -> factor becomes 'verified' and is required on every future login.

import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth, type MfaEnrollment } from '../hooks/useAuth';
import { useLang, t } from '../lib/i18n';
import { isConfigured } from '../lib/supabase';

export default function OfficerSecurity() {
  const { isDemoMode, enrollMfa, confirmMfaEnrollment, unenrollMfa, listMfaFactors } = useAuth();
  const { lang } = useLang();
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDemoMode || !isConfigured()) return;
    listMfaFactors().then(setFactors);
  }, [isDemoMode, listMfaFactors]);

  const verifiedFactor = factors.find((f) => f.status === 'verified');

  async function startEnroll() {
    setError('');
    setBusy(true);
    try {
      const e = await enrollMfa();
      setEnrollment(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setError('');
    setBusy(true);
    try {
      await confirmMfaEnrollment(enrollment.factorId, code);
      setEnrollment(null);
      setCode('');
      setFactors(await listMfaFactors());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(factorId: string) {
    setBusy(true);
    setError('');
    try {
      await unenrollMfa(factorId);
      setFactors(await listMfaFactors());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (isDemoMode || !isConfigured()) return null;

  return (
    <div className="mb-6 rounded-xl border border-tz-black/10 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-tz-black"
      >
        <span className="inline-flex items-center gap-2">
          {verifiedFactor ? (
            <ShieldCheck className="h-4 w-4 text-tz-green-dark" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-tz-gold" />
          )}
          {t(lang, { sw: 'Usalama wa akaunti (2FA)', en: 'Account security (2FA)' })}
          <span className={`text-xs font-normal ${verifiedFactor ? 'text-tz-green-dark' : 'text-tz-black/40'}`}>
            {verifiedFactor
              ? t(lang, { sw: 'imewashwa', en: 'enabled' })
              : t(lang, { sw: 'haijawashwa', en: 'not enabled' })}
          </span>
        </span>
        <span className="text-tz-black/40 text-xs">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-tz-black/5 pt-3">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          {verifiedFactor && !enrollment && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-tz-black/60">
                {t(lang, {
                  sw: 'Uthibitisho wa hatua mbili umewashwa kwa akaunti hii.',
                  en: 'Two-factor authentication is enabled for this account.',
                })}
              </p>
              <button
                onClick={() => void remove(verifiedFactor.id)}
                disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t(lang, { sw: 'Zima', en: 'Disable' })}
              </button>
            </div>
          )}

          {!verifiedFactor && !enrollment && (
            <div>
              <p className="text-xs text-tz-black/60 mb-3">
                {t(lang, {
                  sw: 'Ongeza kinga ya ziada kwa akaunti yako kwa kutumia programu ya Authenticator (Google Authenticator, Authy, n.k).',
                  en: 'Add extra protection to your account using an authenticator app (Google Authenticator, Authy, etc).',
                })}
              </p>
              <button
                onClick={() => void startEnroll()}
                disabled={busy}
                className="rounded-lg bg-tz-green px-3 py-2 text-xs font-semibold text-white hover:bg-tz-green-dark"
              >
                {t(lang, { sw: 'Washa 2FA', en: 'Enable 2FA' })}
              </button>
            </div>
          )}

          {enrollment && (
            <form onSubmit={confirm} className="space-y-3">
              <p className="text-xs text-tz-black/60">
                {t(lang, {
                  sw: 'Skani QR code hii kwa programu yako ya Authenticator, kisha ingiza msimbo wa tarakimu 6.',
                  en: 'Scan this QR code with your authenticator app, then enter the 6-digit code.',
                })}
              </p>
              <div
                className="w-40 h-40 mx-auto [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
              />
              <p className="text-[11px] text-center text-tz-black/40 font-mono break-all">{enrollment.secret}</p>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-lg border border-tz-black/15 px-3 py-2 text-center text-lg tracking-[0.4em] font-mono"
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full rounded-xl bg-tz-green px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t(lang, { sw: 'Thibitisha na Washa', en: 'Confirm and Enable' })}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
