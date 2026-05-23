import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import type { Influencer } from '@/types/influencer';
import { useApp } from '@/context/AppContext';
import { useActiveFilterCount } from '@/hooks/useFilters';
import { getFollowerTier, FOLLOWER_TIER_CONFIG } from '@/utils/formatters';
import { isValidUrl } from '@/utils/validators';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  counts?: Record<string, number>;
}

const FilterDropdown = memo(function FilterDropdown({ label, options, selected, onChange, counts }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] transition-colors ${
          selected.length > 0
            ? 'border-teal-300 bg-teal-50 text-teal-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="ml-1 text-[11px] font-semibold bg-teal-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No options available</div>
          ) : (
            <>
              <div className="px-3 py-1.5 border-b border-gray-100 flex gap-2">
                <button onClick={() => onChange(options)} className="text-[11px] text-teal-600 hover:underline">Select All</button>
                <button onClick={() => onChange([])} className="text-[11px] text-gray-400 hover:underline">Clear</button>
              </div>
              {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggleOption(opt)}
                    className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex-1 truncate">{opt}</span>
                  {counts?.[opt] !== undefined && <span className="text-[11px] text-gray-400">({counts[opt]})</span>}
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
});

// Size filter options with config keys
const SIZE_FILTER_OPTIONS: ('all' | 'huge' | 'mega' | 'medium' | 'small' | 'micro' | 'nano')[] = [
  'all', 'huge', 'mega', 'medium', 'small', 'micro', 'nano'
];

interface FilterBarProps {
  influencers: Influencer[];
  filterOptions: {
    tiers: string[];
    categories: string[];
    subcategories: string[];
    platforms: string[];
    regions: string[];
    languages: string[];
  };
}

