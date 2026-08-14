import { describe, expect, it } from 'vitest';
import { extractUrls, normalizeInstagram, normalizeUrl, parseBooleanLike, parseDate, parseNumber, splitEmails } from './normalize';

describe('source normalization', () => {
  it('handles compact numbers without inventing invalid zeroes', () => {
    expect(parseNumber('2.5K')).toBe(2500);
    expect(parseNumber('1.2M')).toBe(1_200_000);
    expect(parseNumber('not a number')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });

  it('normalizes safe links and rejects executable schemes', () => {
    expect(normalizeUrl('example.com/path')).toMatchObject({ url: 'https://example.com/path', repaired: true, valid: true });
    expect(normalizeUrl('javascript:alert(1)')).toMatchObject({ url: '', valid: false });
  });

  it('preserves multi-label domains, subdomains, queries and fragments', () => {
    expect(normalizeUrl('famousbrands.co.za')).toMatchObject({ url: 'https://famousbrands.co.za/', repaired: true, valid: true });
    expect(normalizeUrl('example.co.uk/contact?source=list#team').url).toBe('https://example.co.uk/contact?source=list#team');
    expect(normalizeUrl('partners.example.com.au/path').url).toBe('https://partners.example.com.au/path');
    expect(extractUrls('Primary: company.co.za; backup: www.company.com.au/path')).toEqual([
      'https://company.co.za/',
      'https://www.company.com.au/path',
    ]);
  });

  it('retains qualified boolean meaning', () => {
    expect(parseBooleanLike('Yes — public DMs open')).toEqual({ value: true, qualifier: 'Yes — public DMs open' });
    expect(parseBooleanLike('No - use email')).toEqual({ value: false, qualifier: 'No - use email' });
    expect(parseBooleanLike('Maybe')).toEqual({ value: null, qualifier: 'Maybe' });
  });

  it('splits valid multi-email cells and reports unresolved values', () => {
    expect(splitEmails('a@example.com; b@example.com, nope')).toEqual({ valid: ['a@example.com', 'b@example.com'], invalid: ['nope'], multiple: true });
  });

  it('normalizes Instagram handles and Excel serial dates', () => {
    expect(normalizeInstagram('@bntyful')).toMatchObject({ handle: '@bntyful', url: 'https://www.instagram.com/bntyful/' });
    expect(parseDate(46244)).toBe('2026-08-10');
  });
});
