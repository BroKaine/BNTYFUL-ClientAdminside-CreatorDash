import { describe, expect, it } from 'vitest';
import { createFullFidelityCsv, neutralizeFormula } from './csv';
import { importWorkbookRows } from '@/features/import/model/workbook';
import { creatorRows } from '@/test/builders/workbookRows';

describe('full-fidelity CSV export', () => {
  it('neutralizes spreadsheet formula injection after leading whitespace', () => {
    expect(neutralizeFormula(' =HYPERLINK("bad")')).toBe('\' =HYPERLINK("bad")');
    expect(neutralizeFormula('@command')).toBe("'@command");
    expect(neutralizeFormula('ordinary')).toBe('ordinary');
  });

  it('preserves every source column and appends review metadata', () => {
    const result = importWorkbookRows({ rows: creatorRows(1), fileName: 'creator.xlsx', fileSize: 1, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' });
    const record = result.records[0];
    const csv = createFullFidelityCsv([record], result.report.sourceHeaders, new Map([[record.id, { decision: 'Approved', reviewedAt: '2026-08-13T00:00:00.000Z' }]]));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"BNTYFUL Review Decision"');
    expect(csv).toContain('"Approved"');
    expect(csv).toContain('"\'=potential spreadsheet formula"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('does not alter a safely typed negative numeric source cell', () => {
    const result = importWorkbookRows({ rows: creatorRows(1), fileName: 'creator.xlsx', fileSize: 1, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' });
    const record = result.records[0];
    const likesIndex = record.source.headers.indexOf('Total Likes');
    record.source.values[likesIndex] = -2500;
    const csv = createFullFidelityCsv([record], result.report.sourceHeaders, new Map());
    expect(csv).toContain('"-2500"');
    expect(csv).not.toContain('"\'-2500"');
  });
});
