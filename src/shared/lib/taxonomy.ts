import { normalizeKey } from './normalize';

export interface TaxonomyOption {
  key: string;
  label: string;
  count: number;
}

export function deriveTaxonomy<T>(records: T[], accessor: (record: T) => string): TaxonomyOption[] {
  const values = new Map<string, TaxonomyOption>();
  records.forEach(record => {
    const label = accessor(record).trim();
    if (!label) return;
    const key = normalizeKey(label);
    const current = values.get(key);
    if (current) current.count += 1;
    else values.set(key, { key, label, count: 1 });
  });
  return [...values.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function matchesTaxonomy(value: string, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.includes(normalizeKey(value));
}
