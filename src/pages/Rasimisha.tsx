import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle2, AlertCircle, Camera, IdCard, Lock, LogOut, Receipt, Scale } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { useTraderAuth } from '../hooks/useTraderAuth';
import { supabase } from '../lib/supabase';
import { traderSignUpSchema, fieldErrors } from '../lib/validation';
import { checkRateLimit } from '../lib/rate-limit';
import { registrationStatusLabel } from '../lib/statusLabels';
import type { TraderIdType } from '../types';

const ACTIVITIES = [
  { value: 'mama_lishe', sw: 'Mama lishe / chakula', en: 'Food vendor' },
  { value: 'duka', sw: 'Duka la rejareja', en: 'Retail shop' },
  { value: 'machinga', sw: 'Machinga / muuza mtaani', en: 'Street vendor' },
  { value: 'fundi', sw: 'Fundi / huduma', en: 'Artisan / service' },
  { value: 'nyingine', sw: 'Nyingine', en: 'Other' },
];

function SignedInView() {
  const { trader, logout } = useTraderAuth();
  const { lang } = useLang();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('registrations')
      .select('status')
      .eq('trader_id', trader!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) {
          setStatus(data?.[0]?.status ?? null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trader]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-2xl text-tz-black">{t(lang, { sw: 'Karibu tena', en: 'Welcome back' })}</h1>
          <p className="text-sm text-tz-black/50">{trader?.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-tz-black/10 bg-white p-6 mb-4">
        <p className="text-xs text-tz-black/50 mb-1">{t(lang, { sw: 'Hali ya usajili wako', en: 'Your registration status' })}</p>
        {loading ? (
          <p className="text-sm text-tz-black/40">{t(lang, { sw: 'Inapakia…', en: 'Loading…' })}</p>
        ) : (
          <p className="text-xl font-bold text-tz-green-dark">
            {status ? registrationStatusLabel(lang, status) : t(lang, { sw: 'Haijapatikana', en: 'Not found' })}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Link to="/efd-lite" className="rounded-2xl border border-tz-black/10 bg-white p-5 hover:border-tz-green transition-colors">
          <Receipt className="h-6 w-6 text-tz-green-dark mb-2" />
          <p className="font-semibold text-tz-black">EFD-Lite</p>
          <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Toa risiti', en: 'Issue receipts' })}</p>
        </Link>
        <Link to="/utatuzi" className="rounded-2xl border border-tz-black/10 bg-white p-5 hover:border-tz-green transition-colors">
          <Scale className="h-6 w-6 text-tz-green-dark mb-2" />
          <p className="font-semibold text-tz-black">Utatuzi</p>
          <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Fuatilia migogoro', en: 'Track disputes' })}</p>
        </Link>
      </div>

      <button
        onClick={() => void logout()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tz-black/60 hover:text-tz-black"
      >
        <LogOut className="h-4 w-4" />
        {t(lang, { sw: 'Toka', en: 'Log out' })}
      </button>
    </div>
  );
}

export default function Rasimisha() {
  const { lang } = useLang();
  const { isAuthenticated, isLoading, signUp } = useTraderAuth();

  const [idType, setIdType] = useState<TraderIdType>('nida');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState(ACTIVITIES[0].value);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoFileError, setPhotoFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitMsg, setLimitMsg] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [busy, setBusy] = useState(false);

  const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

  function onPickPhoto(f: File | null) {
    setPhotoFileError('');
    if (!f) {
      setPhoto(null);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setPhotoFileError(t(lang, { sw: 'Picha kubwa mno (upeo MB 8).', en: 'Photo too large (8MB max).' }));
      return;
    }
    setPhoto(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLimitMsg('');
    setSignUpError('');

    const parsed = traderSignUpSchema.safeParse({
      idType, idNumber, password, confirmPassword, name, phone, location, activity,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    const limit = checkRateLimit('submit', phone.trim());
    if (!limit.allowed) {
      setLimitMsg(
        t(lang, {
          sw: `Umewasilisha mara nyingi mno. Jaribu tena baada ya sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`,
          en: `Too many submissions. Try again in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
        }),
      );
      return;
    }

    setBusy(true);
    try {
      await signUp({
        idType: parsed.data.idType,
        idNumber: parsed.data.idNumber,
        password: parsed.data.password,
        name: parsed.data.name,
        phone: parsed.data.phone,
        activity: parsed.data.activity,
      });

      // Sign-up succeeded and a session now exists — file the initial
      // registration directly (this moment already required connectivity).
      const { data: userData } = await supabase.auth.getUser();
      const traderId = userData.user?.id;
      let photoPath: string | null = null;
      if (photo && traderId) {
        const path = `${traderId}/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage.from('registration-photos').upload(path, photo, {
          contentType: photo.type || 'application/octet-stream',
        });
        if (!uploadError) photoPath = path;
      }
      await supabase.from('registrations').insert({
        trader_id: traderId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        location: parsed.data.location || t(lang, { sw: '(bila anwani ya kudumu)', en: '(no fixed address)' }),
        activity: parsed.data.activity,
        photo_path: photoPath,
      });
    } catch (err) {
      setSignUpError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-tz-black/40 text-sm">{t(lang, { sw: 'Inapakia…', en: 'Loading…' })}</div>;
  }

  // `busy` stays true through the registration insert that follows signUp()
  // below, so this waits for that insert to land before switching views —
  // otherwise SignedInView's status query races it and shows "not found".
  if (isAuthenticated && !busy) return <SignedInView />;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="font-bold text-2xl text-tz-black">Rasimisha</h1>
      </div>
      <p className="text-tz-black/60 mb-6 max-w-2xl">
        {t(lang, {
          sw: 'Fungua akaunti yako ya mfanyabiashara kwa NIDA au TIN — hii ndiyo usajili wako, na itakupa uwezo wa kuona historia yako popote ulipo. Hatua hii inahitaji mtandao mara moja tu.',
          en: 'Open your trader account with your NIDA or TIN — this is your registration, and it lets you see your history from anywhere. This one step requires connectivity, once.',
        })}
      </p>

      <form onSubmit={submit} className="rounded-2xl border border-tz-black/10 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Aina ya kitambulisho', en: 'ID type' })}</label>
          <div className="flex gap-2">
            {(['nida', 'tin'] as TraderIdType[]).map((it) => (
              <button
                type="button"
                key={it}
                onClick={() => setIdType(it)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                  idType === it ? 'border-tz-green bg-tz-green/10 text-tz-green-dark' : 'border-tz-black/15 text-tz-black/60'
                }`}
              >
                {it.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">
            {idType === 'nida' ? t(lang, { sw: 'Namba ya NIDA (tarakimu 20)', en: 'NIDA number (20 digits)' }) : t(lang, { sw: 'Namba ya TIN', en: 'TIN number' })}
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tz-black/30" />
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required
              className="w-full rounded-lg border border-tz-black/15 pl-9 pr-3 py-2.5 text-sm" />
          </div>
          {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Nenosiri', en: 'Password' })}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tz-black/30" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full rounded-lg border border-tz-black/15 pl-9 pr-3 py-2.5 text-sm" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Thibitisha nenosiri', en: 'Confirm password' })}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Jina lako', en: 'Your name' })}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Namba ya simu', en: 'Phone number' })}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="07XXXXXXXX"
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">
            {t(lang, { sw: 'Eneo la biashara (si lazima uwe na anwani rasmi)', en: 'Business location (a formal address is not required)' })}
          </label>
          <input value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder={t(lang, { sw: 'mfano: Soko la Kariakoo, karibu na geti la 4', en: 'e.g. Kariakoo Market, near gate 4' })}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Aina ya biashara', en: 'Type of business' })}</label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm bg-white">
            {ACTIVITIES.map((a) => <option key={a.value} value={a.value}>{t(lang, a)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">
            {t(lang, { sw: 'Picha ya duka/eneo la biashara (si lazima)', en: 'Photo of stall/business (optional)' })}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-tz-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          {photo && <p className="mt-1 text-xs text-tz-green-dark inline-flex items-center gap-1"><Camera className="h-3 w-3" />{photo.name}</p>}
          {photoFileError && <p className="mt-1 text-xs text-red-600">{photoFileError}</p>}
        </div>
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-tz-green px-4 py-3 font-semibold text-white hover:bg-tz-green-dark disabled:opacity-50">
          {busy ? t(lang, { sw: 'Inatuma…', en: 'Submitting…' }) : t(lang, { sw: 'Fungua akaunti na sajili', en: 'Create account and register' })}
        </button>
        {signUpError && (
          <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />{signUpError}</p>
        )}
        {limitMsg && (
          <p className="text-sm text-tz-gold flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />{limitMsg}</p>
        )}
      </form>

      <p className="mt-4 text-sm text-center text-tz-black/60">
        {t(lang, { sw: 'Una akaunti tayari?', en: 'Already have an account?' })}{' '}
        <Link to="/trader/login" className="text-tz-green-dark font-semibold hover:underline">
          {t(lang, { sw: 'Ingia', en: 'Log in' })}
        </Link>
      </p>
      <p className="mt-6 text-xs text-tz-black/40 flex gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {t(lang, {
          sw: 'Namba ya NIDA/TIN inathibitishwa na wewe mwenyewe kwa sasa — muunganiko wa moja kwa moja na NIDA/TRA utakapowekwa, itakuwa imeshathibitishwa.',
          en: 'Your NIDA/TIN number is self-declared at this stage — once a direct NIDA/TRA connection is in place, it will already be in the right shape to verify.',
        })}
      </p>
    </div>
  );
}
