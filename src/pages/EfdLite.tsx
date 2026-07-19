import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Receipt, WifiOff, Clock, AlertCircle } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { db, genReceiptNo } from '../lib/db';
import { receiptSchema, fieldErrors } from '../lib/validation';
import { checkRateLimit } from '../lib/rate-limit';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-TZ').format(Math.round(n));
}

export default function EfdLite() {
  const { lang } = useLang();
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [limitMsg, setLimitMsg] = useState('');

  const receipts = useLiveQuery(() => db.receipts.orderBy('createdAt').reverse().limit(20).toArray(), []);
  const todayTotal = useLiveQuery(async () => {
    const all = await db.receipts.toArray();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    return all.filter((r) => r.createdAt >= startOfDay).reduce((sum, r) => sum + r.amount, 0);
  }, []);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setLimitMsg('');

    const parsed = receiptSchema.safeParse({ item, amount, buyerPhone });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    const limit = checkRateLimit('submit', 'efd-lite');
    if (!limit.allowed) {
      setLimitMsg(
        t(lang, {
          sw: `Umetoa risiti nyingi mno kwa haraka. Subiri sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`,
          en: `Too many receipts issued too fast. Wait ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
        }),
      );
      return;
    }

    const receiptNo = genReceiptNo();
    await db.receipts.add({
      receiptNo,
      item: parsed.data.item,
      amount: parsed.data.amount,
      buyerPhone: parsed.data.buyerPhone || undefined,
      createdAt: Date.now(),
      synced: false,
    });
    setLastReceipt(receiptNo);
    setItem('');
    setAmount('');
    setBuyerPhone('');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <Receipt className="h-6 w-6" />
        </div>
        <h1 className="font-bold text-2xl text-tz-black">EFD-Lite</h1>
      </div>
      <p className="text-tz-black/60 mb-8 max-w-2xl">
        {t(lang, {
          sw: 'Toa risiti ya kielektroniki kwa simu yako pekee — bila kununua mashine ya EFD ya zaidi ya TZS milioni 2. Risiti zinahifadhiwa kwenye simu na kutumwa TRA mtandao utakapopatikana.',
          en: 'Issue an electronic receipt straight from your phone — no need for a TZS 2M+ EFD machine. Receipts are saved on your device and sent to TRA once you\'re online.',
        })}
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={issue} className="rounded-2xl border border-tz-black/10 bg-white p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Bidhaa/huduma', en: 'Item/service' })}</label>
              <input value={item} onChange={(e) => setItem(e.target.value)} required
                className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
              {errors.item && <p className="mt-1 text-xs text-red-600">{errors.item}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Kiasi (TZS)', en: 'Amount (TZS)' })}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min={1}
                className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-tz-black mb-1.5">{t(lang, { sw: 'Namba ya mteja (si lazima)', en: 'Buyer phone (optional)' })}</label>
              <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full rounded-lg border border-tz-black/15 px-3 py-2.5 text-sm" />
              {errors.buyerPhone && <p className="mt-1 text-xs text-red-600">{errors.buyerPhone}</p>}
            </div>
            <button type="submit" className="w-full rounded-xl bg-tz-green px-4 py-3 font-semibold text-white hover:bg-tz-green-dark">
              {t(lang, { sw: 'Toa risiti', en: 'Issue receipt' })}
            </button>
            {limitMsg && (
              <p className="text-sm text-tz-gold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {limitMsg}
              </p>
            )}
          </form>

          {lastReceipt && (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-tz-green p-5 bg-tz-green/5 text-center">
              <p className="text-xs text-tz-black/50">{t(lang, { sw: 'Risiti imetolewa', en: 'Receipt issued' })}</p>
              <p className="font-mono font-bold text-lg text-tz-green-dark mt-1">{lastReceipt}</p>
            </div>
          )}
        </div>

        <div>
          <div className="rounded-2xl bg-tz-black text-white p-5 mb-4">
            <p className="text-xs text-white/60">{t(lang, { sw: 'Jumla ya leo', en: "Today's total" })}</p>
            <p className="text-3xl font-extrabold mt-1">TZS {fmt(todayTotal ?? 0)}</p>
          </div>

          <h2 className="font-semibold text-tz-black mb-3 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-tz-black/40" />
            {t(lang, { sw: 'Risiti za hivi karibuni', en: 'Recent receipts' })}
          </h2>
          <div className="space-y-2">
            {(receipts ?? []).length === 0 && (
              <p className="text-sm text-tz-black/40">{t(lang, { sw: 'Hakuna risiti bado.', en: 'No receipts yet.' })}</p>
            )}
            {(receipts ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-tz-black/10 bg-paper p-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-tz-black/50">{r.receiptNo}</p>
                  <p className="text-sm font-medium text-tz-black">{r.item}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-tz-black">TZS {fmt(r.amount)}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-tz-black/45">
                    <Clock className="h-3 w-3" /> {t(lang, { sw: 'inasubiri', en: 'pending' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
