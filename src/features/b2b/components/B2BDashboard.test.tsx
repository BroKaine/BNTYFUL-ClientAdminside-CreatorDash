import axe from 'axe-core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { B2BRecord, ImportResult } from '@/features/import/model/import.types';
import { importWorkbookRows } from '@/features/import/model/workbook';
import { b2bRows } from '@/test/builders/workbookRows';
import { B2BDashboard } from './B2BDashboard';

function result(): ImportResult<B2BRecord> {
  return importWorkbookRows({ rows: b2bRows(3), fileName: 'b2b.xlsx', fileSize: 1, sheetName: 'Prospects', additionalSheets: [], expectedKind: 'b2b' }) as ImportResult<B2BRecord>;
}

describe('B2B dashboard', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('reviews dynamic prospects, opens evidence and compares records', () => {
    render(<B2BDashboard result={result()} registerActions={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Prospect review workspace' })).toBeVisible();
    expect(screen.getAllByText('Legal Services').length).toBeGreaterThan(0);
    expect(screen.queryByText('QSR')).not.toBeInTheDocument();
    const cards = document.querySelectorAll('.prospect-card');
    fireEvent.click(within(cards[0] as HTMLElement).getByRole('button', { name: 'Shortlist' }));
    expect(within(cards[0] as HTMLElement).getByRole('button', { name: 'Shortlist' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(cards[0] as HTMLElement).getByRole('button', { name: 'Review full profile' }));
    expect(screen.getByText('Hypothesis · not a verified fact')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close detail panel' }));
    fireEvent.click(within(cards[0] as HTMLElement).getByRole('button', { name: 'Compare' }));
    fireEvent.click(within(cards[1] as HTMLElement).getByRole('button', { name: 'Compare' }));
    fireEvent.click(screen.getByRole('button', { name: 'Compare 2' }));
    expect(screen.getByRole('table', { name: 'Prospect comparison' })).toBeVisible();
  });

  it('has no automatically detectable structural WCAG A/AA violations', async () => {
    const { container } = render(<B2BDashboard result={result()} registerActions={vi.fn()} />);
    const audit = await axe.run(container, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], rules: { 'color-contrast': { enabled: false } } });
    expect(audit.violations).toEqual([]);
  });
});
