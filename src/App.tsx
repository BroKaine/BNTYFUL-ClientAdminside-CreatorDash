import { lazy, Suspense, useCallback, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { AppShell } from '@/app/AppShell';
import { ImportLanding } from '@/features/import/components/ImportLanding';
import { ImportPreflight } from '@/features/import/components/ImportPreflight';
import { ImportProgress } from '@/features/import/components/ImportProgress';
import { useWorkbookImport } from '@/features/import/hooks/useWorkbookImport';
import type { B2BRecord, CreatorRecord, DatasetKind, ImportResult } from '@/features/import/model/import.types';
import './App.css';

const CreatorDashboard = lazy(() => import('@/features/creator/components/CreatorDashboard').then(module => ({ default: module.CreatorDashboard })));
const B2BDashboard = lazy(() => import('@/features/b2b/components/B2BDashboard').then(module => ({ default: module.B2BDashboard })));

type LoadedDatasets = Partial<{ creator: ImportResult<CreatorRecord>; b2b: ImportResult<B2BRecord> }>;

export default function App() {
  const [mode, setMode] = useState<DatasetKind>('creator');
  const [datasets, setDatasets] = useState<LoadedDatasets>({});
  const [replaceMode, setReplaceMode] = useState<DatasetKind | null>(null);
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);
  const importer = useWorkbookImport();
  const active = datasets[mode];
  const importing = !active || replaceMode === mode;
  const registerActions = useCallback((actions: React.ReactNode) => setHeaderActions(actions), []);

  const changeMode = (next: DatasetKind) => {
    setMode(next);
    importer.reset();
    setReplaceMode(null);
    setHeaderActions(null);
  };
  const acceptImport = () => {
    const result = importer.state.result;
    if (!result) return;
    setDatasets(current => ({ ...current, [result.kind]: result } as LoadedDatasets));
    setMode(result.kind);
    setReplaceMode(null);
    importer.reset();
  };
  const fileName = active?.report.fileName;
  const busy = ['reading', 'detecting', 'normalizing', 'validating'].includes(importer.state.status);
  return <AppShell mode={mode} onModeChange={changeMode} loadedKinds={Object.keys(datasets) as DatasetKind[]} fileName={fileName} onReplace={active ? () => { setReplaceMode(mode); importer.reset(); setHeaderActions(null); } : undefined} actions={headerActions}>
    {importing && busy && <ImportProgress status={importer.state.status} progress={importer.state.progress} onCancel={() => { importer.cancel(); if (active) setReplaceMode(null); }} />}
    {importing && importer.state.status === 'preflight' && importer.state.result && <ImportPreflight result={importer.state.result} onAccept={acceptImport} onCancel={() => { importer.reset(); if (active) setReplaceMode(null); }} />}
    {importing && !busy && importer.state.status !== 'preflight' && <ImportLanding mode={mode} onModeChange={changeMode} onFile={file => importer.importFile(file, mode)} error={importer.state.error} />}
    {!importing && active && <Suspense fallback={<div className="processing-state"><LoaderCircle className="spin" /><h1>Opening dashboard…</h1></div>}>{mode === 'creator' ? <CreatorDashboard result={active as ImportResult<CreatorRecord>} registerActions={registerActions} /> : <B2BDashboard result={active as ImportResult<B2BRecord>} registerActions={registerActions} />}</Suspense>}
  </AppShell>;
}
