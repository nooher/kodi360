import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Scale, AlertCircle, CheckCircle2, Paperclip } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { db, genReference } from '../lib/db';
import { computeTimeline } from '../lib/utatuzi';
import { disputeSchema, fieldErrors } from '../lib/validation';
import { syncPendingRecords } from '../lib/sync';
import TraderHeader from '../components/TraderHeader';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-TZ').format(Math.round(n));
}

const URGENCY_STYLE: Record<string, string> = {
  expired: 'bg-red-50 border-red-300 text-red-800',
  critical: 'bg-red-50 border-red-300 text-red-800',
  soon: 'bg-tz-gold/15 border-tz-gold text-tz-black/80',
  ok: 'bg-tz-green/10 border-tz-green/40 text-tz-green-dark',
};

export default function Utatuzi() {
  const { lang } = useLang();
  const [decisionDate, setDecisionDate] = useState('');
  const [assessed, setAssessed] = useState('');
  const [undisputed, setUndisputed] = useState('0');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState('');

  const disputes = useLiveQuery(() => db.disputes.orderBy('createdAt').reverse().toArray(), []);

  const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

  function onPickEvidence(f: File | null) {
    setFileError('');
    if (!f) {
      setEvidence(null);
      return;
    }
    if (f.size > MAX_EVIDENCE_BYTES) {
      setFileError(t(lang, { sw: 'Faili kubwa mno (upeo MB 10).', en: 'File too large (10MB max).' }));
      return;
    }
    setEvidence(f);
  }

  async function file(e: React.FormEvent) {
    e.preventDefault();

    const parsed = disputeSchema.safeParse({
      decisionDate,
      assessedAmount: assessed,
      undisputedAmount: undisputed,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    await db.disputes.add({
      reference: genReference(),
      assessedAmount: parsed.data.assessedAmount,
      undisputedAmount: parsed.data.undisputedAmount,
      decisionDate: parsed.data.decisionDate.getTime(),
      status: 'filed',
      createdAt: Date.now(),
      synced: false,
      ...(evidence ? { evidenceBlob: evidence, evidenceFileName: evidence.name } : {}),
    });
    setDecisionDate('');
    setAssessed('');
    setUndisputed('0');
    setEvidence(null);
    void syncPendingRecords();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <TraderHeader />
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <Scale className="h-6 w-6" />
        </div>
        <h1 className="font-bold text-2xl text-tz-black">Utatuzi</h1>
      </div>
      <p className="text-tz-black/60 mb-8 max-w-2xl">
        {t(lang, {
          sw: 'Fuatilia muda wa kisheria wa pingamizi lako dhidi ya tathmini ya kodi — siku 30 za kuwasilisha, amana inayotakiwa, na dirisha la kuomba nyongeza ya muda.',
          en: 'Track the statutory clock on your objection to a tax assessment — the 30-day filing window, the required deposit, and the extension-request window.',
        })}
      </p>

      <form onSubmit={file} className="rounded-2xl border border-tz-black/10 bg-white p-6 grid sm:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Tarehe ya uamuzi wa TRA', en: 'TRA decision date' })}</label>
          <input type="date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} required
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
          {errors.decisionDate && <p className="mt-1 text-xs text-red-600">{errors.decisionDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Kodi iliyokadiriwa (TZS)', en: 'Assessed tax (TZS)' })}</label>
          <input type="number" value={assessed} onChange={(e) => setAssessed(e.target.value)} required min={0}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
          {errors.assessedAmount && <p className="mt-1 text-xs text-red-600">{errors.assessedAmount}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Kodi isiyobishaniwa (TZS)', en: 'Undisputed tax (TZS)' })}</label>
          <input type="number" value={undisputed} onChange={(e) => setUndisputed(e.target.value)} min={0}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
          {errors.undisputedAmount && <p className="mt-1 text-xs text-red-600">{errors.undisputedAmount}</p>}
        </div>
        <div className="sm:col-span-3">
          <label className="block text-sm font-semibold text-tz-black mb-1.5">
            {t(lang, { sw: 'Kiambatisho (si lazima) — mfano ushahidi wa mauzo', en: 'Supporting evidence (optional) — e.g. sales records' })}
          </label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => onPickEvidence(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-tz-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          {evidence && <p className="mt-1 text-xs text-tz-green-dark inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{evidence.name}</p>}
          {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
        </div>
        <button type="submit" className="sm:col-span-3 rounded-xl bg-tz-green px-4 py-3 font-semibold text-white hover:bg-tz-green-dark">
          {t(lang, { sw: 'Andika pingamizi', en: 'Log objection' })}
        </button>
      </form>

      <div className="space-y-4">
        {(disputes ?? []).length === 0 && (
          <p className="text-sm text-tz-black/40">{t(lang, { sw: 'Hakuna pingamizi lililoandikwa bado.', en: 'No objections logged yet.' })}</p>
        )}
        {(disputes ?? []).map((d) => {
          const tl = computeTimeline(new Date(d.decisionDate), d.assessedAmount, d.undisputedAmount);
          return (
            <div key={d.id} className={`rounded-2xl border p-5 ${URGENCY_STYLE[tl.urgency]}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="font-mono font-bold inline-flex items-center gap-1.5">
                  {d.reference}
                  {(d.evidenceFileName || d.evidencePath) && <Paperclip className="h-3.5 w-3.5 opacity-60" />}
                </span>
                {tl.urgency === 'expired' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4" /> {t(lang, { sw: 'Muda umeisha', en: 'Deadline passed' })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    {tl.urgency === 'ok' && <CheckCircle2 className="h-4 w-4" />}
                    {tl.urgency !== 'ok' && <AlertCircle className="h-4 w-4" />}
                    {t(lang, { sw: `Siku ${tl.daysRemaining} zimebaki`, en: `${tl.daysRemaining} days remaining` })}
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="opacity-60 text-xs">{t(lang, { sw: 'Ukomo wa pingamizi', en: 'Objection deadline' })}</p>
                  <p className="font-semibold">{tl.objectionDeadline.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="opacity-60 text-xs">{t(lang, { sw: 'Amana inayotakiwa (1/3 au isiyobishaniwa)', en: 'Required deposit (1/3 or undisputed)' })}</p>
                  <p className="font-semibold">TZS {fmt(tl.requiredDeposit)}</p>
                </div>
                <div>
                  <p className="opacity-60 text-xs">{t(lang, { sw: 'Omba nyongeza kabla ya', en: 'Request extension by' })}</p>
                  <p className="font-semibold">
                    {tl.extensionRequestBy.toLocaleDateString()}
                    {!tl.canStillRequestExtension && ` — ${t(lang, { sw: 'imepita', en: 'passed' })}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
