import { readFileSync } from 'node:fs';
import process from 'node:process';
import { XLSX } from './load-official-sheetjs';
import { importWorkbookRows } from '../src/features/import/model/workbook';
import type { CellValue, DatasetKind } from '../src/features/import/model/import.types';

function validate(path: string, expectedKind: DatasetKind, expectedRows: number, expectedFields: number) {
  const bytes = readFileSync(path);
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false, cellHTML: false, raw: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`${path}: no worksheet found`);
  const rows = XLSX.utils.sheet_to_json<CellValue[]>(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true, blankrows: true }) as CellValue[][];
  const result = importWorkbookRows({ rows, fileName: path, fileSize: bytes.byteLength, sheetName, additionalSheets: workbook.SheetNames.slice(1), expectedKind });
  const assertions = [
    [result.kind === expectedKind, `detected ${result.kind}, expected ${expectedKind}`],
    [result.records.length === expectedRows, `parsed ${result.records.length} rows, expected ${expectedRows}`],
    [result.report.sourceHeaders.length === expectedFields, `recognized ${result.report.sourceHeaders.length} named source fields, expected ${expectedFields}`],
    [result.report.scoreMismatchCount === 0, `${result.report.scoreMismatchCount} score mismatch(es)`],
  ] as const;
  const failures = assertions.filter(([passes]) => !passes).map(([, message]) => message);
  if (failures.length) throw new Error(`${path}: ${failures.join('; ')}`);
  return {
    kind: result.kind,
    records: result.records.length,
    namedFields: result.report.sourceHeaders.length,
    contactable: result.report.contactableCount,
    repairedUrls: result.report.repairedUrlCount,
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
