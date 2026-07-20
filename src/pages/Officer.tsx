import { useEffect, useState } from 'react';
import { LogOut, Users, Receipt as ReceiptIcon, Scale, ShieldCheck, Activity, Check, X, Loader2, Paperclip } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLang, t } from '../lib/i18n';
import { supabase, isConfigured } from '../lib/supabase';
import { withApiLogging } from '../lib/api-logger';
import { getHealthStatus, type HealthStatus } from '../lib/health';
import OfficerSecurity from '../components/OfficerSecurity';
import OfficerErrorLog from '../components/OfficerErrorLog';
import ConsoleStats from '../components/ConsoleStats';
import {
  healthStatusLabel, upDownLabel, activeInactiveLabel,
  anyStatusLabel, activityLabel,
} from '../lib/statusLabels';

type Tab = 'registrations' | 'receipts' | 'disputes';

interface Row {
  id: string;
  status?: string;
  [key: string]: unknown;
}

interface ColumnDef {
  key: string;
  label: { sw: string; en: string };
  kind?: 'status' | 'activity' | 'amount' | 'date' | 'file';
  bucket?: string;
}

const COLUMNS: Record<Tab, ColumnDef[]> = {
  registrations: [
    { key: 'name', label: { sw: 'Jina', en: 'Name' } },
    { key: 'phone', label: { sw: 'Simu', en: 'Phone' } },
    { key: 'location', label: { sw: 'Eneo', en: 'Location' } },
    { key: 'activity', label: { sw: 'Aina ya biashara', en: 'Activity' }, kind: 'activity' },
    { key: 'photo_path', label: { sw: 'Picha', en: 'Photo' }, kind: 'file', bucket: 'registration-photos' },
    { key: 'status', label: { sw: 'Hali', en: 'Status' }, kind: 'status' },
    { key: 'created_at', label: { sw: 'Tarehe', en: 'Date' }, kind: 'date' },
  ],
  receipts: [
    { key: 'receipt_no', label: { sw: 'Namba ya risiti', en: 'Receipt no.' } },
    { key: 'item', label: { sw: 'Bidhaa/huduma', en: 'Item/service' } },
    { key: 'amount', label: { sw: 'Kiasi (TZS)', en: 'Amount (TZS)' }, kind: 'amount' },
    { key: 'buyer_phone', label: { sw: 'Simu ya mteja', en: 'Buyer phone' } },
    { key: 'created_at', label: { sw: 'Tarehe', en: 'Date' }, kind: 'date' },
  ],
  disputes: [
    { key: 'reference', label: { sw: 'Kumbukumbu', en: 'Reference' } },
    { key: 'assessed_amount', label: { sw: 'Kodi iliyokadiriwa', en: 'Assessed tax' }, kind: 'amount' },
    { key: 'undisputed_amount', label: { sw: 'Isiyobishaniwa', en: 'Undisputed' }, kind: 'amount' },
    { key: 'decision_date', label: { sw: 'Tarehe ya uamuzi', en: 'Decision date' }, kind: 'date' },
    { key: 'evidence_path', label: { sw: 'Ushahidi', en: 'Evidence' }, kind: 'file', bucket: 'dispute-evidence' },
    { key: 'status', label: { sw: 'Hali', en: 'Status' }, kind: 'status' },
    { key: 'created_at', label: { sw: 'Iliwasilishwa', en: 'Filed on' }, kind: 'date' },
  ],
};

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

// Status workflow per table — maker-checker: `officer` can only move a case to
// the review/take-up state; finalizing (issue TIN, reject, resolve) is
// admin-only, enforced both here (hidden from officers) AND at the database
// via RLS WITH CHECK (migration 0007) so it can't be bypassed by calling the
// API directly. Receipts have no workflow (they're immutable records).
const REGISTRATION_ACTIONS: { status: string; sw: string; en: string; tone: string; finalOnly?: boolean }[] = [
  { status: 'reviewed', sw: 'Kagua', en: 'Review', tone: 'bg-tz-blue text-white hover:bg-tz-blue/90' },
  { status: 'tin_issued', sw: 'Toa TIN', en: 'Issue TIN', tone: 'bg-tz-green text-white hover:bg-tz-green-dark', finalOnly: true },
  { status: 'rejected', sw: 'Kataa', en: 'Reject', tone: 'bg-red-600 text-white hover:bg-red-700', finalOnly: true },
];
const DISPUTE_ACTIONS: { status: string; sw: string; en: string; tone: string; finalOnly?: boolean }[] = [
  { status: 'under_review', sw: 'Chukua', en: 'Take up', tone: 'bg-tz-blue text-white hover:bg-tz-blue/90' },
  { status: 'resolved', sw: 'Maliza', en: 'Resolve', tone: 'bg-tz-green text-white hover:bg-tz-green-dark', finalOnly: true },
];

function fmtAmount(n: unknown): string {
  const num = Number(n);
  return Number.isFinite(num) ? new Intl.NumberFormat('en-TZ').format(num) : String(n ?? '—');
}

function fmtDate(v: unknown): string {
  if (!v) return '—';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-tz-gold/20 text-tz-black/70',
  filed: 'bg-tz-gold/20 text-tz-black/70',
  reviewed: 'bg-tz-blue/15 text-tz-blue',
  under_review: 'bg-tz-blue/15 text-tz-blue',
  tin_issued: 'bg-tz-green/15 text-tz-green-dark',
  resolved: 'bg-tz-green/15 text-tz-green-dark',
  rejected: 'bg-red-100 text-red-700',
};

