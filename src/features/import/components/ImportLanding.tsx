import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Building2, FileSpreadsheet, LockKeyhole, Sparkles, Upload, Users } from 'lucide-react';
import type { DatasetKind } from '../model/import.types';

interface ImportLandingProps {
  mode: DatasetKind;
  onModeChange(mode: DatasetKind): void;
  onFile(file: File): void;
  error?: string;
}

export function ImportLanding({ mode, onModeChange, onFile, error }: ImportLandingProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const acceptFile = (files: FileList | null) => {
    if (files?.[0]) onFile(files[0]);
    if (inputRef.current) inputRef.current.value = '';
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files);
  };
  return (
    <main id="main-content" className="import-page">
      <div className="import-intro">
        <span className="hero-mark"><Sparkles size={18} /> Research intelligence, made reviewable</span>
        <h1>What kind of list are you reviewing?</h1>
        <p>Choose the list type, then bring structured research into a private, decision-ready dashboard.</p>
      </div>
      <div className="mode-cards" aria-label="Choose dashboard type">
        <button type="button" className={mode === 'creator' ? 'mode-card is-selected' : 'mode-card'} onClick={() => onModeChange('creator')} aria-pressed={mode === 'creator'}>
          <span className="mode-card__icon"><Users /></span>
          <span><strong>Creator list</strong><small>Audit creators, reach, fit, evidence and partnership viability.</small></span>
        </button>
        <button type="button" className={mode === 'b2b' ? 'mode-card is-selected' : 'mode-card'} onClick={() => onModeChange('b2b')} aria-pressed={mode === 'b2b'}>
          <span className="mode-card__icon"><Building2 /></span>
          <span><strong>B2B prospect list</strong><small>Review companies, decision makers, qualification and commercial rationale.</small></span>
        </button>
      </div>
      <label
        className={dragging ? 'drop-zone is-dragging' : 'drop-zone'}
        onDragEnter={event => { event.preventDefault(); setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="drop-zone__icon">{dragging ? <Upload /> : <FileSpreadsheet />}</span>
        <h2>{dragging ? 'Drop to begin' : `Upload a ${mode === 'creator' ? 'creator' : 'B2B prospect'} list`}</h2>
        <p>Drop a workbook here or <span>browse your device</span></p>
        <small>.XLSX, .XLS or .CSV · up to 50 MiB · first worksheet</small>
        <input ref={inputRef} aria-label={`Upload ${mode === 'creator' ? 'creator' : 'B2B prospect'} workbook`} type="file" accept=".xlsx,.xls,.csv" onChange={(event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files)} />
      </label>
      {error && <div className="alert alert--error" role="alert"><strong>Import could not start.</strong><span>{error}</span></div>}
      <div className="privacy-note"><LockKeyhole size={16} /><span><strong>Your workbook stays in this browser.</strong> BNTYFUL does not upload its contents to a server.</span></div>
    </main>
  );
}
