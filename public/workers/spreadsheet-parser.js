/*
 * Intentionally dependency-free classic worker. SheetJS CE is loaded from the
 * same-origin vendored artifact so workbook contents never leave the browser.
 */
self.addEventListener('message', event => {
  const request = event.data;
  try {
    if (!self.XLSX) self.importScripts(request.parserUrl);
    if (!self.XLSX) throw new Error('The spreadsheet parser could not be loaded.');
    const workbook = self.XLSX.read(request.buffer, {
      type: 'array',
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      raw: true,
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('The workbook has no worksheets.');
    const sheet = workbook.Sheets[sheetName];
    const rows = self.XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: true,
    });
    if (rows.length === 0) throw new Error('The first worksheet is empty.');
    if (rows.length > 25_010) throw new Error('This workbook exceeds the 25,000-row import limit.');
    const range = sheet['!ref'] ? self.XLSX.utils.decode_range(sheet['!ref']) : null;
    const hyperlinks = [];
    if (range) {
      Object.keys(sheet).forEach(address => {
        if (address.startsWith('!')) return;
        const target = sheet[address]?.l?.Target;
        if (typeof target !== 'string' || !target.trim()) return;
        const position = self.XLSX.utils.decode_cell(address);
        hyperlinks.push({
          rowIndex: position.r - range.s.r,
          columnIndex: position.c - range.s.c,
          target: target.trim(),
        });
      });
    }
    self.postMessage({
      type: 'parsed',
      rows,
      hyperlinks,
      sheetName,
      additionalSheets: workbook.SheetNames.slice(1),
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'The workbook could not be parsed.',
    });
  }
});