export default function Officer() {
  const { user, logout, isDemoMode } = useAuth();
  const { lang } = useLang();
  const [tab, setTab] = useState<Tab>('registrations');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getHealthStatus().then((h) => {
      if (!cancelled) setHealth(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function setStatus(row: Row, status: string) {
    setActionError('');
    if (isDemoMode || !isConfigured()) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      return;
    }
    setUpdatingId(row.id);
    try {
      const patch: Record<string, unknown> =
        tab === 'registrations'
          ? { status, reviewed_by: user?.id }
          : { status, assigned_to: user?.id };
      const { error } = await withApiLogging(`${tab}.update`, () =>
        supabase.from(tab).update(patch).eq('id', row.id),
      );
      if (error) throw new Error(error.message);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function openFile(bucket: string, path: string) {
    setActionError('');
    try {
      const { data, error } = await withApiLogging(`${bucket}.sign`, () =>
        supabase.storage.from(bucket).createSignedUrl(path, 300),
      );
      if (error || !data) throw new Error(error?.message ?? 'Imeshindwa kupata kiungo.');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  }

  const isAdmin = isDemoMode ? true : user?.role === 'admin';
  const allActions = tab === 'registrations' ? REGISTRATION_ACTIONS : tab === 'disputes' ? DISPUTE_ACTIONS : null;
  const actions = allActions ? allActions.filter((a) => isAdmin || !a.finalOnly) : null;
  const columns = COLUMNS[tab].filter((c) => rows.length === 0 || c.key in rows[0]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-tz-black flex items-center justify-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-tz-black">{user?.name}</p>
            <p className="text-xs flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${isAdmin ? 'bg-tz-black/10 text-tz-black' : 'bg-tz-blue/10 text-tz-blue'}`}>
                {isAdmin ? t(lang, { sw: 'Admin', en: 'Admin' }) : t(lang, { sw: 'Afisa', en: 'Officer' })}
              </span>
              <span className="text-tz-black/40">
                {isDemoMode && t(lang, { sw: 'hali ya demo', en: 'demo mode' })}
              </span>
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

      <ConsoleStats isDemoMode={isDemoMode} />

      {health && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-tz-black/10 bg-white px-4 py-2.5 text-xs text-tz-black/60">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              health.status === 'healthy'
                ? 'text-tz-green-dark'
                : health.status === 'degraded'
                  ? 'text-tz-gold'
                  : 'text-red-600'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            {t(lang, { sw: 'Hali ya mfumo', en: 'System status' })}: {healthStatusLabel(lang, health.status)}
          </span>
          <span>DB {upDownLabel(lang, health.checks.database.status)} ({health.checks.database.latencyMs}ms)</span>
          <span>SW {activeInactiveLabel(lang, health.checks.serviceWorker.status)}</span>
          <span>{t(lang, { sw: 'Makosa 24h', en: 'Errors 24h' })}: {health.checks.errors.last24h}</span>
          <span>v{health.version}</span>
        </div>
      )}

      <OfficerSecurity />
      <OfficerErrorLog />

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

      {actionError && (
        <p className="mb-3 text-sm text-red-600">{actionError}</p>
      )}

      {!isAdmin && allActions && allActions.some((a) => a.finalOnly) && (
        <p className="mb-3 text-xs text-tz-black/50">
          {t(lang, {
            sw: 'Kama Afisa, unaweza kukagua/kuchukua kesi. Kufunga (Toa TIN/Kataa/Maliza) ni kwa Admin pekee — hii inasimamiwa na database, si UI tu.',
            en: 'As an Officer, you can review/take up a case. Finalizing (Issue TIN/Reject/Resolve) is admin-only — enforced by the database, not just the UI.',
          })}
        </p>
      )}

      <div className="rounded-2xl border border-tz-black/10 bg-white overflow-hidden">
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead className="bg-paper text-tz-black/50 text-xs uppercase">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                    {t(lang, c.label)}
                  </th>
                ))}
                {actions && <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">{t(lang, { sw: 'Hatua', en: 'Actions' })}</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-tz-black/40" colSpan={columns.length + 1}>
                    {t(lang, { sw: 'Inapakia…', en: 'Loading…' })}
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-tz-black/40" colSpan={columns.length + 1}>
                    {t(lang, { sw: 'Hakuna data bado.', en: 'No data yet.' })}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-tz-black/5">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 whitespace-nowrap text-tz-black/80">
                        {c.kind === 'status' ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILL[String(r[c.key])] ?? 'bg-tz-black/5'}`}>
                            {anyStatusLabel(lang, String(r[c.key]))}
                          </span>
                        ) : c.kind === 'activity' ? (
                          r[c.key] ? activityLabel(lang, String(r[c.key])) : '—'
                        ) : c.kind === 'amount' ? (
                          r[c.key] != null ? fmtAmount(r[c.key]) : '—'
                        ) : c.kind === 'date' ? (
                          fmtDate(r[c.key])
                        ) : c.kind === 'file' ? (
                          r[c.key] ? (
                            <button
                              onClick={() => void openFile(c.bucket!, String(r[c.key]))}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-tz-blue hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              {t(lang, { sw: 'Fungua', en: 'Open' })}
                            </button>
                          ) : (
                            <span className="text-tz-black/30">—</span>
                          )
                        ) : (
                          String(r[c.key] ?? '—')
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          {updatingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-tz-black/40" />
                          ) : (
                            actions
                              .filter((a) => a.status !== r.status)
                              .map((a) => (
                                <button
                                  key={a.status}
                                  onClick={() => void setStatus(r, a.status)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${a.tone}`}
                                >
                                  {a.status === 'rejected' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                  {t(lang, a)}
                                </button>
                              ))
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
