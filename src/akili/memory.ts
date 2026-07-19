// memory.ts — Akili wa Kodi's sovereign multi-turn conversation memory.
// Deterministic, offline, zero-dependency. Vendored from the shared Akili engine.

import type { AkiliAnswer, AkiliDomain, AkiliQuery } from './types';

export interface AkiliTurn {
  domain: AkiliDomain;
  expert: string;
  text: string;
  topic?: string;
}

export interface AkiliMemory {
  lastDomain?: AkiliDomain;
  lastExpert?: string;
  lastTopic?: string;
  entities: Record<string, string>;
  recentTurns: AkiliTurn[];
}

export function emptyMemory(): AkiliMemory {
  return { entities: {}, recentTurns: [] };
}

const ANAPHORA_CUES = [
  'yake', 'yao', 'lake', 'wake', 'zake', 'hiyo', 'hilo', 'huo', 'hizo', 'hizi',
  'hapo', 'huko', 'pale', 'hapohapo',
  'vipi kuhusu', 'je kuhusu', 'na je', 'na vipi', 'sasa je', 'kuhusu hilo',
  'there', 'that', 'it', 'its', 'them', 'those', 'what about', 'how about',
  'and the', 'and its', 'and that', 'same', 'then',
];

const STRIP = /[^\p{L}\p{N}']+/gu;

export function normalizeText(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(STRIP, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasCue(paddedHay: string, cue: string): boolean {
  return paddedHay.includes(` ${cue} `);
}

export function looksLikeFollowUp(text: string): boolean {
  const n = normalizeText(text);
  if (!n) return false;
  const words = n.split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 8) return false;
  const padded = ` ${n} `;
  return ANAPHORA_CUES.some((c) => hasCue(padded, c));
}

function absorb(out: Record<string, string>, ents: unknown): void {
  if (!ents || typeof ents !== 'object') return;
  for (const [k, v] of Object.entries(ents as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) out[k] = v;
    else if (typeof v === 'number') out[k] = String(v);
  }
}

function topicFromAnswer(answer: AkiliAnswer): string | undefined {
  const data = answer.data;
  if (data && typeof data === 'object') {
    const t = (data as Record<string, unknown>).topic;
    if (typeof t === 'string' && t.trim()) return t;
  }
  return undefined;
}

function entitiesFromAnswer(answer: AkiliAnswer): Record<string, string> {
  const out: Record<string, string> = {};
  const data = answer.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    absorb(out, d.entities);
  }
  const topic = topicFromAnswer(answer);
  if (topic) out.topic = topic;
  return out;
}

export function updateMemory(
  prev: AkiliMemory,
  query: AkiliQuery,
  answer: AkiliAnswer,
  maxTurns = 8,
): AkiliMemory {
  const merged = { ...prev.entities, ...entitiesFromAnswer(answer) };
  const topic = topicFromAnswer(answer);
  const turn: AkiliTurn = {
    domain: answer.domain,
    expert: answer.expert,
    text: (query.text ?? '').trim(),
    ...(topic ? { topic } : {}),
  };
  return {
    lastDomain: answer.domain,
    lastExpert: answer.expert,
    ...(topic ? { lastTopic: topic } : {}),
    entities: merged,
    recentTurns: [...prev.recentTurns, turn].slice(-maxTurns),
  };
}

export function injectContext(
  base: Record<string, unknown> | undefined,
  memory: AkiliMemory,
): Record<string, unknown> {
  const ctx: Record<string, unknown> = { ...(base ?? {}) };
  ctx.memory = {
    lastDomain: memory.lastDomain,
    lastExpert: memory.lastExpert,
    lastTopic: memory.lastTopic,
    entities: memory.entities,
    recentTurns: memory.recentTurns,
  };
  return ctx;
}
