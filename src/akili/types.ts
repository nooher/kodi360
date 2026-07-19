// types.ts — Akili wa Kodi's contract. Vendored from Laetoli's shared Akili
// engine (see nooher/akili), trimmed to the domains KODI360 needs. Sovereign by
// design: every expert is pure, deterministic TS — no external LLM, no network,
// so the assistant works fully offline on a trader's phone.

/** Languages Akili wa Kodi understands + answers in. */
export type AkiliLang = 'sw' | 'en';

/** Knowledge domains this vendored instance routes across. */
export type AkiliDomain =
  | 'kodi' //  tax administration (TRA)
  | 'jumla'; // general / about / fallback

export type AkiliConfidence = 'high' | 'medium' | 'low';

export interface AkiliQuery {
  text: string;
  lang?: AkiliLang;
  context?: Record<string, unknown>;
}

export interface AkiliBias {
  domain: AkiliDomain;
  boost: number;
  floor: number;
}

export interface AkiliSource {
  label: string;
  ref?: string;
}

export interface AkiliAnswer {
  domain: AkiliDomain;
  expert: string;
  text: { sw: string; en?: string };
  confidence: AkiliConfidence;
  sources?: AkiliSource[];
  data?: unknown;
}

export interface DomainExpert {
  id: string;
  domain: AkiliDomain;
  label: string;
  match(q: AkiliQuery): number;
  answer(q: AkiliQuery): AkiliAnswer | Promise<AkiliAnswer>;
}
