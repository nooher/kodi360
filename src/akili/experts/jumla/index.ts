// experts/jumla/index.ts — the general / about / fallback expert for Akili wa
// Kodi. A small sovereign KB: greetings, "what can you do", and a graceful
// catch-all. Scores low (~0.05) so it only wins when kodi doesn't match.

import type { AkiliAnswer, AkiliQuery, DomainExpert } from '../../types';

const norm = (s: string) => s.toLowerCase().trim();

const RX_GREETING =
  /\b(habari|jambo|salama|salamu|mambo|shikamoo|hujambo|hello|hi|hey|niaje|vipi)\b/i;
const RX_ABOUT =
  /\b(akili wa kodi ni nini|wewe ni nani|unaweza nini|unaweza kufanya nini|what can you do|who are you|nisaidie|help|msaada)\b/i;

function reply(sw: string, en: string, confidence: AkiliAnswer['confidence']): AkiliAnswer {
  return {
    domain: 'jumla',
    expert: jumlaExpert.id,
    text: { sw, en },
    confidence,
    sources: [{ label: 'Akili wa Kodi — KODI360' }],
  };
}

const ABOUT_SW =
  'Mimi ni Akili wa Kodi — msaidizi wa kodi wa KODI360, ninayefanya kazi bila mtandao ' +
  '(sovereign, bila LLM ya nje). Ninaweza kukusaidia na:\n' +
  '• Usajili wa TIN, VAT, na kodi ya makadirio\n' +
  '• EFD/VFD na risiti za kielektroniki\n' +
  '• Pingamizi na rufaa dhidi ya tathmini ya kodi\n' +
  '• Adhabu, riba, PAYE, forodha, na taasisi husika (BRELA/NIDA/TCRA)\n' +
  '• Kodi ya zuio (WHT), stempu, SDL, cheti cha kodi, kodi ya kupangisha, faida ya mtaji\n' +
  '• Ukaguzi wa kodi, kuripoti rushwa, kodi Zanzibar, na e-invoicing\n' +
  'Niulize chochote kuhusu kodi.';

const ABOUT_EN =
  "I am Akili wa Kodi — KODI360's tax assistant, running fully offline (no external LLM). " +
  'I can help with:\n' +
  '• TIN registration, VAT, and presumptive tax\n' +
  '• EFD/VFD and electronic receipts\n' +
  '• Objections and appeals against a tax assessment\n' +
  '• Penalties, interest, PAYE, customs, and related institutions (BRELA/NIDA/TCRA)\n' +
  '• Withholding tax (WHT), stamp duty, SDL, tax clearance, rental income, capital gains\n' +
  '• Tax audits, reporting corruption, Zanzibar taxes, and e-invoicing\n' +
  'Ask me anything about tax.';

export const jumlaExpert: DomainExpert = {
  id: 'jumla-kodi',
  domain: 'jumla',
  label: 'Jumla',

  match(q: AkiliQuery): number {
    const text = q.text ?? '';
    if (!text.trim()) return 0.05;
    if (RX_GREETING.test(text)) return 0.6;
    if (RX_ABOUT.test(text)) return 0.55;
    return 0.05;
  },

  answer(q: AkiliQuery): AkiliAnswer {
    const text = q.text ?? '';
    const low = norm(text);

    if (RX_GREETING.test(low)) {
      return reply(
        'Habari! Mimi ni Akili wa Kodi. Niulize kuhusu TIN, VAT, EFD, pingamizi, au kodi ya makadirio.',
        'Hello! I am Akili wa Kodi. Ask me about TIN, VAT, EFD, objections, or presumptive tax.',
        'high',
      );
    }

    if (RX_ABOUT.test(low)) {
      return reply(ABOUT_SW, ABOUT_EN, 'high');
    }

    return reply(
      'Samahani, sijaelewa vizuri. Jaribu kuuliza kuhusu TIN, VAT, EFD/risiti, pingamizi/rufaa, ' +
        'au kodi ya makadirio kwa maneno tofauti.',
      'Sorry, I did not quite understand. Try asking about TIN, VAT, EFD/receipts, ' +
        'objections/appeals, or presumptive tax, phrased differently.',
      'low',
    );
  },
};

export default jumlaExpert;
