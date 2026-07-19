// kadirio.ts — Kadirio's estimation logic: a margin-aware alternative to a pure
// turnover-based presumptive tax estimate. Pure functions, fully unit-testable.
//
// IMPORTANT: the band amounts below are ILLUSTRATIVE, shaped to match the
// publicly known structure of Tanzania's presumptive tax (progressive, capped at
// TZS 100M annual turnover, excluding professional/technical/construction
// services) — NOT the official current-year figures. Kadirio's contribution is
// the FAIRNESS lens (tax as % of profit, not just turnover), which holds
// regardless of which year's exact band table TRA publishes. Every result links
// back to "Taxes and Duties at a Glance" for the authoritative numbers.

export interface PresumptiveBand {
  minTurnover: number;
  maxTurnover: number | null; // null = no upper bound within this band set
  /** Illustrative flat annual tax for this band, in TZS. */
  illustrativeTax: number;
}

/** Illustrative bands only — see file header. Amounts in TZS, annual turnover. */
export const ILLUSTRATIVE_BANDS: PresumptiveBand[] = [
  { minTurnover: 0, maxTurnover: 4_000_000, illustrativeTax: 0 },
  { minTurnover: 4_000_000, maxTurnover: 7_500_000, illustrativeTax: 100_000 },
  { minTurnover: 7_500_000, maxTurnover: 11_500_000, illustrativeTax: 250_000 },
  { minTurnover: 11_500_000, maxTurnover: 16_000_000, illustrativeTax: 450_000 },
  { minTurnover: 16_000_000, maxTurnover: 20_000_000, illustrativeTax: 695_000 },
  { minTurnover: 20_000_000, maxTurnover: 100_000_000, illustrativeTax: 0 }, // computed as % below
];

const TOP_BAND_RATE = 0.028; // ≈2.8% of turnover for the 20M–100M band, illustrative

export const PRESUMPTIVE_CEILING = 100_000_000;

const EXCLUDED_ACTIVITIES = new Set([
  'professional', 'technical', 'management', 'construction', 'training',
]);

export type BusinessActivity =
  | 'general' | 'retail' | 'services'
  | 'professional' | 'technical' | 'management' | 'construction' | 'training';

export interface KadirioInput {
  annualTurnover: number;
  annualExpenses: number;
  activity: BusinessActivity;
}

export interface KadirioResult {
  eligible: boolean;
  ineligibleReason?: 'over-ceiling' | 'excluded-activity';
  profit: number;
  marginPct: number;
  presumptiveTax: number;
  taxAsPctOfTurnover: number;
  taxAsPctOfProfit: number;
  fairnessNote: 'low-margin-burden' | 'balanced' | 'high-margin-light';
}

/** Illustrative presumptive tax for a given annual turnover, per the band table. */
export function presumptiveTaxFor(turnover: number): number {
  if (turnover <= 0) return 0;
  const band = ILLUSTRATIVE_BANDS.find(
    (b) => turnover >= b.minTurnover && (b.maxTurnover === null || turnover < b.maxTurnover),
  );
  if (!band) return 0;
  if (band.minTurnover === 20_000_000) return Math.round(turnover * TOP_BAND_RATE);
  return band.illustrativeTax;
}

export function estimateKadirio(input: KadirioInput): KadirioResult {
  const { annualTurnover, annualExpenses, activity } = input;
  const profit = Math.max(0, annualTurnover - annualExpenses);
  const marginPct = annualTurnover > 0 ? (profit / annualTurnover) * 100 : 0;

  if (EXCLUDED_ACTIVITIES.has(activity)) {
    return {
      eligible: false,
      ineligibleReason: 'excluded-activity',
      profit,
      marginPct,
      presumptiveTax: 0,
      taxAsPctOfTurnover: 0,
      taxAsPctOfProfit: 0,
      fairnessNote: 'balanced',
    };
  }

  if (annualTurnover > PRESUMPTIVE_CEILING) {
    return {
      eligible: false,
      ineligibleReason: 'over-ceiling',
      profit,
      marginPct,
      presumptiveTax: 0,
      taxAsPctOfTurnover: 0,
      taxAsPctOfProfit: 0,
      fairnessNote: 'balanced',
    };
  }

  const presumptiveTax = presumptiveTaxFor(annualTurnover);
  const taxAsPctOfTurnover = annualTurnover > 0 ? (presumptiveTax / annualTurnover) * 100 : 0;
  const taxAsPctOfProfit = profit > 0 ? (presumptiveTax / profit) * 100 : 0;

  let fairnessNote: KadirioResult['fairnessNote'] = 'balanced';
  if (profit > 0 && taxAsPctOfProfit > 15) fairnessNote = 'low-margin-burden';
  else if (profit > 0 && taxAsPctOfProfit < 4) fairnessNote = 'high-margin-light';

  return {
    eligible: true,
    profit,
    marginPct,
    presumptiveTax,
    taxAsPctOfTurnover,
    taxAsPctOfProfit,
    fairnessNote,
  };
}
