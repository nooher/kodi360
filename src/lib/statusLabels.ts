// statusLabels.ts — every raw status/enum value the app stores in English
// (database check-constraints, health-check words, activity codes) gets a
// bilingual label here, so nothing shown to the user is ever a mix of
// languages depending on which toggle is active.

import type { Lang } from './i18n';

type Pair = { sw: string; en: string };

function pick(lang: Lang, pair: Pair | undefined, fallback: string): string {
  if (!pair) return fallback;
  return lang === 'sw' ? pair.sw : pair.en;
}

const SYSTEM_HEALTH: Record<string, Pair> = {
  healthy: { sw: 'Nzuri', en: 'Healthy' },
  degraded: { sw: 'Dhaifu', en: 'Degraded' },
  unhealthy: { sw: 'Mbaya', en: 'Unhealthy' },
};

const UP_DOWN: Record<string, Pair> = {
  up: { sw: 'Inafanya kazi', en: 'Up' },
  down: { sw: 'Imesimama', en: 'Down' },
};

const ACTIVE_INACTIVE: Record<string, Pair> = {
  active: { sw: 'Inafanya kazi', en: 'Active' },
  inactive: { sw: 'Haifanyi kazi', en: 'Inactive' },
};

const REGISTRATION_STATUS: Record<string, Pair> = {
  pending: { sw: 'Inasubiri ukaguzi', en: 'Awaiting review' },
  reviewed: { sw: 'Imekaguliwa', en: 'Reviewed' },
  tin_issued: { sw: 'TIN imetolewa', en: 'TIN issued' },
  rejected: { sw: 'Imekataliwa', en: 'Rejected' },
};

const DISPUTE_STATUS: Record<string, Pair> = {
  filed: { sw: 'Imewasilishwa', en: 'Filed' },
  under_review: { sw: 'Inashughulikiwa', en: 'Under review' },
  resolved: { sw: 'Imemalizika', en: 'Resolved' },
};

const ACTIVITY: Record<string, Pair> = {
  mama_lishe: { sw: 'Mama lishe / chakula', en: 'Food vendor' },
  duka: { sw: 'Duka la rejareja', en: 'Retail shop' },
  machinga: { sw: 'Machinga / muuza mtaani', en: 'Street vendor' },
  fundi: { sw: 'Fundi / huduma', en: 'Artisan / service' },
  nyingine: { sw: 'Nyingine', en: 'Other' },
};

const ERROR_TYPE: Record<string, Pair> = {
  error: { sw: 'Kosa', en: 'Error' },
  unhandledrejection: { sw: 'Kosa la ahadi (promise)', en: 'Unhandled rejection' },
  component: { sw: 'Kosa la sehemu (component)', en: 'Component error' },
};

export const healthStatusLabel = (lang: Lang, v: string) => pick(lang, SYSTEM_HEALTH[v], v);
export const upDownLabel = (lang: Lang, v: string) => pick(lang, UP_DOWN[v], v);
export const activeInactiveLabel = (lang: Lang, v: string) => pick(lang, ACTIVE_INACTIVE[v], v);
export const registrationStatusLabel = (lang: Lang, v: string) => pick(lang, REGISTRATION_STATUS[v], v);
export const disputeStatusLabel = (lang: Lang, v: string) => pick(lang, DISPUTE_STATUS[v], v);
export const activityLabel = (lang: Lang, v: string) => pick(lang, ACTIVITY[v], v);
export const errorTypeLabel = (lang: Lang, v: string) => pick(lang, ERROR_TYPE[v], v);

/** Any status value across registrations/disputes, resolved without knowing which table it came from. */
export function anyStatusLabel(lang: Lang, v: string): string {
  return pick(lang, REGISTRATION_STATUS[v] ?? DISPUTE_STATUS[v], v);
}
