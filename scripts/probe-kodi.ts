// scripts/probe-kodi.ts — diagnostic battery for Akili wa Kodi's coverage.
// Run: npx tsx scripts/probe-kodi.ts
// Prints each question's routed expert/entry/confidence so gaps are visible
// before deciding what to add to the KB. Not a test file — a coverage probe.

import { akili } from '../src/akili';

interface Probe {
  category: string;
  text: string;
}

const PROBES: Probe[] = [
  // ── covered topics, various phrasings (sanity check) ──────────────────────
  { category: 'TIN', text: 'Nisajilije TIN?' },
  { category: 'TIN', text: 'how do I get a taxpayer identification number' },
  { category: 'TIN', text: 'naitaji tin ila sina kampuni, naweza?' },
  { category: 'VAT', text: 'VAT ni asilimia ngapi' },
  { category: 'VAT', text: 'ni lini nasajili VAT' },
  { category: 'VAT', text: 'mauzo yangu ni milioni 250, nahitaji vat?' },
  { category: 'Presumptive', text: 'kodi ya makadirio ni nini' },
  { category: 'Presumptive', text: 'presumptive tax for a small shop' },
  { category: 'EFD', text: 'bei ya efd' },
  { category: 'EFD', text: 'tofauti ya efd na vfd' },
  { category: 'Objection', text: 'nataka kupinga tathmini ya kodi' },
  { category: 'Objection', text: 'muda wa kuwasilisha pingamizi ni siku ngapi' },
  { category: 'Penalty', text: 'nikichelewa kulipa kodi nitapata faini?' },
  { category: 'PAYE', text: 'paye inakatwaje kwenye mshahara' },
  { category: 'Customs', text: 'ushuru wa forodha ni kiasi gani' },
  { category: 'Institutions', text: 'brela na tra ni kitu kimoja?' },
  { category: 'Digital', text: 'namba ya udhibiti napataje' },

  // ── likely gaps: newer/less common but real FAQ topics ─────────────────────
  { category: 'WHT', text: 'kodi ya zuio ni nini' },
  { category: 'WHT', text: 'withholding tax rate on rent' },
  { category: 'Stamp duty', text: 'stamp duty ni nini kwa mkataba wa pango' },
  { category: 'SDL', text: 'skills development levy ni asilimia ngapi' },
  { category: 'SDL', text: 'SDL' },
  { category: 'Tax clearance', text: 'cheti cha kutokuwa na deni la kodi napataje' },
  { category: 'Tax clearance', text: 'tax clearance certificate' },
  { category: 'Refunds', text: 'marejesho ya vat yanachukua muda gani' },
  { category: 'Local levies', text: 'kodi ya huduma ya halmashauri' },
  { category: 'Zanzibar', text: 'kodi zanzibar zinatofautianaje na bara' },
  { category: 'Mediation', text: 'naomba mapatano na tra badala ya mahakama' },
  { category: 'Audit', text: 'tra wananikagua, nifanye nini' },
  { category: 'Rental income', text: 'kodi ya nyumba ninayopangisha' },
  { category: 'Capital gains', text: 'nikiuza kiwanja nalipa kodi gani' },
  { category: 'Motor vehicle', text: 'leseni ya barabara gari' },
  { category: 'Amnesty', text: 'msamaha wa adhabu za kodi' },
  { category: 'Corruption', text: 'afisa wa tra ananiomba rushwa nifanye nini' },
  { category: 'DST', text: 'naeza facebook ads kodi yake' },
  { category: 'Enforcement', text: 'tra wamefunga akaunti yangu ya benki' },
  { category: 'VAT dereg', text: 'nataka kujitoa kwenye vat' },
  { category: 'e-invoicing', text: 'e-invoicing ni nini' },

  // ── greetings / fallback sanity ─────────────────────────────────────────────
  { category: 'Greeting', text: 'habari' },
  { category: 'About', text: 'unaweza nini' },
  { category: 'Off-topic', text: 'dalili za malaria ni zipi' },
  { category: 'Empty', text: '' },
];

async function main() {
  console.log('category\tconfidence\texpert\ttext\tanswer_preview');
  for (const p of PROBES) {
    const a = await akili.ask({ text: p.text, lang: 'sw' });
    const preview = a.text.sw.replace(/\n/g, ' ').slice(0, 70);
    console.log(`${p.category}\t${a.confidence}\t${a.expert}\t${JSON.stringify(p.text)}\t${preview}`);
  }
}

main();
