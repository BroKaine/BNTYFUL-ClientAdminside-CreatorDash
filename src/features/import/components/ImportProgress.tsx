import { FileSearch, X } from 'lucide-react';
import type { ImportStatus } from '../hooks/useWorkbookImport';

interface ImportProgressProps {
  status: ImportStatus;
  progress: number;
  onCancel(): void;
}

const LABELS: Partial<Record<ImportStatus, string>> = {
  reading: 'Reading workbook',
  detecting: 'Detecting list structure',
  normalizing: 'Normalizing source values',
  validating: 'Validating records and evidence',
};

export function ImportProgress({ status, progress, onCancel }: ImportProgressProps) {
  return (
    <main id="main-content" className="processing-state" aria-live="polite">
      <span className="processing-state__icon"><FileSearch /></span>
      <p className="eyebrow">Private, in-browser processing</p>
      <h1>{LABELS[status] ?? 'Preparing your dashboard'}</h1>
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>{progress}% complete</p>
      <button type="button" className="button button--secondary" onClick={onCancel}><X size={16} /> Cancel import</button>
    </main>
  );
}
