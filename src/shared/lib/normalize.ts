import type { CellValue } from '@/features/import/model/import.types';

const MISSING_MARKERS = new Set(['', 'n/a', 'na', 'n.a.', 'not available', '-']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

export function sourceText(value: CellValue | undefined): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeKey(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase();
}

export function isMissing(value: CellValue | undefined): boolean {
  const text = sourceText(value);
  return MISSING_MARKERS.has(text.toLocaleLowerCase());
}

export function displayText(value: CellValue | undefined): string {
  return isMissing(value) ? '' : normalizeWhitespace(sourceText(value));
}

export function parseNumber(value: CellValue | undefined): number | null {
  if (isMissing(value)) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = sourceText(value).replace(/,/g, '').replace(/\+/g, '').trim();
  const suffix = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*([kmb])$/i);
  if (suffix) {
    const number = Number(suffix[1]);
    const multiplier = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[suffix[2].toLowerCase()] ?? 1;
    return number * multiplier;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBooleanLike(value: CellValue | undefined): { value: boolean | null; qualifier: string } {
  if (isMissing(value)) return { value: null, qualifier: '' };
  if (typeof value === 'boolean') return { value, qualifier: '' };
  if (typeof value === 'number') {
    if (value === 1) return { value: true, qualifier: '' };
    if (value === 0) return { value: false, qualifier: '' };
  }
  const raw = normalizeWhitespace(sourceText(value));
  const normalized = raw.toLocaleLowerCase();
  if (/^(yes|y|true|1)(\b|\s|[—–-])/.test(normalized)) return { value: true, qualifier: raw };
  if (/^(no|n|false|0)(\b|\s|[—–-])/.test(normalized)) return { value: false, qualifier: raw };
  return { value: null, qualifier: raw };
}

export interface NormalizedUrl {
  raw: string;
  url: string;
  repaired: boolean;
  valid: boolean;
}

function extractFirstUrl(value: string): string {
  const explicit = value.match(/https?:\/\/[^\s)\]}>,]+/i)?.[0];
  if (explicit) return explicit.replace(/[.;]+$/, '');
  const domain = value.match(/(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z]{2,})(?:\/[^\s)\]}>,]*)?/i)?.[0];
  return domain?.replace(/[.;]+$/, '') ?? '';
}

export function normalizeUrl(value: CellValue | undefined): NormalizedUrl {
  const raw = displayText(value);
  if (!raw) return { raw, url: '', repaired: false, valid: false };
  const candidate = extractFirstUrl(raw) || raw;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(candidate);
  const url = hasScheme ? candidate : `https://${candidate.replace(/^\/+/, '')}`;
  try {
    const parsed = new URL(url);
    if (!HTTP_PROTOCOLS.has(parsed.protocol) || !parsed.hostname.includes('.')) {
      return { raw, url: '', repaired: false, valid: false };
    }
    return { raw, url: parsed.toString(), repaired: !hasScheme, valid: true };
  } catch {
    return { raw, url: '', repaired: false, valid: false };
  }
}

export function extractUrls(value: CellValue | undefined): string[] {
  const raw = displayText(value);
  if (!raw) return [];
  const candidates = raw.match(/https?:\/\/[^\s)\]}>,]+|(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z]{2,})(?:\/[^\s)\]}>,]*)?/gi) ?? [];
  return [...new Set(candidates.map(candidate => normalizeUrl(candidate).url).filter(Boolean))];
}

export function normalizeInstagram(value: CellValue | undefined): { raw: string; handle: string; url: string } {
  const raw = displayText(value);
  if (!raw) return { raw, handle: '', url: '' };
  const normalized = normalizeUrl(raw);
  if (normalized.valid) {
    const parsed = new URL(normalized.url);
    const segment = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    return { raw, handle: segment ? `@${segment.replace(/^@/, '')}` : '', url: normalized.url };
  }
  const handle = raw.replace(/^@/, '').split(/[\s/]/)[0];
  if (!/^[a-z0-9._]{1,30}$/i.test(handle)) return { raw, handle: '', url: '' };
  return { raw, handle: `@${handle}`, url: `https://www.instagram.com/${handle}/` };
}

export function splitEmails(value: CellValue | undefined): { valid: string[]; invalid: string[]; multiple: boolean } {
  const raw = isMissing(value) ? '' : sourceText(value);
  if (!raw) return { valid: [], invalid: [], multiple: false };
  const tokens = raw.split(/[;,\n]+/).map(token => token.trim()).filter(Boolean);
  const valid = tokens.filter(token => EMAIL_PATTERN.test(token));
  const invalid = tokens.filter(token => !EMAIL_PATTERN.test(token));
  return { valid: [...new Set(valid)], invalid, multiple: tokens.length > 1 };
}

export function parseDate(value: CellValue | undefined): string {
  if (isMissing(value)) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 0 && value < 2_958_466) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + Math.round(value) * 86_400_000).toISOString().slice(0, 10);
  }
  const raw = sourceText(value);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

export function formatNumber(value: number | null): string {
  if (value === null) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return new Intl.NumberFormat().format(value);
}

export function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

export function canonicalDomain(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLocaleLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
