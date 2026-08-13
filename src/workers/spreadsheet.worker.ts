import { importWorkbookRows } from '@/features/import/model/workbook';
import type { CellValue, WorkerRequest, WorkerResponse } from '@/features/import/model/import.types';

interface SheetJsWorkbook {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
}

interface SheetJsApi {
  read(data: ArrayBuffer, options: Record<string, unknown>): SheetJsWorkbook;
  utils: {
    sheet_to_json<T>(sheet: unknown, options: Record<string, unknown>): T[];
  };
}

interface WorkerScope {
  XLSX?: SheetJsApi;
  importScripts(...urls: string[]): void;
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
}

const scope = self as unknown as WorkerScope;

function progress(stage: Extract<WorkerResponse, { type: 'progress' }>['stage'], value: number): void {
  scope.postMessage({ type: 'progress', stage, progress: value });
}

scope.addEventListener('message', event => {
  const request = event.data;
  if (request.type !== 'parse') return;
  try {
    progress('reading', 10);
    if (!scope.XLSX) scope.importScripts(request.parserUrl);
    if (!scope.XLSX) throw new Error('The spreadsheet parser could not be loaded.');
    const workbook = scope.XLSX.read(request.buffer, {
      type: 'array',
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      raw: true,
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('The workbook has no worksheets.');
    progress('detecting', 35);
    const rows = scope.XLSX.utils.sheet_to_json<CellValue[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: true,
      blankrows: true,
    }) as CellValue[][];
    if (rows.length === 0) throw new Error('The first worksheet is empty.');
    if (rows.length > 25_010) throw new Error('This workbook exceeds the 25,000-row import limit.');
    progress('normalizing', 60);
    const result = importWorkbookRows({
      rows,
      fileName: request.fileName,
      fileSize: request.fileSize,
      sheetName,
      additionalSheets: workbook.SheetNames.slice(1),
      expectedKind: request.expectedKind,
    });
    progress('validating', 90);
    scope.postMessage({ type: 'complete', result });
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'The workbook could not be processed.',
    });
  }
});
