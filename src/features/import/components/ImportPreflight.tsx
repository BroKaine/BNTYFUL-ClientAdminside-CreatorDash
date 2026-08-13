import { AlertTriangle, ArrowRight, CheckCircle2, FileSpreadsheet, Link2, Mail, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import type { ImportResult } from '../model/import.types';

interface ImportPreflightProps {
  result: ImportResult;
  onAccept(): void;
  onCancel(): void;
}

export function ImportPreflight({ result, onAccept, onCancel }: ImportPreflightProps) {
  const { report } = result;
  const wrongMode = report.detectedKind !== report.expectedKind;
  const errors = report.issues.filter(issue => issue.severity === 'error');
  const warnings = report.issues.filter(issue => issue.severity === 'warning');
  return (
    <main id="main-content" className="preflight-page">
      <div className="preflight-heading">
        <span className="status-icon status-icon--success"><CheckCircle2 /></span>
        <div><p className="eyebrow">Import preflight</p><h1>Your workbook is ready to review</h1><p>{report.fileName} · {report.sheetName}</p></div>
      </div>
      {wrongMode && (
        <div className="alert alert--info" role="status">
          <ShieldCheck /><span><strong>This is a {report.detectedKind === 'creator' ? 'Creator' : 'B2B prospect'} list.</strong> Continue to open it in the correct dashboard.</span>
        </div>
      )}
      <div className="preflight-grid">
        <article><FileSpreadsheet /><span><strong>{report.recordCount}</strong><small>Valid records</small></span></article>
        <article><Users /><span><strong>{report.contactableCount}</strong><small>Contactable</small></span></article>
        <article><Link2 /><span><strong>{report.repairedUrlCount}</strong><small>Links repaired</small></span></article>
        <article><Mail /><span><strong>{report.multipleEmailCount}</strong><small>Multi-email cells</small></span></article>
        <article><AlertTriangle /><span><strong>{warnings.length}</strong><small>Warnings</small></span></article>
        <article><ShieldCheck /><span><strong>{errors.length}</strong><small>Rows quarantined</small></span></article>
      </div>
      <section className="preflight-summary surface">
        <div className="section-heading"><div><p className="eyebrow">Structure</p><h2>What was detected</h2></div></div>
        <dl className="definition-grid">
          <div><dt>Dashboard</dt><dd>{report.detectedKind === 'creator' ? 'Creator intelligence' : 'B2B prospect intelligence'}</dd></div>
          <div><dt>Header row</dt><dd>{report.headerRowNumber}</dd></div>
          <div><dt>Recognized columns</dt><dd>{report.recognizedHeaders.length}</dd></div>
          <div><dt>Unknown columns retained</dt><dd>{report.unknownHeaders.length}</dd></div>
          <div><dt>Blank rows ignored</dt><dd>{report.blankRowCount}</dd></div>
          <div><dt>Duplicate candidates</dt><dd>{report.duplicateCount}</dd></div>
        </dl>
        {report.additionalSheets.length > 0 && <p className="callout"><strong>First worksheet only:</strong> {report.additionalSheets.length} additional sheet(s) were not imported: {report.additionalSheets.join(', ')}.</p>}
        {report.missingRecommendedHeaders.length > 0 && <p className="callout"><strong>Recommended columns not found:</strong> {report.missingRecommendedHeaders.join(', ')}.</p>}
      </section>
      {report.issues.length > 0 && (
        <details className="issues surface">
          <summary><span><AlertTriangle size={17} /> Inspect {report.issues.length} data-quality item(s)</span><small>Every source value is retained</small></summary>
          <div className="issues-table" role="region" aria-label="Import issues" tabIndex={0}>
            <table><thead><tr><th>Row</th><th>Record</th><th>Field</th><th>Issue</th><th>Source value</th></tr></thead>
              <tbody>{report.issues.slice(0, 250).map(issue => <tr key={issue.id}><td>{issue.rowNumber}</td><td>{issue.recordLabel}</td><td>{issue.field}</td><td><span className={`issue-badge issue-badge--${issue.severity}`}>{issue.severity}</span>{issue.message}</td><td>{issue.sourceValue || '—'}</td></tr>)}</tbody>
            </table>
            {report.issues.length > 250 && <p className="table-note">Showing the first 250 items. All record-level warnings remain available in the dashboard and export.</p>}
          </div>
        </details>
      )}
      <div className="preflight-actions">
        <button type="button" className="button button--secondary" onClick={onCancel}><RotateCcw size={16} /> Choose another file</button>
        <button type="button" className="button button--primary" onClick={onAccept}>{warnings.length || wrongMode ? 'Continue with report' : 'Open dashboard'} <ArrowRight size={16} /></button>
      </div>
    </main>
  );
}
