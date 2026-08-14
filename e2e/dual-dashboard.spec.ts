import { writeFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { XLSX } from '../scripts/load-official-sheetjs';
import { b2bRows, creatorRows } from '../src/test/builders/workbookRows';
import type { CellValue } from '../src/features/import/model/import.types';

interface HyperlinkSpec {
  rowIndex: number;
  header: string;
  target: string;
}

function columnName(index: number): string {
  let current = index + 1;
  let name = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function createWorkbook(rows: CellValue[][], fileName: string, testInfo: TestInfo, hyperlinks: HyperlinkSpec[] = []): string {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows) as Record<string, { l?: { Target: string } }>;
  hyperlinks.forEach(link => {
    const columnIndex = rows[3].indexOf(link.header);
    if (columnIndex < 0) throw new Error(`Missing hyperlink test header: ${link.header}`);
    const address = `${columnName(columnIndex)}${link.rowIndex + 1}`;
    if (!sheet[address]) throw new Error(`Missing hyperlink test cell: ${address}`);
    sheet[address].l = { Target: link.target };
  });
  XLSX.utils.book_append_sheet(workbook, sheet, 'Research');
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
  await page.locator('.creator-card').first().getByRole('button', { name: 'Approve', exact: true }).click();

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

test('preserves exact Excel hyperlink targets in cards and prospect details', async ({ page }, testInfo) => {
  const rows = b2bRows(1);
  const websiteColumn = rows[3].indexOf('Website');
  const linkedInPageColumn = rows[3].indexOf('LinkedIn Page');
  const linkedInProfileColumn = rows[3].indexOf('LinkedIn Profile');
  rows[4][websiteColumn] = 'Famousbrands.co.za';
  rows[4][linkedInPageColumn] = 'linkedin.com/company/famous-brands';
  rows[4][linkedInProfileColumn] = 'linkedin.com/in/darren-hele';
  const workbookPath = createWorkbook(rows, 'embedded-links.xlsx', testInfo, [
    { rowIndex: 4, header: 'Website', target: 'https://famousbrands.co.za/' },
    { rowIndex: 4, header: 'LinkedIn Page', target: 'https://www.linkedin.com/company/famous-brands/' },
    { rowIndex: 4, header: 'LinkedIn Profile', target: 'https://www.linkedin.com/in/darren-hele-21483b45/' },
  ]);

  await page.goto('/');
  await page.getByRole('button', { name: /B2B prospect list/ }).click();
  await importWorkbook(page, workbookPath);

  const card = page.locator('.prospect-card').first();
  await expect(card.getByRole('link', { name: 'Open Prospect 1 website' })).toHaveAttribute('href', 'https://famousbrands.co.za/');
  await expect(card.getByRole('link', { name: 'Open Decision Maker 1 on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/darren-hele-21483b45/');

  await card.getByRole('button', { name: 'Review full profile' }).click();
  const detail = page.getByRole('dialog', { name: 'Prospect 1', exact: true });
  await expect(detail.getByRole('link', { name: /Company website/ })).toHaveAttribute('href', 'https://famousbrands.co.za/');
  await expect(detail.getByRole('link', { name: /Company LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/company/famous-brands/');
  await expect(detail.getByRole('link', { name: /Decision-maker LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/darren-hele-21483b45/');
});

test('B2B cards stay full-width and collision-free at responsive breakpoints', async ({ page }, testInfo) => {
  const rows = b2bRows(3);
  const headers = rows[3];
  const firstRecord = rows[4];
  const setCell = (header: string, value: CellValue) => {
    const index = headers.indexOf(header);
    if (index < 0) throw new Error(`Missing B2B test header: ${header}`);
    firstRecord[index] = value;
  };
  setCell('Company Name', 'International Hospitality Property Operations Group');
  setCell('Subcategory', 'Multi-market estates, lodges, restaurants and franchise operations');
  setCell('Location (City)', 'Johannesburg, Gauteng, South Africa');
  setCell('Role', 'Group Chief Executive Officer and Operational Transformation Sponsor');
  setCell('Observed Campaign Activity', 'Reported extensive multi-market activity across hospitality, property operations, restaurant portfolios and franchise locations.');
  setCell('Hypothesized Pain', 'A distributed operating model may create fragmented coordination, duplicated processes and inconsistent visibility across teams.');
  setCell('Outreach Angle', 'Lead with a practical operating-intelligence discussion focused on consistency, evidence and measurable execution improvements.');

  const b2bPath = createWorkbook(rows, 'responsive-prospects.xlsx', testInfo);
  await page.goto('/');
  await page.getByRole('button', { name: /B2B prospect list/ }).click();
  await importWorkbook(page, b2bPath);

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 760 },
  ]) {
    await page.setViewportSize(viewport);
    const card = page.locator('.prospect-card').first();
    await expect(card).toBeVisible();

    const layout = await card.evaluate(element => {
      type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
      const box = (target: Element): Box => {
        const rect = target.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const overlaps = (a: Box, b: Box) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
      const required = (selector: string) => {
        const target = element.querySelector(selector);
        if (!target) throw new Error(`Missing responsive card region: ${selector}`);
        return target;
      };
      const cardBox = box(element);
      const primaryRegions = ['.prospect-card__summary', '.prospect-card__insights', '.prospect-card__actions'].map(selector => box(required(selector)));
      const summaryRegions = ['.prospect-card__identity', '.prospect-card__scores', '.prospect-card__contact'].map(selector => box(required(selector)));
      const actionButtons = [...required('.prospect-card__actions').querySelectorAll('button')].map(box);
      const pairsOverlap = (boxes: Box[]) => boxes.some((current, index) => boxes.slice(index + 1).some(next => overlaps(current, next)));
      const descendants = [...element.querySelectorAll('.prospect-card__summary, .prospect-card__insights, .prospect-card__actions, .prospect-card__identity, .prospect-card__scores, .prospect-card__contact')].map(box);
      return {
        card: cardBox,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        primaryOverlap: pairsOverlap(primaryRegions),
        summaryOverlap: pairsOverlap(summaryRegions),
        actionOverlap: pairsOverlap(actionButtons),
        contentEscapesCard: descendants.some(region => region.left < cardBox.left - 0.5 || region.right > cardBox.right + 0.5),
        minimumActionHeight: Math.min(...actionButtons.map(button => button.height)),
        insightWhiteSpace: getComputedStyle(required('.prospect-card__insight p')).whiteSpace,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.card.width).toBeGreaterThanOrEqual(viewport.width - 48);
    expect(layout.primaryOverlap).toBe(false);
    expect(layout.summaryOverlap).toBe(false);
    expect(layout.actionOverlap).toBe(false);
    expect(layout.contentEscapesCard).toBe(false);
    expect(layout.insightWhiteSpace).toBe('normal');
    if (viewport.width <= 390) expect(layout.minimumActionHeight).toBeGreaterThanOrEqual(40);
  }
});
