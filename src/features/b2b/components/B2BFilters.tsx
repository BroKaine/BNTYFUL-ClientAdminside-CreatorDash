import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import { FilterMenu } from '@/shared/components/FilterMenu';
import { deriveTaxonomy } from '@/shared/lib/taxonomy';
import { filterB2B, INITIAL_B2B_FILTERS, type B2BFilters as FilterState, type B2BSort, type B2BStoredDecision } from '../model/b2b.model';

interface B2BFiltersProps {
  records: B2BRecord[];
  filteredCount: number;
  filters: FilterState;
  sort: B2BSort;
  decisions: Map<string, B2BStoredDecision>;
  onFilters(filters: FilterState): void;
  onSort(sort: B2BSort): void;
}

function activeCount(filters: FilterState): number {
  return Object.entries(filters).filter(([key, value]) => {
    const initial = INITIAL_B2B_FILTERS[key as keyof FilterState];
    return Array.isArray(value) ? value.length > 0 : value !== initial;
  }).length;
}

export function B2BFilters({ records, filteredCount, filters, sort, decisions, onFilters, onSort }: B2BFiltersProps) {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => onFilters({ ...filters, [key]: value });
  const facets = <K extends 'categories' | 'subcategories' | 'locations' | 'tiers' | 'statuses' | 'responseTypes' | 'callOutcomes' | 'dealPotentials' | 'channels'>(key: K, accessor: (record: B2BRecord) => string) =>
    deriveTaxonomy(filterB2B(records, filters, decisions, key), accessor);
  const count = activeCount(filters);
  const hasPipeline = records.some(record => record.status || record.responseType || record.callOutcome || record.dealPotential || record.channel);
  return (
    <section className="filter-shell" aria-label="B2B prospect filters">
      <div className="filter-primary">
        <label className="search-box"><Search size={17} /><span className="sr-only">Search B2B prospects</span><input value={filters.search} onChange={event => update('search', event.target.value)} placeholder="Search companies, people or research…" /></label>
        <FilterMenu label="Category" options={facets('categories', record => record.category)} selected={filters.categories} onChange={value => update('categories', value)} />
        <FilterMenu label="Subcategory" options={facets('subcategories', record => record.subcategory)} selected={filters.subcategories} onChange={value => update('subcategories', value)} />
        <FilterMenu label="Location" options={facets('locations', record => record.location)} selected={filters.locations} onChange={value => update('locations', value)} />
        <FilterMenu label="Tier" options={facets('tiers', record => record.tier)} selected={filters.tiers} onChange={value => update('tiers', value)} />
        <details className="filter-menu advanced-menu">
          <summary className="filter-menu__trigger"><SlidersHorizontal size={14} /> Advanced</summary>
          <div className="filter-menu__popover advanced-menu__popover">
            <div className="range-grid">
              <label>Total score minimum<input type="number" value={filters.scoreMin ?? ''} onChange={event => update('scoreMin', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Total score maximum<input type="number" value={filters.scoreMax ?? ''} onChange={event => update('scoreMax', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Campaign readiness min<input type="number" min="0" max="5" value={filters.campaignReadinessMin ?? ''} onChange={event => update('campaignReadinessMin', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Spend signal min<input type="number" min="0" max="5" value={filters.spendSignalMin ?? ''} onChange={event => update('spendSignalMin', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Execution pain min<input type="number" min="0" max="5" value={filters.executionPainMin ?? ''} onChange={event => update('executionPainMin', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Access min<input type="number" min="0" max="5" value={filters.accessMin ?? ''} onChange={event => update('accessMin', event.target.value ? Number(event.target.value) : null)} /></label>
              <label>Date added from<input type="date" value={filters.dateFrom} onChange={event => update('dateFrom', event.target.value)} /></label>
              <label>Date added to<input type="date" value={filters.dateTo} onChange={event => update('dateTo', event.target.value)} /></label>
            </div>
            <label className="select-label">Contactability<select value={filters.contactability} onChange={event => update('contactability', event.target.value as FilterState['contactability'])}><option value="">Any</option><option value="any">Any contact route</option><option value="email">Email</option><option value="linkedin-profile">Decision-maker LinkedIn</option><option value="company-linkedin">Company LinkedIn</option><option value="website">Website</option><option value="instagram">Instagram</option></select></label>
            <label className="select-label">Date availability<select value={filters.dateMode} onChange={event => update('dateMode', event.target.value as FilterState['dateMode'])}><option value="any">Any</option><option value="dated">Has date added</option><option value="undated">Undated</option></select></label>
            <label className="select-label">Data quality<select value={filters.dataQuality} onChange={event => update('dataQuality', event.target.value as FilterState['dataQuality'])}><option value="">Any</option><option value="warnings">Has warnings</option><option value="missing-decision-maker">Missing decision maker</option><option value="missing-contact">Missing contact route</option><option value="score-discrepancy">Score discrepancy</option></select></label>
          </div>
        </details>
      </div>
      <div className="filter-secondary">
        <div className="segmented" aria-label="Review status">{(['all', 'unreviewed', 'shortlisted', 'not-fit', 'reviewed'] as const).map(value => <button type="button" key={value} className={filters.review === value ? 'is-active' : ''} onClick={() => update('review', value)}>{value === 'not-fit' ? 'Not a fit' : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        {hasPipeline && <div className="pipeline-filters"><FilterMenu label="Status" options={facets('statuses', record => record.status)} selected={filters.statuses} onChange={value => update('statuses', value)} /><FilterMenu label="Response" options={facets('responseTypes', record => record.responseType)} selected={filters.responseTypes} onChange={value => update('responseTypes', value)} /><FilterMenu label="Outcome" options={facets('callOutcomes', record => record.callOutcome)} selected={filters.callOutcomes} onChange={value => update('callOutcomes', value)} /><FilterMenu label="Deal" options={facets('dealPotentials', record => record.dealPotential)} selected={filters.dealPotentials} onChange={value => update('dealPotentials', value)} /><FilterMenu label="Channel" options={facets('channels', record => record.channel)} selected={filters.channels} onChange={value => update('channels', value)} /></div>}
        <label className="sort-control"><span>Sort</span><select value={sort} onChange={event => onSort(event.target.value as B2BSort)}><option value="score-desc">Score: high to low</option><option value="score-asc">Score: low to high</option><option value="company-asc">Company: A to Z</option><option value="category-asc">Category</option><option value="location-asc">Location</option><option value="date-desc">Newest added</option><option value="campaign-desc">Campaign readiness</option><option value="spend-desc">Spend signal</option><option value="pain-desc">Execution pain</option><option value="access-desc">Access</option></select></label>
      </div>
      <div className="result-meta"><span><Filter size={14} /> Showing <strong>{filteredCount}</strong> of {records.length} prospects</span>{count > 0 && <button type="button" onClick={() => onFilters(INITIAL_B2B_FILTERS)}><X size={13} /> Clear {count} filter{count === 1 ? '' : 's'}</button>}</div>
    </section>
  );
}
