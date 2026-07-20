import { describe, it, expect } from 'vitest';
import { normalizeIdNumber, traderEmail, isValidNida, isValidTin } from '../traderIdentity';

describe('normalizeIdNumber', () => {
  it('strips spaces and dashes and lowercases', () => {
    expect(normalizeIdNumber('198-501 01-12345-67890-12')).toBe('19850101123456789012');
  });
});

describe('traderEmail', () => {
  it('builds a stable synthetic email from id type + number', () => {
    expect(traderEmail('nida', '19850101-12345-67890-12')).toBe('nida-19850101123456789012@traders.kodi360.tz');
    expect(traderEmail('tin', '123-456-789')).toBe('tin-123456789@traders.kodi360.tz');
  });
});

describe('isValidNida', () => {
  it('accepts a 20-digit NIN', () => {
    expect(isValidNida('19850101123456789012')).toBe(true);
    expect(isValidNida('19850101-12345-67890-12')).toBe(true);
  });
  it('rejects the wrong length', () => {
    expect(isValidNida('12345')).toBe(false);
    expect(isValidNida('198501011234567890123')).toBe(false);
  });
});

describe('isValidTin', () => {
  it('accepts a 9-digit business TIN and a 10-digit individual TIN', () => {
    expect(isValidTin('123456789')).toBe(true);
    expect(isValidTin('1234567890')).toBe(true);
    expect(isValidTin('123-456-789')).toBe(true);
  });
  it('rejects the wrong length', () => {
    expect(isValidTin('12345')).toBe(false);
  });
});
