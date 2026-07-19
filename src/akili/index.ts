// index.ts — Akili wa Kodi's public API for KODI360. Vendored + trimmed from
// the shared Laetoli Akili engine: sovereign, offline, deterministic — no
// external LLM, no network required.

import { createAkili, createAkiliSession } from './router';
import type { Akili } from './router';
import { kodiExpert } from './experts/kodi';
import { jumlaExpert } from './experts/jumla';
import type { AkiliAnswer, AkiliQuery, DomainExpert } from './types';

export const defaultExperts: DomainExpert[] = [kodiExpert, jumlaExpert];

export const akili: Akili = createAkili(defaultExperts);

export function askAkili(q: AkiliQuery | string): Promise<AkiliAnswer> {
  return akili.ask(q);
}

export { createAkili, createAkiliSession };
export type { Akili, AkiliExchange, AkiliSession } from './router';
export { kodiExpert } from './experts/kodi';
export { jumlaExpert } from './experts/jumla';
export * from './types';
