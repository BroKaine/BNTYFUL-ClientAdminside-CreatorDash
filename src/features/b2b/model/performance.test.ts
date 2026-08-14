import { describe, expect, it } from 'vitest';
import type { B2BRecord, ImportResult } from '@/features/import/model/import.types';
import { importWorkbookRows } from '@/features/import/model/workbook';
import { b2bRows } from '@/test/builders/workbookRows';
import { filterB2B, INITIAL_B2B_FILTERS, sortB2B } from './b2b.model';

describe('large-list selector performance', () => {
  it('filters and sorts 10,000 normalized prospects within the 150ms selector budget', () => {
    const result = importWorkbookRows({ rows: b2bRows(10_000), fileName: 'scale.xlsx', fileSize: 1, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
    const start = performance.now();
    const filtered = sortB2B(filterB2B(result.records, { ...INITIAL_B2B_FILTERS, search: 'commercial director', categories: ['legal services'], scoreMin: 12, contactability: 'email' }, new Map()), 'score-desc');
    const elapsed = performance.now() - start;
    expect(filtered.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(150);
  }, 15_000);
});
