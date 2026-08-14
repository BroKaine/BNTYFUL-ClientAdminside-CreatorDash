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

  it('renders exact resolved workbook links in cards and prospect details', () => {
    const rows = b2bRows(1);
    const websiteColumn = rows[3].indexOf('Website');
    const linkedInPageColumn = rows[3].indexOf('LinkedIn Page');
    const linkedInProfileColumn = rows[3].indexOf('LinkedIn Profile');
    rows[4][websiteColumn] = 'Famousbrands.co.za';
    rows[4][linkedInPageColumn] = 'linkedin.com/company/famous-brands';
    rows[4][linkedInProfileColumn] = 'linkedin.com/in/darren-hele';
    const imported = importWorkbookRows({
      rows,
      hyperlinks: [
        { rowIndex: 4, columnIndex: websiteColumn, target: 'https://famousbrands.co.za/' },
        { rowIndex: 4, columnIndex: linkedInPageColumn, target: 'https://www.linkedin.com/company/famous-brands/' },
        { rowIndex: 4, columnIndex: linkedInProfileColumn, target: 'https://www.linkedin.com/in/darren-hele-21483b45/' },
      ],
      fileName: 'linked.xlsx',
      fileSize: 1,
      sheetName: 'Prospects',
      additionalSheets: [],
      expectedKind: 'b2b',
    }) as ImportResult<B2BRecord>;

    const { container } = render(<B2BDashboard result={imported} registerActions={vi.fn()} />);
    const card = container.querySelector('.prospect-card') as HTMLElement;
    expect(within(card).getByRole('link', { name: 'Open Prospect 1 website' })).toHaveAttribute('href', 'https://famousbrands.co.za/');
    expect(within(card).getByRole('link', { name: 'Open Decision Maker 1 on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/darren-hele-21483b45/');

    fireEvent.click(within(card).getByRole('button', { name: 'Review full profile' }));
    const detail = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(within(detail).getByRole('link', { name: /Company website/ })).toHaveAttribute('href', 'https://famousbrands.co.za/');
    expect(within(detail).getByRole('link', { name: /Company LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/company/famous-brands/');
    expect(within(detail).getByRole('link', { name: /Decision-maker LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/darren-hele-21483b45/');
  });

  it('has no automatically detectable structural WCAG A/AA violations', async () => {
    const { container } = render(<B2BDashboard result={result()} registerActions={vi.fn()} />);
    const audit = await axe.run(container, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], rules: { 'color-contrast': { enabled: false } } });
    expect(audit.violations).toEqual([]);
  });
});
