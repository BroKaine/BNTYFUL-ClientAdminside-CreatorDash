import type { ReactNode } from 'react';
import { Database, FileSpreadsheet, LockKeyhole, Replace, Users, Building2 } from 'lucide-react';
import type { DatasetKind } from '@/features/import/model/import.types';

interface AppShellProps {
  mode: DatasetKind;
  onModeChange(mode: DatasetKind): void;
  loadedKinds: DatasetKind[];
  fileName?: string;
  onReplace?(): void;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ mode, onModeChange, loadedKinds, fileName, onReplace, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to dashboard</a>
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark"><Database /></span>
          <div><strong>BNTYFUL</strong><small>Research Intelligence</small></div>
        </div>
        <div className="header-context">
          {fileName && <span className="file-chip" title={fileName}><FileSpreadsheet size={15} />{fileName}</span>}
          <span className="privacy-chip" title="Workbook data remains in this browser"><LockKeyhole size={14} /> Local & private</span>
          {onReplace && <button type="button" className="header-button" onClick={onReplace}><Replace size={15} /> Replace list</button>}
          {actions}
        </div>
      </header>
      {(loadedKinds.length > 0 || fileName) && (
        <nav className="mode-tabs" aria-label="Dashboard type">
          <button type="button" aria-current={mode === 'creator' ? 'page' : undefined} className={mode === 'creator' ? 'is-active' : ''} onClick={() => onModeChange('creator')}>
            <Users size={17} /> Creators {loadedKinds.includes('creator') && <span className="loaded-dot" title="Creator list loaded" />}
          </button>
          <button type="button" aria-current={mode === 'b2b' ? 'page' : undefined} className={mode === 'b2b' ? 'is-active' : ''} onClick={() => onModeChange('b2b')}>
            <Building2 size={17} /> B2B Prospects {loadedKinds.includes('b2b') && <span className="loaded-dot" title="B2B list loaded" />}
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}
