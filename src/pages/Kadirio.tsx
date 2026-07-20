import { useMemo, useState } from 'react';
import { Calculator, Download, AlertTriangle, Info } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { estimateKadirio, PRESUMPTIVE_CEILING, type BusinessActivity } from '../lib/kadirio';

const ACTIVITIES: { value: BusinessActivity; sw: string; en: string }[] = [
  { value: 'general', sw: 'Biashara ya jumla', en: 'General business' },
  { value: 'retail', sw: 'Rejareja/duka', en: 'Retail/shop' },
  { value: 'services', sw: 'Huduma za kawaida', en: 'General services' },
  { value: 'professional', sw: 'Huduma za kitaalamu', en: 'Professional services' },
  { value: 'technical', sw: 'Huduma za kiufundi', en: 'Technical services' },
  { value: 'management', sw: 'Usimamizi', en: 'Management' },
  { value: 'construction', sw: 'Ujenzi', en: 'Construction' },
  { value: 'training', sw: 'Mafunzo', en: 'Training' },
];

function fmt(n: number): string {
  return new Intl.NumberFormat('en-TZ').format(Math.round(n));
}

export default function Kadirio() {
  const { lang } = useLang();
  const [turnover, setTurnover] = useState(24_000_000);
  const [expenses, setExpenses] = useState(14_000_000);
  const [activity, setActivity] = useState<BusinessActivity>('retail');

  const result = useMemo(
    () => estimateKadirio({ annualTurnover: turnover, annualExpenses: expenses, activity }),
    [turnover, expenses, activity],
  );

  async function downloadPdf() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const L = {
      title: t(lang, { sw: 'KODI360 — Kadirio: Makadirio ya Kodi', en: 'KODI360 — Kadirio: Tax Estimate' }),
      disclaimer: t(lang, { sw: 'Kielelezo tu — thibitisha kiwango rasmi na TRA.', en: 'Illustrative only — verify with TRA.' }),
      turnover: t(lang, { sw: 'Mauzo ya mwaka', en: 'Annual turnover' }),
      expenses: t(lang, { sw: 'Gharama za mwaka', en: 'Annual expenses' }),
      profit: t(lang, { sw: 'Faida', en: 'Profit' }),
      margin: t(lang, { sw: 'Ukingo wa faida', en: 'Profit margin' }),
      presumptiveTax: t(lang, { sw: 'Kodi ya makadirio (kielelezo)', en: 'Presumptive tax (illustrative)' }),
      taxOfTurnover: t(lang, { sw: 'Kodi kama % ya mauzo', en: 'Tax as % of turnover' }),
      taxOfProfit: t(lang, { sw: 'Kodi kama % ya faida', en: 'Tax as % of profit' }),
      overCeiling: t(lang, { sw: 'Haistahiki kodi ya makadirio: mauzo yamezidi TZS 100M', en: 'Not eligible: turnover exceeds TZS 100M' }),
      excludedActivity: t(lang, { sw: 'Haistahiki kodi ya makadirio: shughuli imetengwa', en: 'Not eligible: excluded activity' }),
    };
    doc.setFontSize(16);
    doc.text(L.title, 14, 18);
    doc.setFontSize(10);
    doc.text(L.disclaimer, 14, 25);

    doc.setFontSize(11);
    let y = 38;
    const line = (label: string, value: string) => {
      doc.text(label, 14, y);
      doc.text(value, 130, y);
      y += 8;
    };
    line(L.turnover, `TZS ${fmt(turnover)}`);
    line(L.expenses, `TZS ${fmt(expenses)}`);
    line(L.profit, `TZS ${fmt(result.profit)}`);
    line(L.margin, `${result.marginPct.toFixed(1)}%`);
    y += 4;
    if (result.eligible) {
      line(L.presumptiveTax, `TZS ${fmt(result.presumptiveTax)}`);
      line(L.taxOfTurnover, `${result.taxAsPctOfTurnover.toFixed(2)}%`);
      line(L.taxOfProfit, `${result.taxAsPctOfProfit.toFixed(2)}%`);
    } else {
      doc.text(result.ineligibleReason === 'over-ceiling' ? L.overCeiling : L.excludedActivity, 14, y);
    }

    doc.save('kodi360-kadirio-makadirio.pdf');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <Calculator className="h-6 w-6" />
        </div>
        <h1 className="font-bold text-2xl text-tz-black">Kadirio</h1>
      </div>
      <p className="text-tz-black/60 mb-8 max-w-2xl">
        {t(lang, {
          sw: 'Makadirio ya kodi yenye haki — yanayoangalia FAIDA yako, si mauzo tu. Biashara yenye faida ndogo haipaswi kubebeshwa mzigo mkubwa zaidi ya biashara yenye faida kubwa.',
          en: 'A fair tax estimate — one that looks at your PROFIT, not just turnover. A low-margin business shouldn\'t carry a heavier burden than a high-margin one.',
        })}
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-tz-black/10 bg-white p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-tz-black mb-1.5">
              {t(lang, { sw: 'Mauzo ya mwaka (TZS)', en: 'Annual turnover (TZS)' })}
            </label>
            <input
              type="range"
              min={0}
              max={110_000_000}
              step={500_000}
              value={turnover}
              onChange={(e) => setTurnover(Number(e.target.value))}
              className="w-full accent-tz-green"
            />
            <input
              type="number"
              value={turnover}
              onChange={(e) => setTurnover(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-lg border border-tz-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-tz-black mb-1.5">
              {t(lang, { sw: 'Gharama za mwaka / manunuzi (TZS)', en: 'Annual expenses / cost of goods (TZS)' })}
            </label>
            <input
              type="range"
              min={0}
              max={110_000_000}
              step={500_000}
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full accent-tz-blue"
            />
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-lg border border-tz-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-tz-black mb-1.5">
              {t(lang, { sw: 'Aina ya shughuli', en: 'Type of activity' })}
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as BusinessActivity)}
              className="w-full rounded-lg border border-tz-black/15 px-3 py-2 text-sm bg-white"
            >
              {ACTIVITIES.map((a) => (
                <option key={a.value} value={a.value}>{t(lang, a)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-tz-black/10 bg-paper p-6 flex flex-col">
          {!result.eligible ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
              <AlertTriangle className="h-8 w-8 text-tz-gold" />
              <p className="text-sm text-tz-black/70 max-w-xs">
                {result.ineligibleReason === 'over-ceiling'
                  ? t(lang, {
                      sw: 'Mauzo yamezidi TZS milioni 100 — huna sifa ya kodi ya makadirio, unatakiwa kodi ya kawaida ya mapato.',
                      en: 'Turnover exceeds TZS 100 million — not eligible for presumptive tax; standard income tax applies.',
                    })
                  : t(lang, {
                      sw: 'Shughuli hii (kitaalamu/kiufundi/usimamizi/ujenzi/mafunzo) haistahiki kodi ya makadirio kisheria.',
                      en: 'This activity (professional/technical/management/construction/training) is excluded from presumptive tax by law.',
                    })}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center py-4">
                <p className="text-xs uppercase tracking-wide text-tz-black/50 font-semibold">
                  {t(lang, { sw: 'Makadirio ya kodi (kielelezo)', en: 'Estimated tax (illustrative)' })}
                </p>
                <p className="text-4xl font-extrabold text-tz-green-dark mt-1">
                  TZS {fmt(result.presumptiveTax)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="rounded-xl bg-white border border-tz-black/10 p-3 text-center">
                  <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Faida', en: 'Profit' })}</p>
                  <p className="font-bold text-tz-black">TZS {fmt(result.profit)}</p>
                </div>
                <div className="rounded-xl bg-white border border-tz-black/10 p-3 text-center">
                  <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Ukingo wa faida', en: 'Profit margin' })}</p>
                  <p className="font-bold text-tz-black">{result.marginPct.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-white border border-tz-black/10 p-3 text-center">
                  <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Kodi / mauzo', en: 'Tax / turnover' })}</p>
                  <p className="font-bold text-tz-black">{result.taxAsPctOfTurnover.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl bg-white border border-tz-black/10 p-3 text-center">
                  <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Kodi / faida', en: 'Tax / profit' })}</p>
                  <p className="font-bold text-tz-black">{result.taxAsPctOfProfit.toFixed(2)}%</p>
                </div>
              </div>

              {result.fairnessNote === 'low-margin-burden' && (
                <p className="text-xs rounded-xl bg-tz-gold/15 text-tz-black/80 p-3 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-tz-gold" />
                  {t(lang, {
                    sw: 'Onyo la haki: kodi hii ni sehemu kubwa ya faida yako halisi kwa sababu ukingo wa faida ni mdogo. Kadirio inapendekeza TRA izingatie hili.',
                    en: 'Fairness flag: this tax takes a large share of your actual profit because your margin is thin. Kadirio recommends TRA account for this.',
                  })}
                </p>
              )}

              <button
                onClick={downloadPdf}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-tz-black px-4 py-3 text-sm font-semibold text-white hover:bg-tz-black/85"
              >
                <Download className="h-4 w-4" />
                {t(lang, { sw: 'Pakua PDF ya makadirio', en: 'Download estimate PDF' })}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-tz-black/45 flex gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {t(lang, {
          sw:
            `Bendi zilizotumika hapa ni kielelezo tu, zenye muundo unaofanana na kodi ya makadirio ya TRA (kikomo TZS ${fmt(PRESUMPTIVE_CEILING)}). ` +
            'Thibitisha kiwango rasmi cha mwaka huu kwenye "Taxes and Duties at a Glance" ya TRA.',
          en:
            `The bands used here are illustrative only, shaped like TRA's real presumptive tax structure (ceiling TZS ${fmt(PRESUMPTIVE_CEILING)}). ` +
            'Verify this year\'s official figures in TRA\'s "Taxes and Duties at a Glance".',
        })}
      </p>
    </div>
  );
}
