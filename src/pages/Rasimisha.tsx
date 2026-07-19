import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPlus, CheckCircle2, Clock, WifiOff, AlertCircle, Camera } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { db } from '../lib/db';
import { registrationSchema, fieldErrors } from '../lib/validation';
import { checkRateLimit } from '../lib/rate-limit';
import { syncPendingRecords } from '../lib/sync';

const ACTIVITIES = [
  { value: 'mama_lishe', sw: 'Mama lishe / chakula', en: 'Food vendor' },
  { value: 'duka', sw: 'Duka la rejareja', en: 'Retail shop' },
  { value: 'machinga', sw: 'Machinga / muuza mtaani', en: 'Street vendor' },
  { value: 'fundi', sw: 'Fundi / huduma', en: 'Artisan / service' },
  { value: 'nyingine', sw: 'Nyingine', en: 'Other' },
];

export default function Rasimisha() {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState(ACTIVITIES[0].value);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitMsg, setLimitMsg] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoFileError, setPhotoFileError] = useState('');

  const registrations = useLiveQuery(() => db.registrations.orderBy('createdAt').reverse().toArray(), []);

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

    const parsed = registrationSchema.safeParse({ name, phone, location, activity });
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

    await db.registrations.add({
      name: parsed.data.name,
      phone: parsed.data.phone,
      location: parsed.data.location || t(lang, { sw: '(bila anwani ya kudumu)', en: '(no fixed address)' }),
      activity: parsed.data.activity,
      createdAt: Date.now(),
      synced: false,
      ...(photo ? { photoBlob: photo, photoFileName: photo.name } : {}),
    });
    setName('');
    setPhone('');
    setLocation('');
    setPhoto(null);
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 4000);
    void syncPendingRecords();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="font-bold text-2xl text-tz-black">Rasimisha</h1>
      </div>
      <p className="text-tz-black/60 mb-8 max-w-2xl">
        {t(lang, {
          sw: 'Sajili biashara yako kwa dakika chache — hakuna anwani ya kudumu inayohitajika. Fomu hii inahifadhiwa kwenye simu yako na kutumwa TRA mara mtandao utakapopatikana.',
          en: 'Register your business in minutes — no fixed address required. This form is saved on your phone and sent to TRA once you\'re back online.',
        })}
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="rounded-2xl border border-tz-black/10 bg-white p-6 space-y-4">
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
          <button type="submit" className="w-full rounded-xl bg-tz-green px-4 py-3 font-semibold text-white hover:bg-tz-green-dark">
            {t(lang, { sw: 'Wasilisha usajili', en: 'Submit registration' })}
          </button>
          {justSubmitted && (
            <p className="text-sm text-tz-green-dark flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {t(lang, { sw: 'Imehifadhiwa kwenye simu yako. Itatumwa TRA mara mtandao utakapopatikana.', en: 'Saved on your phone. It will be sent to TRA once you\'re online.' })}
            </p>
          )}
          {limitMsg && (
            <p className="text-sm text-tz-gold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              {limitMsg}
            </p>
          )}
        </form>

        <div>
          <h2 className="font-semibold text-tz-black mb-3 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-tz-black/40" />
            {t(lang, { sw: 'Usajili uliohifadhiwa kwenye simu', en: 'Registrations saved on this device' })}
          </h2>
          <div className="space-y-3">
            {(registrations ?? []).length === 0 && (
              <p className="text-sm text-tz-black/40">{t(lang, { sw: 'Hakuna usajili bado.', en: 'No registrations yet.' })}</p>
            )}
            {(registrations ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-tz-black/10 bg-paper p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-tz-black inline-flex items-center gap-1.5">
                    {r.name}
                    {(r.photoFileName || r.photoPath) && <Camera className="h-3.5 w-3.5 opacity-50" />}
                  </p>
                  {r.synced ? (
                    <span className="inline-flex items-center gap-1 text-xs rounded-full bg-tz-green/15 text-tz-green-dark px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                      {t(lang, { sw: 'Imesawazishwa', en: 'Synced' })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs rounded-full bg-tz-gold/20 text-tz-black/70 px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      {t(lang, { sw: 'Inasubiri usawazishaji', en: 'Pending sync' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-tz-black/55 mt-1">{r.phone} · {r.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
