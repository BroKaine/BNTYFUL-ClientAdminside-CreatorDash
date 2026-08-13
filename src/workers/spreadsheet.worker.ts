import { importWorkbookRows } from '@/features/import/model/workbook';
import type { CellValue, WorkerRequest, WorkerResponse } from '@/features/import/model/import.types';

type ParserResponse =
  | { type: 'parsed'; rows: CellValue[][]; sheetName: string; additionalSheets: string[] }
  | { type: 'error'; message: string };

interface WorkerScope {
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
    const parserWorker = new Worker(request.parserWorkerUrl, { name: 'bntyful-spreadsheet-parser' });
    parserWorker.onmessage = (parserEvent: MessageEvent<ParserResponse>) => {
      const response = parserEvent.data;
      parserWorker.terminate();
      if (response.type === 'error') {
        scope.postMessage(response);
        return;
      }
      try {
        progress('detecting', 35);
        progress('normalizing', 60);
        const result = importWorkbookRows({
          rows: response.rows,
          fileName: request.fileName,
          fileSize: request.fileSize,
          sheetName: response.sheetName,
          additionalSheets: response.additionalSheets,
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
    };
    parserWorker.onerror = () => {
      parserWorker.terminate();
      scope.postMessage({ type: 'error', message: 'The spreadsheet parser stopped unexpectedly.' });
    };
    parserWorker.postMessage({ buffer: request.buffer, parserUrl: request.parserUrl }, [request.buffer]);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'The workbook could not be processed.',
    });
  }
});
