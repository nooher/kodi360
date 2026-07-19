import { describe, it, expect } from 'vitest';
import { registrationSchema, receiptSchema, disputeSchema, fieldErrors } from '../validation';

describe('registrationSchema', () => {
  it('accepts a valid registration', () => {
    const r = registrationSchema.safeParse({
      name: 'Mama Neema',
      phone: '0712345678',
      location: 'Kariakoo',
      activity: 'duka',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed phone number', () => {
    const r = registrationSchema.safeParse({ name: 'Juma', phone: '12345', activity: 'duka' });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).phone).toBeTruthy();
  });

  it('rejects a too-short name', () => {
    const r = registrationSchema.safeParse({ name: 'J', phone: '0712345678', activity: 'duka' });
    expect(r.success).toBe(false);
  });
});

describe('receiptSchema', () => {
  it('accepts a valid receipt', () => {
    const r = receiptSchema.safeParse({ item: 'Mchele', amount: '25000' });
    expect(r.success).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    const r = receiptSchema.safeParse({ item: 'Mchele', amount: '0' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty item', () => {
    const r = receiptSchema.safeParse({ item: '', amount: '1000' });
    expect(r.success).toBe(false);
  });
});

describe('disputeSchema', () => {
  it('accepts a valid dispute', () => {
    const r = disputeSchema.safeParse({
      decisionDate: '2026-07-01',
      assessedAmount: '900000',
      undisputedAmount: '0',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a negative assessed amount', () => {
    const r = disputeSchema.safeParse({ decisionDate: '2026-07-01', assessedAmount: '-1' });
    expect(r.success).toBe(false);
  });
});
