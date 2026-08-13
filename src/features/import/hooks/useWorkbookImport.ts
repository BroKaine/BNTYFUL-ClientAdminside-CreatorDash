import { useCallback, useEffect, useRef, useState } from 'react';
import type { DatasetKind, ImportResult, WorkerResponse } from '../model/import.types';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export type ImportStatus = 'idle' | 'reading' | 'detecting' | 'normalizing' | 'validating' | 'preflight' | 'error';

export interface WorkbookImportState {
  status: ImportStatus;
  progress: number;
  error: string;
  result: ImportResult | null;
}

const INITIAL_STATE: WorkbookImportState = { status: 'idle', progress: 0, error: '', result: null };

export function useWorkbookImport() {
  const [state, setState] = useState<WorkbookImportState>(INITIAL_STATE);
  const workerRef = useRef<Worker | null>(null);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => terminate, [terminate]);

  const reset = useCallback(() => {
    terminate();
    setState(INITIAL_STATE);
  }, [terminate]);

  const cancel = useCallback(() => reset(), [reset]);

  const importFile = useCallback(async (file: File, expectedKind: DatasetKind) => {
    terminate();
    const extension = ACCEPTED_EXTENSIONS.find(candidate => file.name.toLocaleLowerCase().endsWith(candidate));
    if (!extension) {
      setState({ ...INITIAL_STATE, status: 'error', error: 'Choose a valid .xlsx, .xls, or .csv file.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setState({ ...INITIAL_STATE, status: 'error', error: 'This file exceeds the 50 MiB import limit.' });
      return;
    }
    setState({ ...INITIAL_STATE, status: 'reading', progress: 5 });
    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL('../../../workers/spreadsheet.worker.ts', import.meta.url), {
        type: 'module',
        name: 'bntyful-spreadsheet-normalizer',
      });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (response.type === 'progress') {
          setState(current => ({ ...current, status: response.stage, progress: response.progress }));
          return;
        }
        terminate();
        if (response.type === 'complete') {
          setState({ status: 'preflight', progress: 100, error: '', result: response.result });
        } else {
          setState({ ...INITIAL_STATE, status: 'error', error: response.message });
        }
      };
      worker.onerror = () => {
        terminate();
        setState({ ...INITIAL_STATE, status: 'error', error: 'The spreadsheet worker stopped unexpectedly.' });
      };
      worker.postMessage({
        type: 'parse',
        buffer,
        fileName: file.name,
        fileSize: file.size,
        expectedKind,
        parserUrl: new URL('vendor/sheetjs/xlsx.full.min.js', document.baseURI).href,
        parserWorkerUrl: new URL('workers/spreadsheet-parser.js', document.baseURI).href,
      }, [buffer]);
    } catch (error) {
      terminate();
      setState({
        ...INITIAL_STATE,
        status: 'error',
        error: error instanceof Error ? error.message : 'The file could not be read.',
      });
    }
  }, [terminate]);

  return { state, importFile, cancel, reset };
}
