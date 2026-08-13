import { describe, expect, it } from 'vitest';
import type { B2BRecord, CreatorRecord, ImportResult } from './import.types';
import { importWorkbookRows } from './workbook';
import { b2bRows, creatorRows } from '@/test/builders/workbookRows';
import { deriveTaxonomy } from '@/shared/lib/taxonomy';

function importCreator(count = 88): ImportResult<CreatorRecord> {
  return importWorkbookRows({ rows: creatorRows(count), fileName: 'creator.xlsx', fileSize: 1024, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' }) as ImportResult<CreatorRecord>;
}

function importB2B(count = 24): ImportResult<B2BRecord> {
  return importWorkbookRows({ rows: b2bRows(count), fileName: 'b2b.xlsx', fileSize: 1024, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
}

describe('workbook contracts', () => {
  it('detects the creator header at row four and retains the full contract', () => {
    const result = importCreator();
    expect(result.kind).toBe('creator');
    expect(result.report.headerRowNumber).toBe(4);
    expect(result.report.recordCount).toBe(88);
    expect(result.report.recognizedHeaders).toHaveLength(46);
    expect(result.records[0]).toMatchObject({ primaryPlatform: 'Instagram', dmViable: true, sourceTotalScore: 14, calculatedTotalScore: 14 });
    expect(result.records[0].linkInBio).toBe('https://creator1.example/link');
  });

  it('detects B2B independently and handles all sample-shaped edge cases', () => {
    const result = importB2B();
    expect(result.kind).toBe('b2b');
    expect(result.report.headerRowNumber).toBe(4);
    expect(result.report.recordCount).toBe(24);
    expect(result.report.recognizedHeaders).toHaveLength(38);
    expect(result.records[0]).toMatchObject({ dateAdded: '2026-08-10', sourceTotalScore: 14, calculatedTotalScore: 14 });
    expect(result.records[0].emails).toEqual(['first@example.test', 'second@example.test']);
    expect(result.records[1].linkedInProfile).toContain('linkedin.com/in/alternate-contact');
  });

  it('derives unseen taxonomies and never injects sample industries', () => {
    const result = importB2B(3);
    const categories = deriveTaxonomy(result.records, record => record.category).map(option => option.label);
    expect(categories).toEqual(['Agricultural Co-operative', 'Industrial SaaS', 'Legal Services']);
    expect(categories).not.toContain('QSR');
    expect(result.records[0].subcategory).toBe('Risk / Compliance');
  });

  it('produces stable record identities and fingerprints after row reordering', () => {
    const first = importCreator(5);
    const rows = creatorRows(5);
    const reordered = [...rows.slice(0, 4), ...rows.slice(4).reverse()];
    const second = importWorkbookRows({ rows: reordered, fileName: 'renamed.xlsx', fileSize: 2048, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' });
    expect(second.fingerprint).toBe(first.fingerprint);
    expect(second.records.map(record => record.id).sort()).toEqual(first.records.map(record => record.id).sort());
  });

  it('recognizes valid data at worksheet column index zero', () => {
    const rows = b2bRows(1).map(row => row.filter((_, index) => index !== 0));
    const result = importWorkbookRows({ rows, fileName: 'index-zero.xlsx', fileSize: 1, sheetName: 'Sheet1', additionalSheets: [], expectedKind: 'b2b' });
    expect((result.records[0] as B2BRecord).companyName).toBe('Prospect 1');
  });

  it('offers the correct detected domain when uploaded through the wrong mode', () => {
    const result = importWorkbookRows({ rows: b2bRows(1), fileName: 'wrong-zone.xlsx', fileSize: 1, sheetName: 'Sheet1', additionalSheets: [], expectedKind: 'creator' });
    expect(result.report.expectedKind).toBe('creator');
    expect(result.report.detectedKind).toBe('b2b');
  });
});
