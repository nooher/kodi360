// Tests for the Kodi (TRA / tax administration) domain expert — sovereign KB.
import { describe, it, expect } from 'vitest';
import { kodiExpert } from '../index';
import type { AkiliQuery } from '../../../types';

const q = (text: string): AkiliQuery => ({ text, lang: 'sw' });

describe('kodiExpert.match', () => {
  it('scores high on a TIN registration query', () => {
    expect(kodiExpert.match(q('nataka kupata tin nambari ya mlipakodi'))).toBeGreaterThan(0.7);
  });

  it('scores moderate on a single cue', () => {
    expect(kodiExpert.match(q('vat ni kiasi gani'))).toBeGreaterThan(0.5);
  });

  it('scores high on English tax cues', () => {
    expect(kodiExpert.match(q('how do I file a tax objection appeal'))).toBeGreaterThan(0.7);
  });

  it('scores zero on an unrelated (clinical) query', () => {
    expect(kodiExpert.match(q('dalili za homa'))).toBe(0);
  });

  it('scores zero on empty input', () => {
    expect(kodiExpert.match(q(''))).toBe(0);
  });
});

describe('kodiExpert.answer', () => {
  it('returns a populated AkiliAnswer with sources + tax disclaimer', async () => {
    const a = await kodiExpert.answer(q('jinsi ya kusajili tin'));
    expect(a.domain).toBe('kodi');
    expect(a.expert).toBe('kodi-tra-msingi');
    expect(a.text.sw.length).toBeGreaterThan(0);
    expect(a.text.en && a.text.en.length).toBeTruthy();
    expect(/si ushauri rasmi wa kodi/i.test(a.text.sw)).toBe(true);
    expect(a.sources!.some((s) => /TRA|BRELA/i.test(s.label))).toBe(true);
  });

  it('retrieves the objection/appeal entry for a pingamizi query', async () => {
    const a = await kodiExpert.answer(q('nataka kupinga tathmini ya kodi, rufaa trab'));
    const data = a.data as { entry: string };
    expect(data.entry).toBe('pingamizi-rufaa');
  });

  it('retrieves the presumptive tax entry for a small-business turnover query', async () => {
    const a = await kodiExpert.answer(q('kodi ya makadirio kwa biashara ndogo turnover'));
    const data = a.data as { entry: string };
    expect(data.entry).toBe('kodi-makadirio');
  });

  it('retrieves the EFD/VFD entry for a receipt-machine query', async () => {
    const a = await kodiExpert.answer(q('bei ya efd na vfd kwa risiti'));
    const data = a.data as { entry: string };
    expect(data.entry).toBe('efd-vfd');
  });
});
