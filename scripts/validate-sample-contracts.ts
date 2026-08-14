import { readFileSync } from 'node:fs';
import process from 'node:process';
import { XLSX } from './load-official-sheetjs';
import { importWorkbookRows } from '../src/features/import/model/workbook';
import type { B2BRecord, CellHyperlink, CellValue, DatasetKind, ImportedRecord } from '../src/features/import/model/import.types';
import { normalizeUrl } from '../src/shared/lib/normalize';

function extractHyperlinks(sheet: unknown): CellHyperlink[] {
  const cells = sheet as Record<string, { l?: { Target?: unknown } } | string | undefined>;
  const reference = cells['!ref'];
  if (typeof reference !== 'string') return [];
  const range = XLSX.utils.decode_range(reference);
  return Object.entries(cells).flatMap(([address, cell]) => {
    if (address.startsWith('!') || typeof cell !== 'object') return [];
    const target = cell?.l?.Target;
    if (typeof target !== 'string' || !target.trim()) return [];
    const position = XLSX.utils.decode_cell(address);
    return [{ rowIndex: position.r - range.s.r, columnIndex: position.c - range.s.c, target: target.trim() }];
  });
}

function importedUrl(record: ImportedRecord, header: string): string | undefined {
  if (record.kind === 'b2b') {
    if (header === 'Website') return record.website;
    if (header === 'Instagram Handle') return record.instagramUrl;
    if (header === 'LinkedIn Page') return record.linkedInPage;
    if (header === 'LinkedIn Profile') return record.linkedInProfile;
    return undefined;
  }
  if (header === 'TikTok URL') return record.tiktokUrl;
  if (header === 'Instagram URL') return record.instagramUrl;
  if (header === 'YouTube URL') return record.youtubeUrl;
  if (header === 'X/Twitter URL') return record.twitterUrl;
  if (header === 'Link-in-Bio') return record.linkInBio;
  return undefined;
}

function validate(path: string, expectedKind: DatasetKind, expectedRows: number, expectedFields: number) {
  const bytes = readFileSync(path);
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false, cellHTML: false, raw: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`${path}: no worksheet found`);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, { header: 1, defval: null, raw: true, blankrows: true }) as CellValue[][];
  const hyperlinks = extractHyperlinks(sheet);
  const result = importWorkbookRows({ rows, hyperlinks, fileName: path, fileSize: bytes.byteLength, sheetName, additionalSheets: workbook.SheetNames.slice(1), expectedKind });
  const famousBrands = expectedKind === 'b2b'
    ? result.records.find(record => record.kind === 'b2b' && record.companyName === 'Famous Brands') as B2BRecord | undefined
    : undefined;
  const motherland = expectedKind === 'b2b'
    ? result.records.find(record => record.kind === 'b2b' && record.companyName === 'Motherland Coffee Company') as B2BRecord | undefined
    : undefined;
  const headerRowIndex = result.report.headerRowNumber - 1;
  let verifiedHyperlinks = 0;
  const hyperlinkFailures = hyperlinks.flatMap(link => {
    const header = String(rows[headerRowIndex]?.[link.columnIndex] ?? '').trim();
    const record = result.records.find(candidate => candidate.rowNumber === link.rowIndex + 1);
    const actual = record ? importedUrl(record, header) : undefined;
    if (actual === undefined) return [];
    const expected = normalizeUrl(link.target);
    if (!expected.valid) return [];
    verifiedHyperlinks += 1;
    return actual === expected.url ? [] : [`row ${link.rowIndex + 1} ${header}: ${actual || 'missing'} != ${expected.url}`];
  });
  const assertions = [
    [result.kind === expectedKind, `detected ${result.kind}, expected ${expectedKind}`],
    [result.records.length === expectedRows, `parsed ${result.records.length} rows, expected ${expectedRows}`],
    [result.report.sourceHeaders.length === expectedFields, `recognized ${result.report.sourceHeaders.length} named source fields, expected ${expectedFields}`],
    [result.report.scoreMismatchCount === 0, `${result.report.scoreMismatchCount} score mismatch(es)`],
    [expectedKind !== 'b2b' || famousBrands?.website === 'https://famousbrands.co.za/', `Famous Brands website resolved to ${famousBrands?.website || 'missing'}`],
    [expectedKind !== 'b2b' || famousBrands?.linkedInProfile === 'https://www.linkedin.com/in/darren-hele-21483b45/', `Famous Brands decision-maker LinkedIn resolved to ${famousBrands?.linkedInProfile || 'missing'}`],
    [expectedKind !== 'b2b' || motherland?.linkedInProfile === 'https://www.linkedin.com/in/rob-maud-5a855518/', `Motherland decision-maker LinkedIn resolved to ${motherland?.linkedInProfile || 'missing'}`],
    [hyperlinkFailures.length === 0, `embedded hyperlink mismatches: ${hyperlinkFailures.slice(0, 5).join('; ')}`],
  ] as const;
  const failures = assertions.filter(([passes]) => !passes).map(([, message]) => message);
  if (failures.length) throw new Error(`${path}: ${failures.join('; ')}`);
  return {
    kind: result.kind,
    records: result.records.length,
    namedFields: result.report.sourceHeaders.length,
    contactable: result.report.contactableCount,
    repairedUrls: result.report.repairedUrlCount,
    embeddedHyperlinks: hyperlinks.length,
    verifiedHyperlinks,
    multipleEmailCells: result.report.multipleEmailCount,
    recordsWithMultipleEmails: result.records.filter(record => record.emails.length > 1).length,
    warnings: result.report.issues.filter(issue => issue.severity === 'warning').length,
  };
}

const [creatorPath, b2bPath] = process.argv.slice(2);
if (!creatorPath || !b2bPath) {
  throw new Error('Usage: vite-node scripts/validate-sample-contracts.ts <creator.xlsx> <b2b.xlsx>');
}

console.log(JSON.stringify({
  creator: validate(creatorPath, 'creator', 88, 46),
  b2b: validate(b2bPath, 'b2b', 24, 38),
}, null, 2));
