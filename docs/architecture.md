# Architecture

## Domain boundaries

Creator and B2B are separate feature domains. Each owns its record model, filters, selectors, review terminology, persistence namespace, detail experience, and export scope. Shared code contains only domain-neutral infrastructure and presentation primitives.

## Import pipeline

1. The UI validates extension and the 50 MiB limit.
2. A dedicated classic Web Worker lazy-loads the local, vendored SheetJS parser.
3. The first worksheet is converted to raw row arrays without formula or HTML processing.
4. Weighted signatures detect Creator versus B2B independently.
5. A domain parser preserves source rows while producing typed normalized records and data issues.
6. A deterministic dataset fingerprint is calculated from schema version and sorted stable record IDs.
7. The main thread displays preflight before activating the dashboard.

The worker is terminated after completion, cancellation, or failure.

## Raw and normalized data

Every record contains:

- `source.headers` and `source.values` in source-column order;
- typed normalized fields for display, linking, filtering, scores, and dates;
- a precomputed normalized search string;
- record-level warnings; and
- a stable ID derived from normalized identity signals.

Repairs never overwrite the source map. Full-fidelity export reconstructs the original columns and appends BNTYFUL review metadata.

## State and persistence

- Imported datasets live in application memory.
- The shell can hold one loaded dataset per domain during the session.
- Filter and sort continuity uses guarded `sessionStorage`, namespaced by domain and fingerprint.
- Review decisions and view preference use guarded `localStorage`, namespaced by domain, schema version, and fingerprint.
- Creator v1 approvals are migrated only when their legacy ID confidently matches a normalized creator record.

## Performance

- The parser is excluded from initial bundles and loaded only inside the worker.
- Feature dashboards and detail/compare code are split from the core route.
- Free-text search is debounced by 200 ms.
- Table rows are virtualized with overscan.
- Card mode renders at most 50 records per page.
- Dynamic summaries and filtered/sorted results are memoized.
- A synthetic 10,000-record selector benchmark is enforced by the test suite.

## Security boundaries

- Workbook strings never enter `dangerouslySetInnerHTML`.
- Navigable links are normalized centrally and limited to HTTP(S).
- Imported URLs are not fetched automatically.
- CSV strings beginning with spreadsheet-formula characters after whitespace are prefixed with an apostrophe.
- A restrictive content security policy permits local scripts, styles, images, fonts, and workers only.
