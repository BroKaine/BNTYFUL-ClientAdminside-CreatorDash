import { describe, expect, it } from 'vitest';
import type { B2BRecord, CellHyperlink, CreatorRecord, ImportResult } from './import.types';
import { importWorkbookRows } from './workbook';
import { b2bRows, creatorRows } from '@/test/builders/workbookRows';
import { deriveTaxonomy } from '@/shared/lib/taxonomy';

function importCreator(count = 88): ImportResult<CreatorRecord> {
  return importWorkbookRows({ rows: creatorRows(count), fileName: 'creator.xlsx', fileSize: 1024, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' }) as ImportResult<CreatorRecord>;
}

function importB2B(count = 24): ImportResult<B2BRecord> {
  return importWorkbookRows({ rows: b2bRows(count), fileName: 'b2b.xlsx', fileSize: 1024, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
}

function hyperlinkFor(rows: unknown[][], rowIndex: number, header: string, target: string): CellHyperlink {
  const columnIndex = rows[3].indexOf(header);
  if (columnIndex < 0) throw new Error(`Missing test header: ${header}`);
  return { rowIndex, columnIndex, target };
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

  it('uses safe embedded hyperlink targets while retaining visible source values', () => {
    const rows = b2bRows(1);
    const websiteColumn = rows[3].indexOf('Website');
    const instagramColumn = rows[3].indexOf('Instagram Handle');
    const linkedInColumn = rows[3].indexOf('LinkedIn Profile');
    rows[4][websiteColumn] = 'Famousbrands.co.za';
    rows[4][instagramColumn] = '@famousbrands';
    rows[4][linkedInColumn] = 'linkedin.com/in/darren-hele';
    const hyperlinks = [
      hyperlinkFor(rows, 4, 'Website', 'https://famousbrands.co.za/'),
      hyperlinkFor(rows, 4, 'Instagram Handle', 'https://www.instagram.com/famousbrandssa/?hl=en'),
      hyperlinkFor(rows, 4, 'LinkedIn Profile', 'https://www.linkedin.com/in/darren-hele-21483b45/'),
    ];

    const result = importWorkbookRows({ rows, hyperlinks, fileName: 'linked.xlsx', fileSize: 1, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
    const record = result.records[0];
    expect(record.website).toBe('https://famousbrands.co.za/');
    expect(record.instagramHandle).toBe('@famousbrands');
    expect(record.instagramUrl).toBe('https://www.instagram.com/famousbrandssa/?hl=en');
    expect(record.linkedInProfile).toBe('https://www.linkedin.com/in/darren-hele-21483b45/');
    expect(record.source.values[record.source.headers.indexOf('Website')]).toBe('Famousbrands.co.za');
    expect(record.source.values[record.source.headers.indexOf('LinkedIn Profile')]).toBe('linkedin.com/in/darren-hele');
  });

  it('rejects unsafe embedded targets and falls back to the displayed URL', () => {
    const rows = b2bRows(1);
    const websiteColumn = rows[3].indexOf('Website');
    rows[4][websiteColumn] = 'fallback.co.za';
    const hyperlinks = [hyperlinkFor(rows, 4, 'Website', 'javascript:alert(1)')];

    const result = importWorkbookRows({ rows, hyperlinks, fileName: 'unsafe-link.xlsx', fileSize: 1, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
    expect(result.records[0].website).toBe('https://fallback.co.za/');
    expect(result.report.issues).toContainEqual(expect.objectContaining({
      code: 'invalid-url',
      field: 'Website',
      sourceValue: 'javascript:alert(1)',
    }));
  });

  it('uses embedded hyperlinks for creator channels through the shared importer', () => {
    const rows = creatorRows(1);
    const hyperlinks = [hyperlinkFor(rows, 4, 'Instagram URL', 'https://www.instagram.com/creator-1-exact/')];
    const result = importWorkbookRows({ rows, hyperlinks, fileName: 'creator-links.xlsx', fileSize: 1, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' }) as ImportResult<CreatorRecord>;

    expect(result.records[0].instagramUrl).toBe('https://www.instagram.com/creator-1-exact/');
    expect(result.records[0].source.values[result.records[0].source.headers.indexOf('Instagram URL')]).toBe('instagram.com/creator1');
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
