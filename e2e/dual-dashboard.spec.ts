import { writeFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { XLSX } from '../scripts/load-official-sheetjs';
import { b2bRows, creatorRows } from '../src/test/builders/workbookRows';
import type { CellValue } from '../src/features/import/model/import.types';

function createWorkbook(rows: CellValue[][], fileName: string, testInfo: TestInfo): string {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Research');
  const filePath = testInfo.outputPath(fileName);
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  writeFileSync(filePath, new Uint8Array(bytes));
  return filePath;
}

async function importWorkbook(page: Page, filePath: string) {
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.getByRole('heading', { name: 'Your workbook is ready to review' })).toBeVisible();
  await page.getByRole('button', { name: /Open dashboard|Continue with report/ }).click();
}

test('imports, reviews and preserves independent B2B and creator workspaces', async ({ page }, testInfo) => {
  const b2bPath = createWorkbook(b2bRows(24), 'b2b-prospects.xlsx', testInfo);
  const creatorPath = createWorkbook(creatorRows(88), 'creators.xlsx', testInfo);
  await page.goto('/');
  await page.getByRole('button', { name: /B2B prospect list/ }).click();
  await importWorkbook(page, b2bPath);
  await expect(page.getByRole('heading', { name: 'Prospect review workspace' })).toBeVisible();
  await expect(page.getByText('Legal Services', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('QSR', { exact: true })).toHaveCount(0);

  const firstProspect = page.locator('.prospect-card').first();
  await firstProspect.getByRole('button', { name: 'Review full profile' }).click();
  const detailPanel = page.getByRole('dialog', { name: 'Prospect 1', exact: true });
  await expect(detailPanel).toBeVisible();
  await expect(detailPanel.getByText('Hypothesis · not a verified fact')).toBeVisible();
  await page.getByRole('button', { name: 'Close detail panel' }).click();
  await firstProspect.getByRole('button', { name: 'Shortlist' }).click();
  await expect(firstProspect.getByRole('button', { name: 'Shortlist' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Table' }).click();
  await expect(page.getByRole('table', { name: 'B2B prospects' })).toBeVisible();
  await page.getByRole('button', { name: 'Creators' }).click();
  await expect(page.getByRole('heading', { name: 'What kind of list are you reviewing?' })).toBeVisible();
  await importWorkbook(page, creatorPath);
  await expect(page.getByRole('heading', { name: 'Creator partnership workspace' })).toBeVisible();
  await expect(page.getByText('Creator 1', { exact: true }).first()).toBeVisible();
  await page.locator('.creator-card').first().getByRole('button', { name: 'Approve' }).click();

  await page.getByRole('button', { name: 'B2B Prospects' }).click();
  await expect(page.getByRole('heading', { name: 'Prospect review workspace' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'B2B prospects' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Shortlisted: toggle shortlist for Prospect 1/ })).toBeVisible();
});

test('B2B review supports comparison and full-fidelity export', async ({ page }, testInfo) => {
  const b2bPath = createWorkbook(b2bRows(3), 'compare.xlsx', testInfo);
  await page.goto('/');
  await page.getByRole('button', { name: /B2B prospect list/ }).click();
  await importWorkbook(page, b2bPath);
  const cards = page.locator('.prospect-card');
  await cards.nth(0).getByRole('button', { name: 'Compare' }).click();
  await cards.nth(1).getByRole('button', { name: 'Compare' }).click();
  await page.getByRole('button', { name: 'Compare 2' }).click();
  await expect(page.getByRole('heading', { name: 'Compare 2 prospects' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Prospect comparison' })).toBeVisible();
  await page.getByRole('button', { name: 'Close detail panel' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Export', { exact: true }).click();
  await page.getByRole('button', { name: 'All (3)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bntyful-b2b-all-\d{4}-\d{2}-\d{2}\.csv$/);
});
