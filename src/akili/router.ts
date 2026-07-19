// router.ts — Akili wa Kodi's router. Vendored from the shared Akili engine.
// Calls match() on every registered expert and dispatches to the highest scorer
// (ties → registration order), then awaits answer(). Robust: a throwing expert
// never crashes the router — it falls through to the next candidate / fallback.

import type { AkiliAnswer, AkiliBias, AkiliQuery, DomainExpert } from './types';
import {
  emptyMemory,
  injectContext,
  looksLikeFollowUp,
  updateMemory,
  type AkiliMemory,
} from './memory';

export interface Akili {
  ask(q: AkiliQuery | string): Promise<AkiliAnswer>;
  experts: DomainExpert[];
}

function normalize(q: AkiliQuery | string): AkiliQuery {
  if (typeof q === 'string') return { text: q, lang: 'sw' };
  return { lang: 'sw', ...q, text: q.text ?? '' };
}

function readBias(query: AkiliQuery): AkiliBias | undefined {
  const b = query.context?.bias as Partial<AkiliBias> | undefined;
  if (b && typeof b.domain === 'string' && typeof b.boost === 'number') {
    return {
      domain: b.domain as AkiliBias['domain'],
      boost: b.boost,
      floor: typeof b.floor === 'number' ? b.floor : 0,
    };
  }
  return undefined;
}

function applyBias(score: number, isPriorDomain: boolean, bias?: AkiliBias): number {
  if (!bias || !isPriorDomain) return score;
  return Math.min(1, Math.max(score + bias.boost, bias.floor));
}

function emptyRegistryAnswer(): AkiliAnswer {
  return {
    domain: 'jumla',
    expert: 'router',
    text: {
      sw: 'Samahani, hakuna mtaalamu aliyesajiliwa kwa sasa.',
      en: 'Sorry, no expert is currently registered.',
    },
    confidence: 'low',
  };
}

function fallbackExpert(experts: DomainExpert[]): DomainExpert | undefined {
  return experts.find((e) => e.domain === 'jumla') ?? experts[experts.length - 1];
}

interface Scored {
  expert: DomainExpert;
  score: number;
  order: number;
}

export function createAkili(experts: DomainExpert[] = []): Akili {
  const registry = [...experts];

  async function dispatch(query: AkiliQuery): Promise<AkiliAnswer> {
    if (registry.length === 0) return emptyRegistryAnswer();

    const bias = readBias(query);

    const scored: Scored[] = registry.map((expert, order) => {
      let score = 0;
      try {
        const s = expert.match(query);
        score = Number.isFinite(s) ? Math.max(0, Math.min(1, s)) : 0;
      } catch {
        score = 0;
      }
      score = applyBias(score, !!bias && expert.domain === bias.domain, bias);
      return { expert, score, order };
    });

    const candidates = scored
      .filter((c) => c.score > 0)
      .sort((a, b) => (b.score - a.score) || (a.order - b.order));

    const fb = fallbackExpert(registry);

    if (candidates.length === 0 || candidates[0].score <= 0.001) {
      if (fb) {
        try {
          return await fb.answer(query);
        } catch {
          return emptyRegistryAnswer();
        }
      }
      return emptyRegistryAnswer();
    }

    for (const { expert } of candidates) {
      try {
        return await expert.answer(query);
      } catch {
        // swallow and try the next candidate
      }
    }

    if (fb && !candidates.some((c) => c.expert === fb)) {
      try {
        return await fb.answer(query);
      } catch {
        /* fall through */
      }
    }
    return emptyRegistryAnswer();
  }

  return {
    experts: registry,
    ask: (q) => dispatch(normalize(q)),
  };
}

export interface AkiliExchange {
  query: AkiliQuery;
  answer: AkiliAnswer;
}

export interface AkiliSession {
  ask(q: AkiliQuery | string): Promise<AkiliAnswer>;
  history(): AkiliExchange[];
  memory(): AkiliMemory;
  reset(): void;
}

const FOLLOWUP_BOOST = 0.25;
const FOLLOWUP_FLOOR = 0.62;

export function createAkiliSession(akili: Akili, maxTurns = 8): AkiliSession {
  let exchanges: AkiliExchange[] = [];
  let mem: AkiliMemory = emptyMemory();

  return {
    async ask(q) {
      const query = normalize(q);
      const context = injectContext(
        { ...(query.context ?? {}), history: exchanges },
        mem,
      );

      if (mem.lastDomain && looksLikeFollowUp(query.text)) {
        context.bias = {
          domain: mem.lastDomain,
          boost: FOLLOWUP_BOOST,
          floor: FOLLOWUP_FLOOR,
        } satisfies AkiliBias;
      }

      const withCtx: AkiliQuery = { ...query, context };
      const answer = await akili.ask(withCtx);

      exchanges = [...exchanges, { query, answer }].slice(-maxTurns);
      mem = updateMemory(mem, query, answer, maxTurns);
      return answer;
    },
    history: () => [...exchanges],
    memory: () => mem,
    reset: () => {
      exchanges = [];
      mem = emptyMemory();
    },
  };
}
