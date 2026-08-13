import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CreatorRecord } from '@/features/import/model/import.types';
import { FilterMenu } from '@/shared/components/FilterMenu';
import { deriveTaxonomy } from '@/shared/lib/taxonomy';
import { filterCreators, INITIAL_CREATOR_FILTERS, type CreatorFilters as FilterState, type CreatorSort, type CreatorStoredDecision } from '../model/creator.model';

interface CreatorFiltersProps {
  records: CreatorRecord[];
  filteredCount: number;
  filters: FilterState;
  sort: CreatorSort;
  decisions: Map<string, CreatorStoredDecision>;
  onFilters(filters: FilterState): void;
  onSort(sort: CreatorSort): void;
}

export function CreatorFilters({ records, filteredCount, filters, sort, decisions, onFilters, onSort }: CreatorFiltersProps) {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => onFilters({ ...filters, [key]: value });
  const facets = <K extends 'categories' | 'subcategories' | 'tiers' | 'regions' | 'languages' | 'platforms'>(key: K, accessor: (record: CreatorRecord) => string) => deriveTaxonomy(filterCreators(records, filters, decisions, key), accessor);
  const active = Object.entries(filters).filter(([key, value]) => Array.isArray(value) ? value.length : value !== INITIAL_CREATOR_FILTERS[key as keyof FilterState]).length;
  return (
    <section className="filter-shell" aria-label="Creator filters">
      <div className="filter-primary">
        <label className="search-box"><Search size={17} /><span className="sr-only">Search creators</span><input value={filters.search} onChange={event => update('search', event.target.value)} placeholder="Search creators, regions or research…" /></label>
        <FilterMenu label="Category" options={facets('categories', record => record.category)} selected={filters.categories} onChange={value => update('categories', value)} />
        <FilterMenu label="Subcategory" options={facets('subcategories', record => record.subcategory)} selected={filters.subcategories} onChange={value => update('subcategories', value)} />
        <FilterMenu label="Platform" options={facets('platforms', record => record.primaryPlatform)} selected={filters.platforms} onChange={value => update('platforms', value)} />
        <FilterMenu label="Region" options={facets('regions', record => record.region)} selected={filters.regions} onChange={value => update('regions', value)} />
        <FilterMenu label="Language" options={facets('languages', record => record.language)} selected={filters.languages} onChange={value => update('languages', value)} />
        <FilterMenu label="Tier" options={facets('tiers', record => record.tier)} selected={filters.tiers} onChange={value => update('tiers', value)} />
        <details className="filter-menu advanced-menu"><summary className="filter-menu__trigger"><SlidersHorizontal size={14} /> Advanced</summary><div className="filter-menu__popover advanced-menu__popover"><div className="range-grid"><label>Audience minimum<input type="number" value={filters.audienceMin ?? ''} onChange={event => update('audienceMin', event.target.value ? Number(event.target.value) : null)} /></label><label>Audience maximum<input type="number" value={filters.audienceMax ?? ''} onChange={event => update('audienceMax', event.target.value ? Number(event.target.value) : null)} /></label><label>Total score minimum<input type="number" value={filters.scoreMin ?? ''} onChange={event => update('scoreMin', event.target.value ? Number(event.target.value) : null)} /></label><label>Total score maximum<input type="number" value={filters.scoreMax ?? ''} onChange={event => update('scoreMax', event.target.value ? Number(event.target.value) : null)} /></label></div><label className="check-label"><input type="checkbox" checked={filters.dmViableOnly} onChange={event => update('dmViableOnly', event.target.checked)} /> DM viable only</label></div></details>
      </div>
      <div className="filter-secondary"><div className="segmented" aria-label="Creator review status">{(['all', 'unreviewed', 'approved'] as const).map(value => <button type="button" key={value} className={filters.review === value ? 'is-active' : ''} onClick={() => update('review', value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><label className="sort-control"><span>Sort</span><select value={sort} onChange={event => onSort(event.target.value as CreatorSort)}><option value="score-desc">Score: high to low</option><option value="score-asc">Score: low to high</option><option value="audience-desc">Audience: high to low</option><option value="audience-asc">Audience: low to high</option><option value="name-asc">Name: A to Z</option></select></label></div>
      <div className="result-meta"><span><Filter size={14} /> Showing <strong>{filteredCount}</strong> of {records.length} creators</span>{active > 0 && <button type="button" onClick={() => onFilters(INITIAL_CREATOR_FILTERS)}><X size={13} /> Clear {active} filter{active === 1 ? '' : 's'}</button>}</div>
    </section>
  );
}
