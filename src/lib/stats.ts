// stats.ts — the sourced research figures behind KODI360's design. Kept in one
// place so every page cites the same numbers. See README.md for full sources.

export interface StatCard {
  value: string;
  label: { sw: string; en: string };
  source: string;
}

export const TAX_BASE_STATS: StatCard[] = [
  {
    value: '12.9%',
    label: {
      sw: 'Uwiano wa kodi kwa Pato la Taifa (chini ya wastani wa Afrika Mashariki/Kusini mwa Jangwa la Sahara wa 16%)',
      en: 'Tax-to-GDP ratio (below the Sub-Saharan Africa average of 16%)',
    },
    source: 'TICGL, 2026',
  },
  {
    value: '45–65%',
    label: {
      sw: 'Ya Pato la Taifa linalozalishwa kwenye sekta isiyo rasmi — nje ya wigo wa kodi',
      en: 'Of GDP generated in the informal economy — outside the tax net',
    },
    source: 'TICGL, 2025–2026',
  },
  {
    value: 'TZS trilioni 14.1',
    label: {
      sw: 'Kodi inayokadiriwa kupotea kila mwaka (karibu 45% ya makusanyo halisi)',
      en: 'Estimated annual tax leakage (nearly 45% of actual collections)',
    },
    source: 'TICGL, 2025',
  },
  {
    value: '289',
    label: {
      sw: 'Kesi zilizosalia bila kuamuliwa TRAB katika mwaka mmoja uliochunguzwa (436 ziliwasilishwa, 147 tu zikaamuliwa)',
      en: 'Cases left pending at TRAB in one sampled year (436 filed, only 147 decided)',
    },
    source: 'IJSRA tax dispute study, 2026',
  },
  {
    value: '16.7%',
    label: {
      sw: 'Wananchi wanaoamini maafisa wengi/wote wa TRA ni wala rushwa (2024)',
      en: 'Citizens who perceive most/all TRA officials as corrupt (2024)',
    },
    source: 'Afrobarometer via U4/Transparency International',
  },
  {
    value: 'TZS milioni 2+',
    label: {
      sw: 'Gharama ya awali ya mashine ya EFD — mzigo kwa wafanyabiashara wadogo',
      en: 'Upfront cost of an EFD machine — a real burden for small traders',
    },
    source: 'IJSSRR / IGC EFD studies',
  },
];
