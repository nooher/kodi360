import { useEffect, useState } from 'react';
import { LogOut, Users, Receipt as ReceiptIcon, Scale, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLang, t } from '../lib/i18n';
import { supabase, isConfigured } from '../lib/supabase';
import { withApiLogging } from '../lib/api-logger';

type Tab = 'registrations' | 'receipts' | 'disputes';

interface Row {
  id: string;
  [key: string]: unknown;
}

const DEMO_ROWS: Record<Tab, Row[]> = {
  registrations: [
    { id: 'd1', name: 'Mama Neema', phone: '0712345678', location: 'Soko la Kariakoo', activity: 'mama_lishe', status: 'pending' },
    { id: 'd2', name: 'Juma Athumani', phone: '0765432109', location: 'Stendi ya Ubungo', activity: 'machinga', status: 'reviewed' },
  ],
  receipts: [
    { id: 'd3', receipt_no: 'KODI-482913', item: 'Mchele kilo 5', amount: 25000 },
    { id: 'd4', receipt_no: 'KODI-118204', item: 'Huduma ya ushonaji', amount: 15000 },
  ],
  disputes: [
    { id: 'd5', reference: 'UTZ-2026-4471', assessed_amount: 4200000, status: 'filed' },
  ],
};

const TABS: { id: Tab; icon: typeof Users; sw: string; en: string }[] = [
  { id: 'registrations', icon: Users, sw: 'Usajili (Rasimisha)', en: 'Registrations (Rasimisha)' },
  { id: 'receipts', icon: ReceiptIcon, sw: 'Risiti (EFD-Lite)', en: 'Receipts (EFD-Lite)' },
  { id: 'disputes', icon: Scale, sw: 'Migogoro (Utatuzi)', en: 'Disputes (Utatuzi)' },
];

export default function Officer() {
  const { user, logout, isDemoMode } = useAuth();
  const { lang } = useLang();
  const [tab, setTab] = useState<Tab>('registrations');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      if (isDemoMode || !isConfigured()) {
        if (!cancelled) {
          setRows(DEMO_ROWS[tab]);
          setLoading(false);
        }
        return;
      }
      try {
        const { data } = await withApiLogging(`${tab}.select`, () =>
          supabase.from(tab).select('*').order('created_at', { ascending: false }).limit(50),
        );
        if (!cancelled) setRows((data as Row[]) ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, isDemoMode]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-tz-black flex items-center justify-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-tz-black">{user?.name}</p>
            <p className="text-xs text-tz-black/50">
              {user?.role} {isDemoMode && `· ${t(lang, { sw: 'hali ya demo', en: 'demo mode' })}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-tz-black/15 px-3 py-1.5 text-sm font-medium text-tz-black/70 hover:bg-tz-black/5"
        >
          <LogOut className="h-4 w-4" />
          {t(lang, { sw: 'Toka', en: 'Log out' })}
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                tab === tb.id ? 'bg-tz-green text-white' : 'bg-white border border-tz-black/10 text-tz-black/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(lang, tb)}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-tz-black/10 bg-white overflow-hidden">
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead className="bg-paper text-tz-black/50 text-xs uppercase">
              <tr>
                {rows[0] &&
                  Object.keys(rows[0])
                    .filter((k) => k !== 'id')
                    .map((k) => (
                      <th key={k} className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                        {k}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-tz-black/40" colSpan={6}>
                    {t(lang, { sw: 'Inapakia…', en: 'Loading…' })}
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-tz-black/40" colSpan={6}>
                    {t(lang, { sw: 'Hakuna data bado.', en: 'No data yet.' })}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-tz-black/5">
                    {Object.entries(r)
                      .filter(([k]) => k !== 'id')
                      .map(([k, v]) => (
                        <td key={k} className="px-4 py-3 whitespace-nowrap text-tz-black/80">
                          {String(v)}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
