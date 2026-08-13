import type { BaseRecord, CellValue } from '@/features/import/model/import.types';

function sourceCell(value: CellValue | undefined): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export function neutralizeFormula(value: string): string {
  return /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
}

function quote(value: string, neutralize = true): string {
  const safeValue = neutralize ? neutralizeFormula(value) : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function quoteSourceCell(value: CellValue | undefined): string {
  return quote(sourceCell(value), typeof value !== 'number');
}

export interface ExportDecision {
  decision: string;
  reviewedAt: string;
}

export function createFullFidelityCsv(
  records: BaseRecord[],
  sourceHeaders: string[],
  decisions: Map<string, ExportDecision>,
): string {
  const appended = ['BNTYFUL Review Decision', 'BNTYFUL Reviewed At', 'BNTYFUL Data Warnings'];
  const rows = records.map(record => {
    const byHeader = new Map(record.source.headers.map((header, index) => [header, record.source.values[index]]));
    const decision = decisions.get(record.id);
    return [
      ...sourceHeaders.map(header => quoteSourceCell(byHeader.get(header))),
      quote(decision?.decision ?? 'Unreviewed'),
      quote(decision?.reviewedAt ?? ''),
      quote(record.warnings.join(' | ')),
    ].join(',');
  });
  return `\uFEFF${[sourceHeaders.concat(appended).map(value => quote(value)).join(','), ...rows].join('\r\n')}`;
}

export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.replace(/[^a-z0-9_.-]+/gi, '-');
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
