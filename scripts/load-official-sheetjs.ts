import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

interface Workbook {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
}

interface SheetJsApi {
  read(data: Uint8Array, options: Record<string, unknown>): Workbook;
  write(workbook: Workbook, options: Record<string, unknown>): Uint8Array;
  utils: {
    sheet_to_json<T>(sheet: unknown, options: Record<string, unknown>): T[];
    decode_cell(address: string): { r: number; c: number };
    decode_range(range: string): { s: { r: number; c: number }; e: { r: number; c: number } };
    book_new(): Workbook;
    book_append_sheet(workbook: Workbook, sheet: unknown, name: string): void;
    aoa_to_sheet(rows: unknown[][]): unknown;
  };
}

const parserPath = fileURLToPath(new URL('../public/vendor/sheetjs/xlsx.full.min.js', import.meta.url));
const sandbox: { XLSX?: SheetJsApi } = {};
runInNewContext(readFileSync(parserPath, 'utf8'), sandbox, { filename: parserPath });

if (!sandbox.XLSX) throw new Error('The pinned official SheetJS artifact did not initialize.');

export const XLSX = sandbox.XLSX;
