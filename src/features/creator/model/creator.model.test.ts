import { beforeEach, describe, expect, it } from 'vitest';
import type { CreatorRecord, ImportResult } from '@/features/import/model/import.types';
import { importWorkbookRows } from '@/features/import/model/workbook';
import { creatorRows } from '@/test/builders/workbookRows';
import { filterCreators, INITIAL_CREATOR_FILTERS, migrateLegacyCreatorApprovals, sortCreators } from './creator.model';

function result(): ImportResult<CreatorRecord> {
  return importWorkbookRows({ rows: creatorRows(6), fileName: 'creator.xlsx', fileSize: 1, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' }) as ImportResult<CreatorRecord>;
}

describe('creator review model', () => {
  beforeEach(() => localStorage.clear());

  it('combines research, taxonomy, range and decision filters', () => {
    const records = result().records;
    const target = records.find(record => record.category === 'Health & Wellness')!;
    const decisions = new Map([[target.id, { recordId: target.id, decision: 'Approved' as const, reviewedAt: '', schemaVersion: 2 }]]);
    const filtered = filterCreators(records, { ...INITIAL_CREATOR_FILTERS, search: 'educational', categories: ['health & wellness'], scoreMin: 14, dmViableOnly: false, review: 'approved' }, decisions);
    expect(filtered).toEqual([target]);
    expect(sortCreators(records, 'name-asc')[0].creatorName).toBe('Creator 1');
  });

  it('migrates only confidently matched legacy approvals', () => {
    const records = result().records;
    const sample = records.slice(0, 5).map(record => record.creatorName).join('|');
    let hash = 0;
    for (let index = 0; index < sample.length; index += 1) { hash = ((hash << 5) - hash) + sample.charCodeAt(index); hash |= 0; }
    const first = records[0];
    const legacyId = `inf_${first.rowNumber - 1}_${first.creatorName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;
    localStorage.setItem(`influencer_approvals_${hash}_${records.length}`, JSON.stringify([legacyId, 'not-a-match']));
    const migrated = migrateLegacyCreatorApprovals(records);
    expect([...migrated.keys()]).toEqual([first.id]);
    expect(migrated.get(first.id)?.decision).toBe('Approved');
  });
});
