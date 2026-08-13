# BNTYFUL Research Intelligence

A local-first review application for two independent research workflows:

- **Creator Intelligence** — evaluate creators, audiences, content fit, authority, access, evidence, and partnership opportunities.
- **B2B Prospect Intelligence** — evaluate companies, decision makers, qualification signals, commercial hypotheses, evidence, and outreach readiness.

Both dashboards share BNTYFUL's shell and design language. Their schemas, filters, review decisions, persistence, and exports remain independent.

## Privacy and data handling

Workbooks are parsed and normalized in a dedicated in-browser worker pipeline. Workbook data is not uploaded to an application server, analytics service, or LLM. Imported records remain in memory for the current session. Review decisions and small view preferences are stored locally and are scoped to a deterministic dataset fingerprint.

External company/profile links are opened only when a user deliberately selects them.

## Supported files

- `.xlsx`, `.xls`, and `.csv`
- first worksheet only
- maximum 50 MiB
- maximum 25,000 data rows
- supported headers can appear within the first ten non-empty rows

See [docs/workbook-format.md](docs/workbook-format.md) for the complete contracts. Categories, subcategories, locations, tiers, and pipeline values are always derived from the current workbook; no client or industry taxonomy is hardcoded.

## Product workflow

1. Choose Creator or B2B Prospect.
2. Drop or select a workbook.
3. Review the import preflight, including structural and data-quality notes.
4. Continue into the automatically detected dashboard.
5. Search, filter, sort, and switch between cards and a virtualized dense table.
6. Open full evidence and pipeline detail without losing list context.
7. Apply local review decisions: Approved/Not approved for creators; Shortlisted/Not a fit for B2B.
8. Compare two to four B2B prospects.
9. Export approved, shortlisted, filtered, or all records as full-fidelity safe CSV.

## Local development

Requires Node.js 22 or a compatible current LTS release.

```bash
npm ci
npm run dev
```

The Vite development server defaults to `http://localhost:3000`.

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

`npm run check` runs typecheck, lint, unit/integration tests, and a production build.

To validate the two canonical samples without committing their contents:

```bash
npm run validate:samples -- "/path/to/Creator sample.xlsx" "/path/to/B2B sample.xlsx"
```

## Keyboard productivity

- `/` focuses search.
- `j` / `k` opens the next/previous record in the current filtered order.
- `s` toggles approval/shortlist while a detail record is open.
- `Esc` closes detail or comparison and restores focus.

Every shortcut has an ordinary on-screen control; shortcuts are disabled while typing.

## Architecture

See [docs/architecture.md](docs/architecture.md). The core design is:

- `src/features/import` — schema detection, preflight, normalization, issue reporting.
- `src/features/creator` — creator model, selectors, dashboard, details, decisions.
- `src/features/b2b` — B2B model, dynamic faceting, dashboard, table, detail, comparison.
- `src/shared` — domain-neutral links, dates, taxonomy, persistence, CSV, and UI primitives.
- `src/workers` and `public/workers` — isolated normalization and classic parsing workers.
- `public/vendor/sheetjs` — pinned official SheetJS CE browser distribution.

## Security

- Workbook content is treated as untrusted text and rendered through React escaping.
- Macros, formulas, HTML, and embedded scripts are not executed.
- External navigation is limited to safe HTTP(S) links constructed centrally.
- No automatic external image, favicon, metadata, or preview requests are made.
- CSV exports neutralize spreadsheet-formula prefixes.
- The official SheetJS artifact is pinned and checksummed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- CI fails for high/critical production dependency findings.
