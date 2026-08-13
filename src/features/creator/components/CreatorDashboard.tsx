import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Download, Eye, FileQuestion, Grid2X2, Star, Table2, Users } from 'lucide-react';
import type { CreatorRecord, ImportResult } from '@/features/import/model/import.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { createFullFidelityCsv, downloadCsv } from '@/shared/lib/csv';
import { formatNumber } from '@/shared/lib/normalize';
import { loadDecisions, loadPreference, loadSessionJson, saveDecisions, savePreference, saveSessionJson } from '@/shared/lib/persistence';
import { CreatorFilters } from './CreatorFilters';
import { CreatorCard } from './CreatorCard';
import { CreatorDetail } from './CreatorDetail';
import { CreatorTable } from './CreatorTable';
import { filterCreators, INITIAL_CREATOR_FILTERS, migrateLegacyCreatorApprovals, sortCreators, type CreatorDecision, type CreatorFilters as FilterState, type CreatorSort, type CreatorStoredDecision } from '../model/creator.model';

interface CreatorDashboardProps { result: ImportResult<CreatorRecord>; registerActions(actions: React.ReactNode): void; }

function average(records: CreatorRecord[], accessor: (record: CreatorRecord) => number | null): number | null {
  const values = records.map(accessor).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function CreatorDashboard({ result, registerActions }: CreatorDashboardProps) {
  const records = result.records;
  const reviewKey = `bntyful:creator:review:v2:${result.fingerprint}`;
  const prefKey = `bntyful:creator:prefs:v2:${result.fingerprint}`;
  const sessionKey = `bntyful:creator:session:v2:${result.fingerprint}`;
  const session = loadSessionJson<{ filters: FilterState; sort: CreatorSort }>(sessionKey, { filters: INITIAL_CREATOR_FILTERS, sort: 'score-desc' });
  const [filters, setFilters] = useState<FilterState>(session.filters);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [sort, setSort] = useState<CreatorSort>(session.sort);
  const [decisions, setDecisions] = useState<Map<string, CreatorStoredDecision>>(() => { const current = loadDecisions(reviewKey, ['Approved', 'Not approved']); return current.size ? current : migrateLegacyCreatorApprovals(records); });
  const [view, setView] = useState<'cards' | 'table'>(() => loadPreference(prefKey, ['cards', 'table'], records.length >= 100 ? 'table' : 'cards'));
  const [cardPage, setCardPage] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [debouncedSearch, filters]);
  const filtered = useMemo(() => sortCreators(filterCreators(records, effectiveFilters, decisions), sort), [decisions, effectiveFilters, records, sort]);
  const activeIndex = filtered.findIndex(record => record.id === activeId);
  const active = activeIndex >= 0 ? filtered[activeIndex] : null;
  const cardPageSize = 50;
  const cardPageCount = Math.max(1, Math.ceil(filtered.length / cardPageSize));
  const cardRecords = filtered.slice(cardPage * cardPageSize, (cardPage + 1) * cardPageSize);
  const applyFilters = useCallback((next: FilterState) => { setFilters(next); setCardPage(0); }, []);
  const applySort = useCallback((next: CreatorSort) => { setSort(next); setCardPage(0); }, []);

  const changeDecision = useCallback((record: CreatorRecord, decision: CreatorDecision | null) => {
    setDecisions(current => {
      const next = new Map(current);
      if (!decision) next.delete(record.id);
      else next.set(record.id, { recordId: record.id, decision, reviewedAt: new Date().toISOString(), schemaVersion: 2 });
      saveDecisions(reviewKey, next);
      return next;
    });
    setAnnouncement(`${record.creatorName} marked ${decision ?? 'unreviewed'}.`);
  }, [reviewKey]);

  const exportScope = useCallback((scope: 'approved' | 'filtered' | 'all') => {
    const selected = scope === 'all' ? records : scope === 'filtered' ? filtered : records.filter(record => decisions.get(record.id)?.decision === 'Approved');
    if (!selected.length) { setAnnouncement(`No ${scope} creators are available to export.`); return; }
    downloadCsv(createFullFidelityCsv(selected, result.report.sourceHeaders, decisions), `bntyful-creators-${scope}-${new Date().toISOString().slice(0, 10)}.csv`);
    setAnnouncement(`Exported ${selected.length} ${scope} creators.`);
  }, [decisions, filtered, records, result.report.sourceHeaders]);

  useEffect(() => {
    const approvedCount = [...decisions.values()].filter(value => value.decision === 'Approved').length;
    registerActions(<details className="export-menu"><summary className="header-button header-button--accent"><Download size={15} /> Export</summary><div><button type="button" onClick={() => exportScope('approved')}>Approved ({approvedCount})</button><button type="button" onClick={() => exportScope('filtered')}>Filtered ({filtered.length})</button><button type="button" onClick={() => exportScope('all')}>All ({records.length})</button></div></details>);
    return () => registerActions(null);
  }, [decisions, exportScope, filtered.length, records.length, registerActions]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 200); return () => window.clearTimeout(timer); }, [filters.search]);
  useEffect(() => { saveDecisions(reviewKey, decisions); }, [decisions, reviewKey]);
  useEffect(() => { savePreference(prefKey, view); }, [prefKey, view]);
  useEffect(() => { saveSessionJson(sessionKey, { filters, sort }); }, [filters, sessionKey, sort]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement;
      if (typing) return;
      if (event.key === '/') { event.preventDefault(); document.querySelector<HTMLInputElement>('.search-box input')?.focus(); }
      if (event.key === 'Escape') setActiveId(null);
      if ((event.key === 'j' || event.key === 'k') && filtered.length) {
        event.preventDefault(); const direction = event.key === 'j' ? 1 : -1;
        const next = Math.max(0, Math.min(filtered.length - 1, (activeIndex < 0 ? 0 : activeIndex) + direction)); setActiveId(filtered[next].id);
      }
      if (event.key === 's' && active) changeDecision(active, decisions.get(active.id)?.decision === 'Approved' ? null : 'Approved');
    };
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler);
  }, [active, activeIndex, changeDecision, decisions, filtered]);

  const approved = filtered.filter(record => decisions.get(record.id)?.decision === 'Approved').length;
  const averageScore = average(filtered, record => record.sourceTotalScore);
  const averageAudience = average(filtered, record => record.audienceSize);
  const main = [
    { label: 'Matched creators', value: formatNumber(filtered.length), icon: Users, tone: 'blue' },
    { label: 'Approved', value: formatNumber(approved), icon: BadgeCheck, tone: 'green' },
    { label: 'Average total score', value: averageScore === null ? '—' : averageScore.toFixed(1), icon: Star, tone: 'amber' },
    { label: 'Average audience', value: formatNumber(averageAudience), icon: Eye, tone: 'purple' },
  ];
  return <main id="main-content" className="dashboard-page">
    <div className="dashboard-heading"><div><p className="eyebrow">Creator intelligence</p><h1>Creator partnership workspace</h1><p>Review audience, fit, authority, evidence and partnership access.</p></div><div className="view-toggle" aria-label="View mode"><button type="button" className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}><Grid2X2 size={15} /> Cards</button><button type="button" className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}><Table2 size={15} /> Table</button></div></div>
    <section className="kpi-grid" aria-label="Creator overview">{main.map(item => <article className="kpi-card" key={item.label}><span className={`kpi-icon kpi-icon--${item.tone}`}><item.icon /></span><div><small>{item.label}</small><strong>{item.value}</strong></div></article>)}</section>
    <CreatorFilters records={records} filteredCount={filtered.length} filters={filters} sort={sort} decisions={decisions} onFilters={applyFilters} onSort={applySort} />
    {filtered.length === 0 ? <EmptyState icon={FileQuestion} title="No creators match these filters" message="Clear or adjust the active filters to return to the creator list." action={<button className="button button--secondary" type="button" onClick={() => applyFilters(INITIAL_CREATOR_FILTERS)}>Clear filters</button>} /> : view === 'cards' ? <><div className="creator-list">{cardRecords.map(record => <CreatorCard key={record.id} record={record} decision={decisions.get(record.id)?.decision} onOpen={() => setActiveId(record.id)} onDecision={decision => changeDecision(record, decision)} />)}</div>{cardPageCount > 1 && <div className="pagination-bar"><button type="button" disabled={cardPage === 0} onClick={() => setCardPage(page => page - 1)}>Previous 50</button><span>Page {cardPage + 1} of {cardPageCount}</span><button type="button" disabled={cardPage === cardPageCount - 1} onClick={() => setCardPage(page => page + 1)}>Next 50</button></div>}</> : <CreatorTable records={filtered} decisions={decisions} onOpen={record => setActiveId(record.id)} onDecision={changeDecision} />}
    {active && <CreatorDetail record={active} decision={decisions.get(active.id)?.decision} position={activeIndex} total={filtered.length} onClose={() => setActiveId(null)} onPrevious={() => setActiveId(filtered[Math.max(0, activeIndex - 1)].id)} onNext={() => setActiveId(filtered[Math.min(filtered.length - 1, activeIndex + 1)].id)} onDecision={decision => changeDecision(active, decision)} />}
    <div className="sr-only" aria-live="polite">{announcement}</div>
  </main>;
}
