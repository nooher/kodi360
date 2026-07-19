import { Link } from 'react-router-dom';
import {
  UserPlus, Calculator, Receipt, Scale, Bot, LayoutGrid,
  ArrowRight, WifiOff, Smartphone, Download,
} from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { TAX_BASE_STATS } from '../lib/stats';

const MODULES = [
  {
    to: '/rasimisha',
    icon: UserPlus,
    name: 'Rasimisha',
    sw: 'Usajili wa TIN wenye urahisi kwa wafanyabiashara wasio rasmi — hakuna anwani ya kudumu inayohitajika.',
    en: 'Frictionless TIN onboarding for informal traders — no fixed address required.',
    tag: { sw: 'Kupanua wigo wa kodi', en: 'Tax base expansion' },
  },
  {
    to: '/kadirio',
    icon: Calculator,
    name: 'Kadirio',
    sw: 'Makadirio ya kodi yenye haki, yanayozingatia faida — si mauzo tu — na maelezo rahisi ya kila namba.',
    en: 'Fair, margin-aware tax estimates — not just turnover — with a plain-language "why" for every number.',
    tag: { sw: 'Makadirio rahisi kwa SME', en: 'Simplified SME estimation' },
  },
  {
    to: '/efd-lite',
    icon: Receipt,
    name: 'EFD-Lite',
    sw: 'Risiti za kielektroniki nafuu kwa simu — mbadala wa mashine ya EFD ya milioni 2+.',
    en: 'Cheap phone-based electronic receipts — an alternative to the TZS 2M+ EFD machine.',
    tag: { sw: 'Kupunguza gharama za makusanyo', en: 'Collection cost reduction' },
  },
  {
    to: '/utatuzi',
    icon: Scale,
    name: 'Utatuzi',
    sw: 'Ufuatiliaji wa pingamizi na rufaa wenye muda wa kisheria unaoonekana wazi.',
    en: 'Objection & appeal tracking with statutory timelines made visible to everyone.',
    tag: { sw: 'Utatuzi wa haraka wa migogoro', en: 'Faster dispute resolution' },
  },
  {
    to: '/akili-wa-kodi',
    icon: Bot,
    name: 'Akili wa Kodi',
    sw: 'Msaidizi wa AI wa kodi anayefanya kazi bila mtandao — sera zote za TRA ndani ya simu yako.',
    en: 'An offline AI tax assistant — all of TRA\'s policy knowledge, right on your phone.',
    tag: { sw: 'AI katika huduma', en: 'AI in service delivery' },
  },
];

export default function Home() {
  const { lang } = useLang();

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-tz-green" />
          <div className="flex-1 bg-tz-black" />
          <div className="flex-1 bg-tz-gold" />
          <div className="flex-1 bg-tz-blue" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-tz-green/10 text-tz-green-dark px-3 py-1 text-xs font-semibold mb-5">
            <LayoutGrid className="h-3.5 w-3.5" />
            {t(lang, { sw: 'TRA Innovation Challenge 2026', en: 'TRA Innovation Challenge 2026' })}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-tz-black max-w-3xl">
            {t(lang, {
              sw: 'Jukwaa moja linalotatua matatizo sita makubwa ya kodi Tanzania.',
              en: 'One platform solving six of Tanzania\'s biggest tax problems.',
            })}
          </h1>
          <p className="mt-5 text-lg text-tz-black/70 max-w-2xl">
            {t(lang, {
              sw:
                'KODI360 ni jukwaa la kodi linalofanya kazi bila mtandao, linalojumuisha usajili rahisi, ' +
                'makadirio ya haki, risiti nafuu, msaidizi wa AI, na ufuatiliaji wa migogoro — kwa mfanyabiashara ' +
                'na kwa TRA.',
              en:
                'KODI360 is an offline-capable tax platform combining frictionless registration, fair estimation, ' +
                'cheap receipts, an AI assistant, and dispute tracking — built for both the taxpayer and TRA.',
            })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/akili-wa-kodi"
              className="inline-flex items-center gap-2 rounded-xl bg-tz-green px-5 py-3 font-semibold text-white hover:bg-tz-green-dark transition-colors"
            >
              <Bot className="h-4.5 w-4.5" />
              {t(lang, { sw: 'Jaribu Akili wa Kodi', en: 'Try Akili wa Kodi' })}
            </Link>
            <Link
              to="/rasimisha"
              className="inline-flex items-center gap-2 rounded-xl border border-tz-black/15 px-5 py-3 font-semibold text-tz-black hover:bg-tz-black/5 transition-colors"
            >
              {t(lang, { sw: 'Anza usajili', en: 'Start registration' })}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-tz-black/60">
            <span className="inline-flex items-center gap-1.5"><WifiOff className="h-4 w-4" /> {t(lang, { sw: 'Inafanya kazi bila mtandao', en: 'Works fully offline' })}</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4" /> {t(lang, { sw: 'Simu, tablet, na kompyuta', en: 'Phone, tablet, and desktop' })}</span>
            <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> {t(lang, { sw: 'Inapakuliwa kama app', en: 'Installable as an app' })}</span>
          </div>
        </div>
      </section>

      {/* problem stats */}
      <section className="border-y border-tz-black/10 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-tz-black mb-1">
            {t(lang, { sw: 'Tatizo ni kubwa — na linaeleweka kwa namba', en: 'The problem is big — and it\'s measurable' })}
          </h2>
          <p className="text-tz-black/60 mb-8">
            {t(lang, { sw: 'Utafiti uliotumika kubuni KODI360', en: 'The research behind KODI360\'s design' })}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TAX_BASE_STATS.map((s) => (
              <div key={s.value + s.source} className="rounded-2xl border border-tz-black/10 bg-paper p-5">
                <div className="text-3xl font-extrabold text-tz-green-dark">{s.value}</div>
                <p className="mt-2 text-sm text-tz-black/75 leading-snug">{t(lang, s.label)}</p>
                <p className="mt-3 text-xs text-tz-black/40">{s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* modules */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-bold text-tz-black mb-1">
          {t(lang, { sw: 'Suluhisho: moduli sita, kipaumbele sita cha TRA', en: 'The solution: six modules, six TRA priorities' })}
        </h2>
        <p className="text-tz-black/60 mb-8">
          {t(lang, {
            sw: 'Kila moduli inashughulikia kipaumbele kimoja kilichotajwa na TRA moja kwa moja.',
            en: 'Each module addresses one of TRA\'s stated priorities directly.',
          })}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.to}
                to={m.to}
                className="group rounded-2xl border border-tz-black/10 bg-white p-6 hover:border-tz-green hover:shadow-md transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-tz-green/10 flex items-center justify-center text-tz-green-dark group-hover:bg-tz-green group-hover:text-white transition-colors">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 font-bold text-lg text-tz-black">{m.name}</h3>
                <p className="mt-1.5 text-sm text-tz-black/65 leading-snug">{t(lang, { sw: m.sw, en: m.en })}</p>
                <span className="mt-3 inline-block text-xs font-semibold text-tz-blue">
                  {t(lang, m.tag)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
