import { describe, it, expect } from 'vitest';
import { estimateKadirio, presumptiveTaxFor, PRESUMPTIVE_CEILING } from '../kadirio';

describe('presumptiveTaxFor', () => {
  it('is zero for very low turnover', () => {
    expect(presumptiveTaxFor(2_000_000)).toBe(0);
  });

  it('increases with turnover across bands', () => {
    const a = presumptiveTaxFor(5_000_000);
    const b = presumptiveTaxFor(12_000_000);
    const c = presumptiveTaxFor(50_000_000);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
});

describe('estimateKadirio', () => {
  it('flags excluded professional/technical activities as ineligible', () => {
    const r = estimateKadirio({ annualTurnover: 50_000_000, annualExpenses: 20_000_000, activity: 'professional' });
    expect(r.eligible).toBe(false);
    expect(r.ineligibleReason).toBe('excluded-activity');
  });

  it('flags turnover above the presumptive ceiling as ineligible', () => {
    const r = estimateKadirio({
      annualTurnover: PRESUMPTIVE_CEILING + 1,
      annualExpenses: 10_000_000,
      activity: 'retail',
    });
    expect(r.eligible).toBe(false);
    expect(r.ineligibleReason).toBe('over-ceiling');
  });

  it('flags a low-margin business as carrying a heavier relative burden', () => {
    // Same turnover, thin margin -> tax as % of profit should be high.
    const thin = estimateKadirio({ annualTurnover: 50_000_000, annualExpenses: 48_000_000, activity: 'retail' });
    const healthy = estimateKadirio({ annualTurnover: 50_000_000, annualExpenses: 20_000_000, activity: 'retail' });
    expect(thin.eligible).toBe(true);
    expect(healthy.eligible).toBe(true);
    expect(thin.taxAsPctOfProfit).toBeGreaterThan(healthy.taxAsPctOfProfit);
    expect(thin.fairnessNote).toBe('low-margin-burden');
  });

  it('computes profit and margin correctly', () => {
    const r = estimateKadirio({ annualTurnover: 10_000_000, annualExpenses: 6_000_000, activity: 'general' });
    expect(r.profit).toBe(4_000_000);
    expect(r.marginPct).toBeCloseTo(40, 5);
  });
});
