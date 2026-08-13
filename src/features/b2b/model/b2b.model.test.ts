import { describe, expect, it } from 'vitest';
import { importWorkbookRows } from '@/features/import/model/workbook';
import type { B2BRecord, ImportResult } from '@/features/import/model/import.types';
import { b2bRows } from '@/test/builders/workbookRows';
import { filterB2B, INITIAL_B2B_FILTERS } from './b2b.model';

describe('B2B filters', () => {
  const result = importWorkbookRows({ rows: b2bRows(6), fileName: 'b2b.xlsx', fileSize: 1, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
  it('combines dynamic taxonomy, contactability, score and review filters', () => {
    const target = result.records.find(record => record.category === 'Legal Services')!;
    const decisions = new Map([[target.id, { recordId: target.id, decision: 'Shortlisted' as const, reviewedAt: '', schemaVersion: 1 }]]);
    const filtered = filterB2B(result.records, { ...INITIAL_B2B_FILTERS, categories: ['legal services'], contactability: 'email', scoreMin: 14, review: 'shortlisted' }, decisions);
    expect(filtered).toEqual([target]);
  });
});
