import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatorRecord, ImportResult } from '@/features/import/model/import.types';
import { importWorkbookRows } from '@/features/import/model/workbook';
import { creatorRows } from '@/test/builders/workbookRows';
import { CreatorDashboard } from './CreatorDashboard';

function result(): ImportResult<CreatorRecord> {
  return importWorkbookRows({ rows: creatorRows(6), fileName: 'creators.xlsx', fileSize: 1, sheetName: 'Creators', additionalSheets: [], expectedKind: 'creator' }) as ImportResult<CreatorRecord>;
}

describe('Creator dashboard', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('preserves the creator review workflow and exposes complete research', () => {
    const imported = result();
    render(<CreatorDashboard result={imported} registerActions={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Creator partnership workspace' })).toBeVisible();
    const card = document.querySelector('.creator-card') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Approve' }));
    expect(localStorage.getItem(`bntyful:creator:review:v2:${imported.fingerprint}`)).toContain('Approved');
    fireEvent.click(within(card).getByRole('button', { name: 'Review full profile' }));
    expect(screen.getByText('Partnership thesis')).toBeVisible();
    expect(screen.getAllByText('Reference recent educational series').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Research supporting the assessment').length).toBeGreaterThan(0);
  });
});
