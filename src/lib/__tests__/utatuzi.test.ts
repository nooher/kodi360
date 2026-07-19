import { describe, it, expect } from 'vitest';
import { computeTimeline, requiredDeposit } from '../utatuzi';

describe('requiredDeposit', () => {
  it('takes the greater of undisputed amount and one-third of assessed', () => {
    expect(requiredDeposit(900_000, 100_000)).toBe(300_000);
    expect(requiredDeposit(900_000, 500_000)).toBe(500_000);
  });
});

describe('computeTimeline', () => {
  it('sets the objection deadline to 30 days after the decision', () => {
    const decision = new Date('2026-07-01T00:00:00Z');
    const tl = computeTimeline(decision, 900_000, 0, new Date('2026-07-01T00:00:00Z'));
    expect(tl.objectionDeadline.getTime() - decision.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('sets the extension request cutoff to 7 days before the deadline', () => {
    const decision = new Date('2026-07-01T00:00:00Z');
    const tl = computeTimeline(decision, 900_000, 0, decision);
    expect(tl.objectionDeadline.getTime() - tl.extensionRequestBy.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('flags urgency as critical when 7 or fewer days remain', () => {
    const decision = new Date('2026-07-01T00:00:00Z');
    const now = new Date('2026-07-25T00:00:00Z'); // 6 days before the 30-day deadline
    const tl = computeTimeline(decision, 900_000, 0, now);
    expect(tl.urgency).toBe('critical');
  });

  it('flags urgency as expired once the deadline has passed', () => {
    const decision = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-06-01T00:00:00Z');
    const tl = computeTimeline(decision, 900_000, 0, now);
    expect(tl.urgency).toBe('expired');
    expect(tl.canStillRequestExtension).toBe(false);
  });
});
