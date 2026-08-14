// @vitest-environment node

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { XLSX } from './load-official-sheetjs';

describe('classic spreadsheet parser worker', () => {
  it('returns embedded hyperlink targets aligned to the parsed value rows', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Title'],
      ['Website', 'LinkedIn Profile'],
      ['Famousbrands.co.za', 'linkedin.com/in/darren-hele'],
    ]) as Record<string, { l?: { Target: string } }>;
    sheet.A3.l = { Target: 'https://famousbrands.co.za/' };
    sheet.B3.l = { Target: 'https://www.linkedin.com/in/darren-hele-21483b45/' };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Prospects');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    type WorkerListener = (event: { data: { buffer: Uint8Array } }) => void;
    const messages: unknown[] = [];
    let listener: WorkerListener | undefined;
    const scope = {
      XLSX,
      importScripts: () => undefined,
      addEventListener: (_type: string, callback: WorkerListener) => { listener = callback; },
      postMessage: (message: unknown) => { messages.push(message); },
    };
    const source = readFileSync(new URL('../public/workers/spreadsheet-parser.js', import.meta.url), 'utf8');
    runInNewContext(source, { self: scope, Error });
    if (!listener) throw new Error('Spreadsheet parser did not register its message listener.');

    listener({ data: { buffer: bytes } });

    expect(messages).toEqual([expect.objectContaining({
      type: 'parsed',
      rows: [
        ['Title', null],
        ['Website', 'LinkedIn Profile'],
        ['Famousbrands.co.za', 'linkedin.com/in/darren-hele'],
      ],
      hyperlinks: [
        { rowIndex: 2, columnIndex: 0, target: 'https://famousbrands.co.za/' },
        { rowIndex: 2, columnIndex: 1, target: 'https://www.linkedin.com/in/darren-hele-21483b45/' },
      ],
    })]);
  });
});
