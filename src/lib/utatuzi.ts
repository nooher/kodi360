// utatuzi.ts — statutory-timeline math for objecting to a tax assessment.
// Rules per the Tax Administration Act, 2015 (R.E. 2019):
//   • Notice of objection: within 30 days of the tax decision.
//   • Deposit to admit the objection: the greater of the undisputed tax or 1/3
//     of the assessed tax (unless the Commissioner General grants a waiver).
//   • Extension request: submit at least 7 days before the 30-day deadline
//     expires; if granted, adds up to 30 more days.
// Pure date-math, fully unit-testable, no network.

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DisputeTimeline {
  decisionDate: Date;
  objectionDeadline: Date;
  extensionRequestBy: Date;
  requiredDeposit: number;
  daysRemaining: number;
  urgency: 'expired' | 'critical' | 'soon' | 'ok';
  canStillRequestExtension: boolean;
}

export function requiredDeposit(assessedAmount: number, undisputedAmount: number): number {
  const third = assessedAmount / 3;
  return Math.max(undisputedAmount, third);
}

export function computeTimeline(
  decisionDate: Date,
  assessedAmount: number,
  undisputedAmount: number,
  now: Date = new Date(),
): DisputeTimeline {
  const objectionDeadline = new Date(decisionDate.getTime() + 30 * DAY_MS);
  const extensionRequestBy = new Date(objectionDeadline.getTime() - 7 * DAY_MS);
  const daysRemaining = Math.ceil((objectionDeadline.getTime() - now.getTime()) / DAY_MS);

  let urgency: DisputeTimeline['urgency'];
  if (daysRemaining < 0) urgency = 'expired';
  else if (daysRemaining <= 7) urgency = 'critical';
  else if (daysRemaining <= 14) urgency = 'soon';
  else urgency = 'ok';

  return {
    decisionDate,
    objectionDeadline,
    extensionRequestBy,
    requiredDeposit: requiredDeposit(assessedAmount, undisputedAmount),
    daysRemaining,
    urgency,
    canStillRequestExtension: now.getTime() <= extensionRequestBy.getTime(),
  };
}
