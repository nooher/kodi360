// traderIdentity.ts — maps a trader's NIDA/TIN number to the synthetic email
// Supabase Auth requires. No live NIDA/TRA verification API exists yet, so
// this is a self-declared identifier at this stage — the same trust model as
// the phone number it replaces, but a durable, meaningful identity key and
// the natural integration point once a real NIDA/TRA connection exists.

import type { TraderIdType } from '../types';

// Supabase Auth's server-side validator rejects reserved/special-use TLDs
// (.internal, .invalid, .test) with `email_address_invalid` — a real ccTLD is
// required even though no mail is ever sent (mailer_autoconfirm is on for
// this project, so GoTrue never attempts delivery to this address).
const EMAIL_DOMAIN = 'traders.kodi360.tz';

/** Normalize an ID number for consistent lookups: strip spaces/dashes, lowercase. */
export function normalizeIdNumber(idNumber: string): string {
  return idNumber.replace(/[\s-]+/g, '').toLowerCase();
}

/** Build the synthetic Supabase Auth email for a given NIDA/TIN identity. */
export function traderEmail(idType: TraderIdType, idNumber: string): string {
  return `${idType}-${normalizeIdNumber(idNumber)}@${EMAIL_DOMAIN}`;
}

export function isValidNida(idNumber: string): boolean {
  // NIDA (NIN) numbers are 20 digits.
  return /^\d{20}$/.test(normalizeIdNumber(idNumber));
}

export function isValidTin(idNumber: string): boolean {
  // TRA TIN: 9 digits for a business/entity, 10 digits for an individual.
  return /^\d{9,10}$/.test(normalizeIdNumber(idNumber));
}
