import { useCallback, useEffect, useMemo, useState } from 'react';
import { Columns3, Download, FileQuestion, GitCompareArrows, Grid2X2, Table2, X } from 'lucide-react';
import type { B2BRecord, ImportResult } from '@/features/import/model/import.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { createFullFidelityCsv, downloadCsv } from '@/shared/lib/csv';
import { loadDecisions, loadPreference, loadSessionJson, saveDecisions, savePreference, saveSessionJson } from '@/shared/lib/persistence';
import { B2BFilters } from './B2BFilters';
import { B2BSummary } from './B2BSummary';
import { B2BProspectCard } from './B2BProspectCard';
import { B2BProspectTable } from './B2BProspectTable';
import { B2BProspectDetail } from './B2BProspectDetail';
import { B2BCompareView } from './B2BCompareView';
import { filterB2B, INITIAL_B2B_FILTERS, sortB2B, type B2BDecision, type B2BFilters as FilterState, type B2BSort, type B2BStoredDecision } from '../model/b2b.model';

interface B2BDashboardProps {
  result: ImportResult<B2BRecord>;
  registerActions(actions: React.ReactNode): void;
}

export function B2BDashboard({ result, registerActions }: B2BDashboardProps) {
  const records = result.records;
  const reviewKey = `bntyful:b2b:review:v1:${result.fingerprint}`;
  const prefKey = `bntyful:b2b:prefs:v1:${result.fingerprint}`;
  const sessionKey = `bntyful:b2b:session:v1:${result.fingerprint}`;
  const session = loadSessionJson<{ filters: FilterState; sort: B2BSort }>(sessionKey, { filters: INITIAL_B2B_FILTERS, sort: 'score-desc' });
  const [filters, setFilters] = useState<FilterState>(session.filters);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [sort, setSort] = useState<B2BSort>(session.sort);
  const [decisions, setDecisions] = useState<Map<string, B2BStoredDecision>>(() => loadDecisions(reviewKey, ['Shortlisted', 'Not a fit']));
  const [view, setView] = useState<'cards' | 'table'>(() => loadPreference(prefKey, ['cards', 'table'], records.length >= 100 ? 'table' : 'cards'));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [cardPage, setCardPage] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [debouncedSearch, filters]);
  const filtered = useMemo(() => sortB2B(filterB2B(records, effectiveFilters, decisions), sort), [records, effectiveFilters, decisions, sort]);
  const activeIndex = filtered.findIndex(record => record.id === activeId);
  const active = activeIndex >= 0 ? filtered[activeIndex] : null;
  const compared = records.filter(record => compareIds.has(record.id));
  const cardPageSize = 50;
  const cardPageCount = Math.max(1, Math.ceil(filtered.length / cardPageSize));
  const cardRecords = filtered.slice(cardPage * cardPageSize, (cardPage + 1) * cardPageSize);
  const applyFilters = useCallback((next: FilterState) => { setFilters(next); setCardPage(0); }, []);
  const applySort = useCallback((next: B2BSort) => { setSort(next); setCardPage(0); }, []);

  const changeDecision = useCallback((record: B2BRecord, decision: B2BDecision | null) => {
    setDecisions(current => {
      const next = new Map(current);
      if (!decision) next.delete(record.id);
      else next.set(record.id, { recordId: record.id, decision, reviewedAt: new Date().toISOString(), schemaVersion: 1 });
      saveDecisions(reviewKey, next);
      return next;
    });
    setAnnouncement(`${record.companyName} marked ${decision ?? 'unreviewed'}.`);
  }, [reviewKey]);

  const toggleCompare = useCallback((record: B2BRecord) => {
    setCompareIds(current => {
      const next = new Set(current);
      if (next.has(record.id)) next.delete(record.id);
      else if (next.size < 4) next.add(record.id);
      else setAnnouncement('Comparison is limited to four prospects.');
      return next;
    });
  }, []);

  const exportScope = useCallback((scope: 'shortlisted' | 'filtered' | 'all') => {
    const selected = scope === 'all' ? records : scope === 'filtered' ? filtered : records.filter(record => decisions.get(record.id)?.decision === 'Shortlisted');
    if (!selected.length) { setAnnouncement(`No ${scope} prospects are available to export.`); return; }
    const csv = createFullFidelityCsv(selected, result.report.sourceHeaders, decisions);
    downloadCsv(csv, `bntyful-b2b-${scope}-${new Date().toISOString().slice(0, 10)}.csv`);
    setAnnouncement(`Exported ${selected.length} ${scope} prospects.`);
  }, [decisions, filtered, records, result.report.sourceHeaders]);

  useEffect(() => { savePreference(prefKey, view); }, [prefKey, view]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 200); return () => window.clearTimeout(timer); }, [filters.search]);
  useEffect(() => { saveSessionJson(sessionKey, { filters, sort }); }, [filters, sessionKey, sort]);
  useEffect(() => {
    registerActions(<details className="export-menu"><summary className="header-button header-button--accent"><Download size={15} /> Export</summary><div><button type="button" onClick={() => exportScope('shortlisted')}>Shortlisted ({[...decisions.values()].filter(value => value.decision === 'Shortlisted').length})</button><button type="button" onClick={() => exportScope('filtered')}>Filtered ({filtered.length})</button><button type="button" onClick={() => exportScope('all')}>All ({records.length})</button></div></details>);
    return () => registerActions(null);
  }, [decisions, exportScope, filtered.length, records.length, registerActions]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement;
      if (typing) return;
      if (event.key === '/') { event.preventDefault(); document.querySelector<HTMLInputElement>('.search-box input')?.focus(); }
      if (event.key === 'Escape') { setActiveId(null); setCompareOpen(false); }
      if ((event.key === 'j' || event.key === 'k') && filtered.length) {
        event.preventDefault();
        const direction = event.key === 'j' ? 1 : -1;
        const next = Math.max(0, Math.min(filtered.length - 1, (activeIndex < 0 ? 0 : activeIndex) + direction));
        setActiveId(filtered[next].id);
      }
      if (event.key === 's' && active) changeDecision(active, decisions.get(active.id)?.decision === 'Shortlisted' ? null : 'Shortlisted');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, activeIndex, changeDecision, decisions, filtered]);

  return (
    <main id="main-content" className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">B2B prospect intelligence</p><h1>Prospect review workspace</h1><p>Validate fit, evidence and access across the current portfolio.</p></div><div className="view-toggle" aria-label="View mode"><button type="button" className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}><Grid2X2 size={15} /> Cards</button><button type="button" className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}><Table2 size={15} /> Table</button></div></div>
      <B2BSummary records={filtered} decisions={decisions} />
      <B2BFilters records={records} filteredCount={filtered.length} filters={filters} sort={sort} decisions={decisions} onFilters={applyFilters} onSort={applySort} />
      {filtered.length === 0 ? <EmptyState icon={FileQuestion} title="No prospects match these filters" message="Clear or adjust the active filters to return to the portfolio." action={<button className="button button--secondary" type="button" onClick={() => applyFilters(INITIAL_B2B_FILTERS)}>Clear filters</button>} /> : view === 'cards' ? <><div className="prospect-list">{cardRecords.map(record => <B2BProspectCard key={record.id} record={record} decision={decisions.get(record.id)?.decision} comparing={compareIds.has(record.id)} onOpen={() => setActiveId(record.id)} onDecision={decision => changeDecision(record, decision)} onCompare={() => toggleCompare(record)} />)}</div>{cardPageCount > 1 && <div className="pagination-bar"><button type="button" disabled={cardPage === 0} onClick={() => setCardPage(page => page - 1)}>Previous 50</button><span>Page {cardPage + 1} of {cardPageCount}</span><button type="button" disabled={cardPage === cardPageCount - 1} onClick={() => setCardPage(page => page + 1)}>Next 50</button></div>}</> : <B2BProspectTable records={filtered} decisions={decisions} compareIds={compareIds} onOpen={record => setActiveId(record.id)} onDecision={changeDecision} onCompare={toggleCompare} />}
      {compareIds.size > 0 && <div className="compare-tray"><span><GitCompareArrows /> <strong>{compareIds.size}</strong> selected for comparison</span><div><button type="button" onClick={() => setCompareIds(new Set())}><X size={14} /> Clear</button><button type="button" className="button button--primary" disabled={compareIds.size < 2} onClick={() => setCompareOpen(true)}><Columns3 size={15} /> Compare {compareIds.size}</button></div></div>}
      {active && <B2BProspectDetail record={active} decision={decisions.get(active.id)?.decision} position={activeIndex} total={filtered.length} onClose={() => setActiveId(null)} onPrevious={() => setActiveId(filtered[Math.max(0, activeIndex - 1)].id)} onNext={() => setActiveId(filtered[Math.min(filtered.length - 1, activeIndex + 1)].id)} onDecision={decision => changeDecision(active, decision)} />}
      {compareOpen && compared.length >= 2 && <B2BCompareView records={compared} onRemove={id => setCompareIds(current => new Set([...current].filter(value => value !== id)))} onClose={() => setCompareOpen(false)} />}
      <div className="sr-only" aria-live="polite">{announcement}</div>
    </main>
  );
}
