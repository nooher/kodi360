// ConsoleStats.tsx — the officer dashboard's overview "console": aggregate
// counts across all three modules in one glance, independent of whichever
// tab is currently open below it.

import { useEffect, useState } from 'react';
import { Users, Receipt as ReceiptIcon, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';
import { withApiLogging } from '../lib/api-logger';
import { computeTimeline } from '../lib/utatuzi';
import { useLang, t } from '../lib/i18n';

interface Stats {
  registrationsTotal: number;
  registrationsPending: number;
  receiptsTotal: number;
  receiptsValue: number;
  disputesTotal: number;
  disputesOpen: number;
  disputesUrgent: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-TZ').format(Math.round(n));
}

const DEMO_STATS: Stats = {
  registrationsTotal: 2, registrationsPending: 1,
  receiptsTotal: 2, receiptsValue: 40000,
  disputesTotal: 1, disputesOpen: 1, disputesUrgent: 0,
};

export default function ConsoleStats({ isDemoMode }: { isDemoMode: boolean }) {
  const { lang } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (isDemoMode || !isConfigured()) {
      setStats(DEMO_STATS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [regTotal, regPending, recTotal, recRows, disTotal, disOpenRows] = await Promise.all([
        withApiLogging('console.registrations.count', () =>
          supabase.from('registrations').select('id', { count: 'exact', head: true }),
        ),
        withApiLogging('console.registrations.pending', () =>
          supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ),
        withApiLogging('console.receipts.count', () =>
          supabase.from('receipts').select('id', { count: 'exact', head: true }),
        ),
        withApiLogging('console.receipts.amounts', () => supabase.from('receipts').select('amount').limit(2000)),
        withApiLogging('console.disputes.count', () =>
          supabase.from('disputes').select('id', { count: 'exact', head: true }),
        ),
        withApiLogging('console.disputes.open', () =>
          supabase
            .from('disputes')
            .select('decision_date, assessed_amount, undisputed_amount')
            .in('status', ['filed', 'under_review'])
            .limit(500),
        ),
      ]);

      const receiptsValue = (recRows.data ?? []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
      const openDisputes = disOpenRows.data ?? [];
      const urgent = openDisputes.filter((d: { decision_date: string; assessed_amount: number; undisputed_amount: number }) => {
        const tl = computeTimeline(new Date(d.decision_date), d.assessed_amount, d.undisputed_amount);
        return tl.urgency === 'critical' || tl.urgency === 'expired';
      }).length;

      setStats({
        registrationsTotal: regTotal.count ?? 0,
        registrationsPending: regPending.count ?? 0,
        receiptsTotal: recTotal.count ?? 0,
        receiptsValue,
        disputesTotal: disTotal.count ?? 0,
        disputesOpen: openDisputes.length,
        disputesUrgent: urgent,
      });
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-tz-black uppercase tracking-wide">
          {t(lang, { sw: 'Muhtasari wa Taifa', en: 'National Overview' })}
        </h2>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-tz-black/50 hover:text-tz-black disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t(lang, { sw: 'Onyesha upya', en: 'Refresh' })}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-tz-black/10 bg-white p-4">
          <div className="flex items-center gap-2 text-tz-black/40 text-xs mb-1">
            <Users className="h-3.5 w-3.5" /> {t(lang, { sw: 'Usajili', en: 'Registrations' })}
          </div>
          <p className="text-2xl font-extrabold text-tz-black">{stats ? fmt(stats.registrationsTotal) : '—'}</p>
          <p className="text-xs text-tz-gold font-medium">{stats?.registrationsPending ?? 0} {t(lang, { sw: 'zinasubiri', en: 'pending' })}</p>
        </div>
        <div className="rounded-xl border border-tz-black/10 bg-white p-4">
          <div className="flex items-center gap-2 text-tz-black/40 text-xs mb-1">
            <ReceiptIcon className="h-3.5 w-3.5" /> {t(lang, { sw: 'Risiti', en: 'Receipts' })}
          </div>
          <p className="text-2xl font-extrabold text-tz-black">{stats ? fmt(stats.receiptsTotal) : '—'}</p>
          <p className="text-xs text-tz-black/50">TZS {stats ? fmt(stats.receiptsValue) : '—'}</p>
        </div>
        <div className="rounded-xl border border-tz-black/10 bg-white p-4">
          <div className="flex items-center gap-2 text-tz-black/40 text-xs mb-1">
            <Scale className="h-3.5 w-3.5" /> {t(lang, { sw: 'Migogoro', en: 'Disputes' })}
          </div>
          <p className="text-2xl font-extrabold text-tz-black">{stats ? fmt(stats.disputesTotal) : '—'}</p>
          <p className="text-xs text-tz-black/50">{stats?.disputesOpen ?? 0} {t(lang, { sw: 'wazi', en: 'open' })}</p>
        </div>
        <div className={`rounded-xl border p-4 ${stats && stats.disputesUrgent > 0 ? 'border-red-300 bg-red-50' : 'border-tz-black/10 bg-white'}`}>
          <div className={`flex items-center gap-2 text-xs mb-1 ${stats && stats.disputesUrgent > 0 ? 'text-red-600' : 'text-tz-black/40'}`}>
            <AlertTriangle className="h-3.5 w-3.5" /> {t(lang, { sw: 'Muda unaokaribia', en: 'Nearing deadline' })}
          </div>
          <p className={`text-2xl font-extrabold ${stats && stats.disputesUrgent > 0 ? 'text-red-600' : 'text-tz-black'}`}>
            {stats ? fmt(stats.disputesUrgent) : '—'}
          </p>
          <p className="text-xs text-tz-black/50">{t(lang, { sw: 'migogoro', en: 'disputes' })}</p>
        </div>
      </div>
    </div>
  );
}
