export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  return url.trim().startsWith('http://') || url.trim().startsWith('https://');
}

export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function normalizeYesNo(value: string | boolean | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const str = value.toString().trim().toUpperCase();
  return str === 'YES' || str === 'TRUE' || str === '1' || str === 'Y';
}

export function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') return "\u2014";
  return value.trim();
}

export function hasContent(value: string | null | undefined): boolean {
  if (!value || value.trim() === '') return false;
  return true;
}