export default function FilterBar({ influencers, filterOptions }: FilterBarProps) {
  const { state, setFilter, clearFilters, setSort } = useApp();
  const { filters, sortBy, approvedIds, rawData } = state;
  const activeCount = useActiveFilterCount(filters);
  const [searchDebounce, setSearchDebounce] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchDebounce);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchDebounce, setFilter]);

  // Compute option counts for standard dropdowns
  const getCounts = (field: keyof Influencer) => {
    const counts: Record<string, number> = {};
    influencers.forEach(i => {
      const val = i[field] as string;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  // Compute platform counts from URLs (for the platform filter dropdown)
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    influencers.forEach(i => {
      if (isValidUrl(i.tiktokUrl)) counts['TikTok'] = (counts['TikTok'] || 0) + 1;
      if (isValidUrl(i.instagramUrl)) counts['Instagram'] = (counts['Instagram'] || 0) + 1;
      if (isValidUrl(i.youtubeUrl)) counts['YouTube'] = (counts['YouTube'] || 0) + 1;
      if (isValidUrl(i.twitterUrl)) counts['X'] = (counts['X'] || 0) + 1;
    });
    return counts;
  }, [influencers]);

  // Compute follower tier counts from rawData
  const followerTierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawData.length, huge: 0, mega: 0, medium: 0, small: 0, micro: 0, nano: 0 };
    rawData.forEach(i => {
      const tier = getFollowerTier(i.audienceSize);
      counts[tier]++;
    });
    return counts;
  }, [rawData]);

  // Active filter chips
  const chips: { label: string; value: string; onRemove: () => void }[] = [];
  if (filters.search) chips.push({ label: 'Search', value: filters.search, onRemove: () => { setSearchDebounce(''); setFilter('search', ''); } });
  filters.tiers.forEach(t => chips.push({ label: 'Tier', value: t, onRemove: () => setFilter('tiers', filters.tiers.filter(x => x !== t)) }));
  filters.categories.forEach(c => chips.push({ label: 'Category', value: c, onRemove: () => setFilter('categories', filters.categories.filter(x => x !== c)) }));
  filters.subcategories.forEach(s => chips.push({ label: 'Subcategory', value: s, onRemove: () => setFilter('subcategories', filters.subcategories.filter(x => x !== s)) }));
  filters.platforms.forEach(p => chips.push({ label: 'Platform', value: p, onRemove: () => setFilter('platforms', filters.platforms.filter(x => x !== p)) }));
  filters.regions.forEach(r => chips.push({ label: 'Region', value: r, onRemove: () => setFilter('regions', filters.regions.filter(x => x !== r)) }));
  filters.languages.forEach(l => chips.push({ label: 'Language', value: l, onRemove: () => setFilter('languages', filters.languages.filter(x => x !== l)) }));
  if (filters.audienceMin !== null || filters.audienceMax !== null) {
    const range = `${filters.audienceMin || 0} - ${filters.audienceMax || '∞'}`;
    chips.push({ label: 'Audience', value: range, onRemove: () => { setFilter('audienceMin', null); setFilter('audienceMax', null); } });
  }
  if (filters.scoreMin !== null || filters.scoreMax !== null) {
    const range = `${filters.scoreMin || 0} - ${filters.scoreMax || '∞'}`;
    chips.push({ label: 'Score', value: range, onRemove: () => { setFilter('scoreMin', null); setFilter('scoreMax', null); } });
  }
  if (filters.approvalStatus !== 'all') chips.push({ label: 'Status', value: filters.approvalStatus, onRemove: () => setFilter('approvalStatus', 'all') });
  if (filters.dmViableOnly) chips.push({ label: 'DM Viable', value: 'Yes', onRemove: () => setFilter('dmViableOnly', false) });
  if (filters.followerTier !== 'all') chips.push({ label: 'Size', value: filters.followerTier, onRemove: () => setFilter('followerTier', 'all') });

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 max-w-[1400px] mx-auto space-y-3">
      {/* Row 1: Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchDebounce}
            onChange={e => setSearchDebounce(e.target.value)}
            className="pl-9 pr-4 py-2 w-48 sm:w-56 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <FilterDropdown label="Tier" options={filterOptions.tiers} selected={filters.tiers} onChange={v => setFilter('tiers', v)} counts={getCounts('tier')} />
        <FilterDropdown label="Category" options={filterOptions.categories} selected={filters.categories} onChange={v => setFilter('categories', v)} counts={getCounts('category')} />
        <FilterDropdown label="Subcategory" options={filterOptions.subcategories} selected={filters.subcategories} onChange={v => setFilter('subcategories', v)} counts={getCounts('subcategory')} />
        <FilterDropdown label="Platform" options={filterOptions.platforms} selected={filters.platforms} onChange={v => setFilter('platforms', v)} counts={platformCounts} />
        <FilterDropdown label="Region" options={filterOptions.regions} selected={filters.regions} onChange={v => setFilter('regions', v)} counts={getCounts('region')} />
        <FilterDropdown label="Language" options={filterOptions.languages} selected={filters.languages} onChange={v => setFilter('languages', v)} counts={getCounts('language')} />

        {/* Approval Status Toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['all', 'approved', 'pending'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter('approvalStatus', status)}
              className={`px-3 py-2 text-[12px] font-medium transition-colors ${
                filters.approvalStatus === status
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* DM Viable Checkbox */}
        <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.dmViableOnly}
            onChange={e => setFilter('dmViableOnly', e.target.checked)}
            className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
          />
          DM Viable
        </label>

        {/* Clear All */}
        {activeCount > 0 && (
          <button
            onClick={() => { clearFilters(); setSearchDebounce(''); }}
            className="flex items-center gap-1 text-[13px] text-teal-600 hover:text-teal-700 font-medium"
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>

      {/* Row 2: Follower Size Filter with colored dots + Sort */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mr-1">Size</span>
          {SIZE_FILTER_OPTIONS.map(key => {
            const isActive = filters.followerTier === key;
            const count = followerTierCounts[key] || 0;
            const config = key === 'all' ? null : FOLLOWER_TIER_CONFIG[key];
            return (
              <button
                key={key}
                onClick={() => setFilter('followerTier', key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  isActive
                    ? key === 'all'
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={isActive && config ? { backgroundColor: config.bgColor, color: config.dotColor, borderColor: config.dotColor } : {}}
                title={config?.range || 'All follower sizes'}
              >
                {config && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: config.dotColor }}
                  />
                )}
                {key === 'all' ? 'All' : config?.label}
                <span className={`text-[10px] px-1 py-0.5 rounded ${
                  isActive
                    ? key === 'all'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-white/20 text-current'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div className="shrink-0">
          <select
            value={sortBy}
            onChange={e => setSort(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            <option value="default">Sort: Default</option>
            <option value="score-desc">Score: High to Low</option>
            <option value="score-asc">Score: Low to High</option>
            <option value="audience-desc">Audience: Large to Small</option>
            <option value="audience-asc">Audience: Small to Large</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {chips.map((chip, i) => (
            <span
              key={`${chip.label}-${chip.value}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[12px] font-medium"
            >
              {chip.label}: {chip.value}
              <button onClick={chip.onRemove} className="hover:text-teal-900 ml-0.5">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-[12px] text-gray-500">
          Showing <span className="font-semibold text-gray-700">{influencers.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{rawData.length}</span> influencers
        </p>
        <p className="text-[12px] text-emerald-600 font-medium">
          Approved: {approvedIds.size} of {influencers.length}
        </p>
      </div>
    </div>
  );
}
