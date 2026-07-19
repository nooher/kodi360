// experts/kodi/index.ts — Akili's Kodi (TRA / tax administration) expert.
//
// A sovereign, curated Kiswahili knowledge base covering Tanzania's tax system:
// usajili wa TIN, VAT, kodi ya makadirio (presumptive), EFD/VFD, malalamiko na
// rufaa (TRAB/TRAT), adhabu na riba, kodi ya mapato/PAYE, forodha, taasisi
// husika (BRELA/NIDA/TCRA), na huduma za kidijitali (Taxpayer Portal/GePG).
// Pure/deterministic TS — no external LLM, no network, works fully offline.
// Built for KODI360 (TRA Innovation Challenge submission) — reused here so any
// Laetoli product can embed the same sovereign tax assistant. NOT tax advice;
// every answer points the user to TRA or a registered tax consultant.

import type {
  AkiliAnswer,
  AkiliConfidence,
  AkiliQuery,
  AkiliSource,
  DomainExpert,
} from '../../types';

const STRIP = /[^\p{L}\p{N}']+/gu;
const norm = (s: string): string =>
  (s ?? '').toLowerCase().normalize('NFKC').replace(STRIP, ' ').replace(/\s+/g, ' ').trim();

function hasCue(hay: string, cue: string): boolean {
  return ` ${hay} `.includes(` ${cue} `) || hay === cue;
}

function cueScore(text: string, cues: string[], cap = 0.92): number {
  const n = norm(text);
  if (!n) return 0;
  const seen = new Set<string>();
  for (const c of cues) {
    if (hasCue(n, c)) seen.add(c);
    if (seen.size >= 3) break;
  }
  const hits = seen.size;
  if (hits === 0) return 0;
  return Math.min(cap, 0.32 + hits * 0.23);
}

const KODI_CUES = [
  // Kiswahili — core
  'kodi', 'ushuru', 'tra', 'mlipakodi', 'walipakodi', 'tin', 'nambari ya mlipakodi',
  'vat', 'ongezeko la thamani', 'makadirio', 'kodi ya makadirio', 'risiti', 'efd',
  'vfd', 'kifaa cha kielektroniki', 'pingamizi', 'malalamiko', 'rufaa', 'trab',
  'trat', 'tathmini', 'adhabu', 'faini', 'riba', 'kutolipa', 'kuchelewa kulipa',
  'paye', 'kodi ya mapato', 'mapato', 'forodha', 'ushuru wa forodha', 'brela',
  'leseni', 'usajili wa biashara', 'gepg', 'namba ya udhibiti', 'malipo ya kodi',
  'tamko la kodi', 'return', 'tathmini ya kodi', 'ukaguzi wa kodi', 'mkaguzi',
  'msamaha wa kodi', 'punguzo la kodi', 'stakabadhi',
  // English
  'tax', 'taxes', 'taxpayer', 'tin', 'vat', 'value added tax', 'presumptive tax',
  'turnover tax', 'receipt', 'fiscal device', 'objection', 'appeal', 'assessment',
  'penalty', 'interest', 'paye', 'income tax', 'customs', 'excise', 'duty',
  'business registration', 'licence', 'license', 'control number', 'tax return',
  'tax audit', 'auditor', 'tax exemption', 'tax relief', 'withholding tax',
  'digital service tax', 'e-filing', 'taxpayer portal',
];

interface KBEntry {
  id: string;
  cues: string[];
  sw: string;
  en?: string;
  sources: AkiliSource[];
}

const KB: KBEntry[] = [
  {
    id: 'tin-usajili',
    cues: ['tin', 'nambari ya mlipakodi', 'usajili', 'kujisajili', 'register', 'taxpayer', 'namba ya kodi'],
    sw:
      'Kupata TIN (Nambari ya Mlipakodi):\n' +
      '• Jisajili bila malipo kupitia Taxpayer Portal ya TRA (taxpayerportal.tra.go.tz) au kituo cha TRA kilicho karibu nawe.\n' +
      '• Mtu binafsi anahitaji kitambulisho cha NIDA; kampuni inahitaji cheti cha usajili cha BRELA kwanza.\n' +
      '• TIN ni ya lazima kabla ya kufungua akaunti benki ya biashara, kupata leseni ya biashara, au kushiriki zabuni za serikali.\n' +
      '• TIN, usajili BRELA, na leseni ya biashara ya halmashauri ni vitu VITATU tofauti — vyote vinahitajika, si mbadala wa kila kimoja.',
    en:
      'Getting a TIN (Taxpayer Identification Number):\n' +
      '• Register free via the TRA Taxpayer Portal (taxpayerportal.tra.go.tz) or your nearest TRA office.\n' +
      '• Individuals need a NIDA national ID; companies need a BRELA certificate of incorporation first.\n' +
      '• A TIN is required before opening a business bank account, getting a business licence, or bidding on government tenders.\n' +
      '• TIN, BRELA registration, and a council business licence are THREE separate things — all are needed, none replaces another.',
    sources: [
      { label: 'TRA — Taxpayer Portal', ref: 'taxpayerportal.tra.go.tz' },
      { label: 'BRELA — Wakala wa Usajili wa Biashara' },
    ],
  },
  {
    id: 'vat-usajili',
    cues: ['vat', 'ongezeko la thamani', 'usajili wa vat', 'kiwango cha vat', 'value added tax', 'vat registration', '18%'],
    sw:
      'VAT (Kodi ya Ongezeko la Thamani):\n' +
      '• Kiwango cha kawaida cha VAT ni 18%.\n' +
      '• Usajili wa LAZIMA unatakiwa mauzo ya biashara yakizidi TZS milioni 200 kwa mwaka (Tanzania Bara) au milioni 100 (Zanzibar).\n' +
      '• Ukifikisha kiwango hicho, una siku 30 kujisajili VAT tangu tarehe uliyovuka kiwango.\n' +
      '• Biashara ndogo zaidi ya kiwango zinaweza kujisajili kwa hiari (voluntary registration).\n' +
      '• Taasisi za serikali na baadhi ya makampuni ya kigeni yanayotoa huduma za kidijitali Tanzania (mfano huduma za mtandaoni kwa watumiaji) hutakiwa kujisajili VAT hata bila kufikia kiwango.',
    en:
      'VAT (Value Added Tax):\n' +
      '• The standard VAT rate is 18%.\n' +
      '• MANDATORY registration applies once annual taxable turnover exceeds TZS 200 million (Mainland) or TZS 100 million (Zanzibar).\n' +
      '• Once you cross that threshold you have 30 days to register from the date you first exceeded it.\n' +
      '• Smaller businesses below the threshold may register voluntarily.\n' +
      '• Government bodies and some non-resident digital suppliers serving Tanzanian consumers must register regardless of turnover.',
    sources: [
      { label: 'The Value Added Tax Act (Tanzania)' },
      { label: 'TRA — Value Added Tax (VAT)' },
    ],
  },
  {
    id: 'kodi-makadirio',
    cues: ['makadirio', 'kodi ya makadirio', 'presumptive', 'turnover tax', 'mauzo madogo', 'biashara ndogo kodi'],
    sw:
      'Kodi ya Makadirio (Presumptive Tax) kwa biashara ndogo:\n' +
      '• Inatumika kwa mtu binafsi mwenye biashara yenye mauzo (turnover) hadi TZS milioni 100 kwa mwaka.\n' +
      '• Badala ya kuandaa hesabu kamili za faida na hasara, unalipa kiwango kidogo kinacholingana na kiwango cha mauzo yako (bendi za mauzo, si asilimia moja tu).\n' +
      '• HAITUMIKI kwa huduma za kitaalamu/ufundi (professional, technical, management, construction, training) — hizo hulipa kodi ya kawaida ya mapato.\n' +
      '• Changamoto inayojulikana: biashara yenye faida ndogo (low margin) inaweza kulipa kiwango kikubwa zaidi kuliko biashara ya faida kubwa yenye mauzo sawa — kwa sababu kodi inategemea MAUZO si FAIDA.\n' +
      '• Pata bendi na kiwango sahihi cha mwaka husika kwenye jedwali rasmi la TRA (Taxes and Duties at a Glance).',
    en:
      'Presumptive (turnover-based) tax for small businesses:\n' +
      '• Applies to an individual whose business turnover is up to TZS 100 million per year.\n' +
      '• Instead of full profit-and-loss accounts, you pay a small fixed amount set by your turnover band.\n' +
      '• Does NOT apply to professional/technical/management/construction/training services — those pay standard income tax.\n' +
      '• Known fairness issue: a low-margin business can pay proportionally more than a high-margin one with the same turnover, because the tax is based on SALES, not PROFIT.\n' +
      '• Check the current year\'s official band table (TRA "Taxes and Duties at a Glance") for exact figures.',
    sources: [
      { label: 'Income Tax Act (Tanzania), Third Schedule' },
      { label: 'TRA — Taxes and Duties at a Glance' },
    ],
  },
  {
    id: 'efd-vfd',
    cues: ['efd', 'vfd', 'risiti', 'kifaa cha kielektroniki', 'fiscal device', 'receipt', 'stakabadhi', 'mashine ya risiti'],
    sw:
      'EFD/VFD (Vifaa vya Kielektroniki vya Kutolea Risiti):\n' +
      '• Kisheria, kila mauzo LAZIMA yatolewe risiti ya kielektroniki — ni kosa kutokutoa risiti.\n' +
      '• EFD (mashine) hugharimu zaidi ya TZS milioni 2, jambo linalolemea wafanyabiashara wadogo.\n' +
      '• VFD (Virtual Fiscal Device) ni mbadala nafuu zaidi — programu inayoweza kutumika kwenye simu/kompyuta badala ya mashine ya bei ghali.\n' +
      '• Changamoto za kawaida: kukatika kwa umeme/mtandao, gharama ya matengenezo, na ukosefu wa mafunzo kwa watumiaji.\n' +
      '• Toa risiti kwa kila mteja — hata mteja mmoja asiyepewa risiti ni ushahidi wa mauzo yasiyoripotiwa.',
    en:
      'EFD/VFD (Electronic/Virtual Fiscal Devices):\n' +
      '• By law, every sale MUST be issued an electronic receipt — failing to do so is an offence.\n' +
      '• An EFD machine costs over TZS 2 million, a real burden for small traders.\n' +
      '• A VFD (Virtual Fiscal Device) is a cheaper alternative — software on a phone/computer instead of a costly machine.\n' +
      '• Common barriers: power/network outages, maintenance cost, and lack of user training.\n' +
      '• Issue a receipt for every transaction — even one unreceipted sale is evidence of unreported income.',
    sources: [
      { label: 'TRA — Know About Electronic Fiscal Devices (EFD)' },
      { label: 'Tax Administration Act, 2015 (R.E. 2019)' },
    ],
  },
  {
    id: 'pingamizi-rufaa',
    cues: ['pingamizi', 'malalamiko', 'rufaa', 'trab', 'trat', 'tathmini', 'objection', 'appeal', 'assessment', 'kupinga kodi'],
    sw:
      'Pingamizi na Rufaa dhidi ya tathmini ya kodi:\n' +
      '• Ukipingana na tathmini ya TRA, wasilisha PINGAMIZI kwa Kamishna Mkuu ndani ya SIKU 30 tangu kupokea uamuzi, kwa maandishi na vielelezo.\n' +
      '• Pingamizi halitapokelewa mpaka ulipe kodi isiyobishaniwa AU THULUTHI MOJA (1/3) ya kodi iliyokadiriwa — kiwango kikubwa zaidi kati ya viwili hivyo (isipokuwa Kamishna Mkuu aridhie punguzo kwa sababu za msingi).\n' +
      '• Ukikosa muda, unaweza kuomba nyongeza ya muda (hadi siku 30) — ombi liwasilishwe angalau siku 7 kabla ya ukomo.\n' +
      '• Usipokubaliana na uamuzi wa pingamizi, kata rufaa Bodi ya Rufaa za Kodi (TRAB), kisha Baraza la Rufaa za Kodi (TRAT), na hatimaye Mahakama ya Rufaa.\n' +
      '• Tangu Sheria ya Fedha 2021, unaweza pia kuomba MAPATANO (mediation) na TRA badala ya njia ndefu ya mahakama — ingawa haina ukomo maalum wa muda bado.',
    en:
      'Objecting to and appealing a tax assessment:\n' +
      '• If you disagree with a TRA assessment, file a written Notice of Objection to the Commissioner General within 30 DAYS of receiving the decision, with supporting evidence.\n' +
      '• The objection is not admitted until you pay the undisputed tax OR ONE-THIRD (1/3) of the assessed tax, whichever is greater (unless the Commissioner General grants a waiver for good reason).\n' +
      '• Missed the deadline? You can request an extension (up to 30 more days) — apply at least 7 days before the deadline expires.\n' +
      '• If you disagree with the objection decision, appeal to the Tax Revenue Appeals Board (TRAB), then the Tax Revenue Appeals Tribunal (TRAT), and finally the Court of Appeal.\n' +
      '• Since the 2021 Finance Act you can also request MEDIATION with TRA instead of the long court route — though it still has no fixed statutory timeline.',
    sources: [
      { label: 'Tax Administration Act, 2015 (R.E. 2019)' },
      { label: 'TRA — Objections & Appeals' },
      { label: 'Tax Revenue Appeals Board (TRAB)' },
    ],
  },
  {
    id: 'adhabu-riba',
    cues: ['adhabu', 'faini', 'riba', 'kutolipa', 'kuchelewa', 'penalty', 'interest', 'late payment', 'kuchelewa kulipa'],
    sw:
      'Adhabu na riba kwa kuchelewa kulipa/kutamka kodi:\n' +
      '• Kutotamka (kuwasilisha return) au kutolipa kodi kwa wakati kunapelekea FAINI na RIBA juu ya kiasi kinachodaiwa.\n' +
      '• Riba huongezeka kila mwezi kadiri deni linavyoendelea — deni dogo linaweza kukua haraka.\n' +
      '• Kuwasilisha return kwa wakati hata kama huna uwezo wa kulipa mara moja ni bora zaidi ya kutowasilisha kabisa — unaweza kuomba mpango wa malipo (payment plan) na TRA.\n' +
      '• Rekodi safi na malipo ya wakati ndiyo njia rahisi zaidi ya kuepuka adhabu.',
    en:
      'Penalties and interest for late payment/filing:\n' +
      '• Failing to file a return or pay tax on time triggers PENALTIES and INTEREST on the amount owed.\n' +
      '• Interest accrues monthly on the outstanding balance — a small debt can grow quickly.\n' +
      '• Filing on time even if you can\'t pay in full immediately is better than not filing at all — you can request a payment plan with TRA.\n' +
      '• Clean records and on-time payment are the simplest way to avoid penalties.',
    sources: [{ label: 'Tax Administration Act, 2015 (R.E. 2019)' }],
  },
  {
    id: 'kodi-mapato-paye',
    cues: ['paye', 'kodi ya mapato', 'mshahara', 'income tax', 'employee tax', 'mapato ya ajira', 'kodi ya kampuni', 'corporate tax'],
    sw:
      'Kodi ya Mapato (Kampuni) na PAYE (Wafanyakazi):\n' +
      '• Kampuni zinalipa kodi ya mapato juu ya faida halisi (mapato − gharama halali), kwa kiwango cha kawaida cha ushirika.\n' +
      '• PAYE (Pay As You Earn) ni kodi ya mshahara inayokatwa na mwajiri moja kwa moja kutoka mshahara wa mfanyakazi kila mwezi, kwa bendi za viwango vinavyopanda kadiri mshahara unavyoongezeka.\n' +
      '• Mwajiri ndiye mwenye wajibu wa kukata na kuwasilisha PAYE TRA — mfanyakazi hahitaji kuwasilisha mwenyewe kwa kawaida.\n' +
      '• Watu binafsi wenye vyanzo vingine vya mapato (mfano kodi ya nyumba, biashara ya ziada) huenda wakahitaji kutamka mapato hayo tofauti.',
    en:
      'Corporate Income Tax and PAYE (employees):\n' +
      '• Companies pay income tax on actual profit (income minus allowable expenses), at the standard corporate rate.\n' +
      '• PAYE (Pay As You Earn) is salary tax withheld directly by the employer each month, on a rising scale of bands as salary increases.\n' +
      '• The employer is responsible for withholding and remitting PAYE to TRA — employees don\'t normally file it themselves.\n' +
      '• Individuals with other income sources (e.g. rental income, side business) may need to declare that income separately.',
    sources: [{ label: 'Income Tax Act (Tanzania)' }],
  },
  {
    id: 'forodha-ushuru',
    cues: ['forodha', 'ushuru wa forodha', 'customs', 'excise', 'duty', 'kuagiza bidhaa', 'import', 'export'],
    sw:
      'Ushuru wa Forodha na Bidhaa Maalum (Excise):\n' +
      '• Bidhaa zinazoingizwa nchini hutozwa ushuru wa forodha kulingana na Jedwali la Pamoja la Ushuru la Jumuiya ya Afrika Mashariki (EAC Common External Tariff).\n' +
      '• Baadhi ya bidhaa (mfano vinywaji, sigara, mafuta) hutozwa ziada ya "excise duty" juu ya ushuru wa kawaida.\n' +
      '• Wafanyabiashara wa kuagiza/kuuza nje wanahitaji TIN na usajili maalum wa forodha (ASYCUDA) kabla ya kufanya biashara ya kimataifa.',
    en:
      'Customs Duty and Excise:\n' +
      '• Imported goods are taxed under the East African Community Common External Tariff (EAC CET).\n' +
      '• Certain goods (e.g. beverages, cigarettes, fuel) carry an additional excise duty on top of standard customs duty.\n' +
      '• Import/export traders need a TIN and a customs registration (ASYCUDA) before trading internationally.',
    sources: [{ label: 'East African Community Customs Management Act' }, { label: 'TRA — Customs & Excise' }],
  },
  {
    id: 'taasisi-husika',
    cues: ['brela', 'nida', 'tcra', 'leseni', 'usajili wa biashara', 'business registration', 'licence', 'taasisi', 'halmashauri'],
    sw:
      'Taasisi husika mbali na TRA:\n' +
      '• BRELA — usajili wa jina la biashara/kampuni (unahitajika kabla ya TIN kwa makampuni).\n' +
      '• NIDA — kitambulisho cha taifa, kinachohitajika kusajili TIN ya mtu binafsi.\n' +
      '• Halmashauri (Local Government Authority) — leseni ya biashara na kodi za huduma za mtaa, tofauti na kodi za TRA.\n' +
      '• TCRA — inasimamia mawasiliano na huduma za pesa za simu zinazotumika kulipia kodi.\n' +
      '• Zanzibar Revenue Board (ZRB) — inasimamia kodi za Zanzibar kwa baadhi ya maeneo yasiyo ya muungano, sambamba na TRA.\n' +
      'Fahamu: mfanyabiashara anaweza kuhitaji taasisi zote hizi kwa nyakati tofauti — si TRA pekee.',
    en:
      'Related institutions beyond TRA:\n' +
      '• BRELA — business/company name registration (required before a company can get a TIN).\n' +
      '• NIDA — national ID, required to register an individual TIN.\n' +
      '• Local Government Authority (Halmashauri) — business licence and local service levies, separate from TRA taxes.\n' +
      '• TCRA — regulates telecoms and the mobile-money rails used to pay taxes.\n' +
      '• Zanzibar Revenue Board (ZRB) — administers Zanzibar\'s non-union taxes alongside TRA.\n' +
      'A business may need all of these institutions at different points — not TRA alone.',
    sources: [
      { label: 'BRELA — Wakala wa Usajili wa Biashara' },
      { label: 'NIDA — Mamlaka ya Vitambulisho vya Taifa' },
      { label: 'TCRA — Mamlaka ya Mawasiliano Tanzania' },
      { label: 'Zanzibar Revenue Board (ZRB)' },
    ],
  },
  {
    id: 'huduma-kidijitali',
    cues: ['gepg', 'namba ya udhibiti', 'control number', 'taxpayer portal', 'huduma za kidijitali', 'e-filing', 'malipo ya kodi mtandaoni', 'app ya tra'],
    sw:
      'Huduma za kidijitali za TRA:\n' +
      '• Taxpayer Portal (taxpayerportal.tra.go.tz) — kuwasilisha tamko (return), kupata namba ya udhibiti (control number), kusimamia EFD/VFD, na kufuatilia marejesho ya kodi.\n' +
      '• Malipo hufanyika kupitia GePG (Serikali ya Mtandaoni ya Malipo) — benki, pesa za simu (M-Pesa/Tigo Pesa/Airtel Money), au wakala.\n' +
      '• "TRA Services" app (Google Play) inaruhusu huduma nyingi kufanyika kwa simu bila kuhitaji kompyuta.\n' +
      '• Digital Service Tax inatumika kwa makampuni ya kigeni yanayotoa huduma za kidijitali (mfano matangazo mtandaoni, programu) kwa watumiaji Tanzania.',
    en:
      'TRA digital services:\n' +
      '• Taxpayer Portal (taxpayerportal.tra.go.tz) — file returns, generate a control number, manage EFD/VFD, and track refunds.\n' +
      '• Payments go through GePG (Government e-Payment Gateway) — bank, mobile money (M-Pesa/Tigo Pesa/Airtel Money), or an agent.\n' +
      '• The "TRA Services" app (Google Play) lets many services run entirely from a phone.\n' +
      '• Digital Service Tax applies to foreign companies providing digital services (e.g. online ads, apps) to users in Tanzania.',
    sources: [
      { label: 'TRA — Taxpayer Portal' },
      { label: 'GePG — Government e-Payment Gateway' },
      { label: 'TRA — Digital Service Tax' },
    ],
  },
];

const DISCLAIMER_SW =
  'Kumbuka: haya ni maelezo ya jumla kwa elimu tu — SI ushauri rasmi wa kodi. ' +
  'Kwa uamuzi mahususi, wasiliana na TRA au mshauri wa kodi aliyesajiliwa.';
const DISCLAIMER_EN =
  'Note: this is general information for education only — NOT formal tax advice. ' +
  'For specific decisions, consult TRA or a registered tax consultant.';

function tokens(s: string): string[] {
  return norm(s).split(' ').filter(Boolean);
}

function score(entry: KBEntry, qTokens: string[], qNorm: string): number {
  let s = 0;
  for (const c of entry.cues) {
    if (hasCue(qNorm, c)) s += 2;
    else if (qTokens.includes(c)) s += 1;
  }
  return s;
}

function bestEntry(text: string): { entry: KBEntry; score: number } {
  const qNorm = norm(text);
  const qTokens = tokens(text);
  let best = KB[0];
  let bestScore = -1;
  for (const e of KB) {
    const s = score(e, qTokens, qNorm);
    if (s > bestScore) {
      best = e;
      bestScore = s;
    }
  }
  return { entry: best, score: bestScore };
}

export const kodiExpert: DomainExpert = {
  id: 'kodi-tra-msingi',
  domain: 'kodi',
  label: 'Kodi',

  match(q: AkiliQuery): number {
    return cueScore(q.text ?? '', KODI_CUES);
  },

  answer(q: AkiliQuery): AkiliAnswer {
    const { entry, score: s } = bestEntry(q.text ?? '');
    const confidence: AkiliConfidence = s >= 4 ? 'high' : s >= 2 ? 'medium' : 'low';

    const sw = `${entry.sw}\n\n${DISCLAIMER_SW}`;
    const en = entry.en ? `${entry.en}\n\n${DISCLAIMER_EN}` : undefined;

    return {
      domain: 'kodi',
      expert: kodiExpert.id,
      text: en ? { sw, en } : { sw },
      confidence,
      sources: [...entry.sources, { label: 'Akili KB — Kodi', ref: 'Laetoli · KODI360' }],
      data: { entry: entry.id, score: s },
    };
  },
};

export default kodiExpert;
