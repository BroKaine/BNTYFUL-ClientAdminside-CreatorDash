import type { CreatorRecord } from '@/features/import/model/import.types';
import type { StoredDecision } from '@/shared/lib/persistence';
import { matchesTaxonomy } from '@/shared/lib/taxonomy';

export type CreatorDecision = 'Approved' | 'Not approved';
export type CreatorStoredDecision = StoredDecision<CreatorDecision>;

export interface CreatorFilters {
  search: string;
  categories: string[];
  subcategories: string[];
  tiers: string[];
  regions: string[];
  languages: string[];
  platforms: string[];
  scoreMin: number | null;
  scoreMax: number | null;
  audienceMin: number | null;
  audienceMax: number | null;
  dmViableOnly: boolean;
  review: 'all' | 'approved' | 'unreviewed';
}

export type CreatorSort = 'score-desc' | 'score-asc' | 'audience-desc' | 'audience-asc' | 'name-asc';

export const INITIAL_CREATOR_FILTERS: CreatorFilters = {
  search: '', categories: [], subcategories: [], tiers: [], regions: [], languages: [], platforms: [],
  scoreMin: null, scoreMax: null, audienceMin: null, audienceMax: null, dmViableOnly: false, review: 'all',
};

export function filterCreators(
  records: CreatorRecord[],
  filters: CreatorFilters,
  decisions: Map<string, CreatorStoredDecision>,
  skip?: keyof CreatorFilters,
): CreatorRecord[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return records.filter(record => {
    if (skip !== 'search' && search && !record.searchText.includes(search)) return false;
    if (skip !== 'categories' && !matchesTaxonomy(record.category, filters.categories)) return false;
    if (skip !== 'subcategories' && !matchesTaxonomy(record.subcategory, filters.subcategories)) return false;
    if (skip !== 'tiers' && !matchesTaxonomy(record.tier, filters.tiers)) return false;
    if (skip !== 'regions' && !matchesTaxonomy(record.region, filters.regions)) return false;
    if (skip !== 'languages' && !matchesTaxonomy(record.language, filters.languages)) return false;
    if (skip !== 'platforms' && filters.platforms.length && !matchesTaxonomy(record.primaryPlatform, filters.platforms)) return false;
    if (skip !== 'scoreMin' && filters.scoreMin !== null && (record.sourceTotalScore === null || record.sourceTotalScore < filters.scoreMin)) return false;
    if (skip !== 'scoreMax' && filters.scoreMax !== null && (record.sourceTotalScore === null || record.sourceTotalScore > filters.scoreMax)) return false;
    if (skip !== 'audienceMin' && filters.audienceMin !== null && (record.audienceSize === null || record.audienceSize < filters.audienceMin)) return false;
    if (skip !== 'audienceMax' && filters.audienceMax !== null && (record.audienceSize === null || record.audienceSize > filters.audienceMax)) return false;
    if (skip !== 'dmViableOnly' && filters.dmViableOnly && record.dmViable !== true) return false;
    const decision = decisions.get(record.id)?.decision;
    if (skip !== 'review' && filters.review === 'approved' && decision !== 'Approved') return false;
    if (skip !== 'review' && filters.review === 'unreviewed' && decision) return false;
    return true;
  });
}

export function sortCreators(records: CreatorRecord[], sort: CreatorSort): CreatorRecord[] {
  return [...records].sort((a, b) => {
    if (sort === 'name-asc') return a.creatorName.localeCompare(b.creatorName);
    if (sort === 'audience-asc') return (a.audienceSize ?? Infinity) - (b.audienceSize ?? Infinity);
    if (sort === 'audience-desc') return (b.audienceSize ?? -Infinity) - (a.audienceSize ?? -Infinity);
    if (sort === 'score-asc') return (a.sourceTotalScore ?? Infinity) - (b.sourceTotalScore ?? Infinity);
    return (b.sourceTotalScore ?? -Infinity) - (a.sourceTotalScore ?? -Infinity) || a.creatorName.localeCompare(b.creatorName);
  });
}

export function migrateLegacyCreatorApprovals(records: CreatorRecord[]): Map<string, CreatorStoredDecision> {
  if (typeof localStorage === 'undefined') return new Map();
  const sample = records.slice(0, 5).map(record => record.creatorName).join('|');
  let hash = 0;
  for (let index = 0; index < sample.length; index += 1) {
    hash = ((hash << 5) - hash) + sample.charCodeAt(index);
    hash |= 0;
  }
  const legacyKey = `influencer_approvals_${hash}_${records.length}`;
  try {
    const raw = localStorage.getItem(legacyKey);
    const oldIds: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(oldIds)) return new Map();
    const oldIdSet = new Set(oldIds.filter((value): value is string => typeof value === 'string'));
    const decisions = new Map<string, CreatorStoredDecision>();
    records.forEach(record => {
      const legacyId = `inf_${record.rowNumber - 1}_${record.creatorName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;
      if (oldIdSet.has(legacyId)) decisions.set(record.id, { recordId: record.id, decision: 'Approved', reviewedAt: new Date().toISOString(), schemaVersion: 2 });
    });
    return decisions;
  } catch {
    return new Map();
  }
}
