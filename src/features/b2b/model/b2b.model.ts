import type { B2BRecord } from '@/features/import/model/import.types';
import type { StoredDecision } from '@/shared/lib/persistence';
import { matchesTaxonomy } from '@/shared/lib/taxonomy';

export type B2BDecision = 'Shortlisted' | 'Not a fit';
export type B2BStoredDecision = StoredDecision<B2BDecision>;
export type Contactability = 'any' | 'email' | 'linkedin-profile' | 'company-linkedin' | 'website' | 'instagram';

export interface B2BFilters {
  search: string;
  categories: string[];
  subcategories: string[];
  locations: string[];
  tiers: string[];
  statuses: string[];
  responseTypes: string[];
  callOutcomes: string[];
  dealPotentials: string[];
  channels: string[];
  scoreMin: number | null;
  scoreMax: number | null;
  campaignReadinessMin: number | null;
  spendSignalMin: number | null;
  executionPainMin: number | null;
  accessMin: number | null;
  contactability: Contactability | '';
  dataQuality: '' | 'warnings' | 'missing-decision-maker' | 'missing-contact' | 'score-discrepancy';
  review: 'all' | 'unreviewed' | 'shortlisted' | 'not-fit' | 'reviewed';
  dateFrom: string;
  dateTo: string;
  dateMode: 'any' | 'dated' | 'undated';
}

export type B2BSort =
  | 'score-desc' | 'score-asc' | 'company-asc' | 'category-asc' | 'location-asc'
  | 'date-desc' | 'campaign-desc' | 'spend-desc' | 'pain-desc' | 'access-desc';

export const INITIAL_B2B_FILTERS: B2BFilters = {
  search: '', categories: [], subcategories: [], locations: [], tiers: [], statuses: [], responseTypes: [],
  callOutcomes: [], dealPotentials: [], channels: [], scoreMin: null, scoreMax: null,
  campaignReadinessMin: null, spendSignalMin: null, executionPainMin: null, accessMin: null,
  contactability: '', dataQuality: '', review: 'all', dateFrom: '', dateTo: '', dateMode: 'any',
};

export function hasContact(record: B2BRecord, route: Contactability): boolean {
  if (route === 'email') return record.emails.length > 0;
  if (route === 'linkedin-profile') return Boolean(record.linkedInProfile);
  if (route === 'company-linkedin') return Boolean(record.linkedInPage);
  if (route === 'website') return Boolean(record.website);
  if (route === 'instagram') return Boolean(record.instagramUrl);
  return Boolean(record.emails.length || record.linkedInProfile || record.linkedInPage || record.website || record.instagramUrl);
}

export function filterB2B(
  records: B2BRecord[],
  filters: B2BFilters,
  decisions: Map<string, B2BStoredDecision>,
  skip?: keyof B2BFilters,
): B2BRecord[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return records.filter(record => {
    if (skip !== 'search' && search && !record.searchText.includes(search)) return false;
    if (skip !== 'categories' && !matchesTaxonomy(record.category, filters.categories)) return false;
    if (skip !== 'subcategories' && !matchesTaxonomy(record.subcategory, filters.subcategories)) return false;
    if (skip !== 'locations' && !matchesTaxonomy(record.location, filters.locations)) return false;
    if (skip !== 'tiers' && !matchesTaxonomy(record.tier, filters.tiers)) return false;
    if (skip !== 'statuses' && !matchesTaxonomy(record.status, filters.statuses)) return false;
    if (skip !== 'responseTypes' && !matchesTaxonomy(record.responseType, filters.responseTypes)) return false;
    if (skip !== 'callOutcomes' && !matchesTaxonomy(record.callOutcome, filters.callOutcomes)) return false;
    if (skip !== 'dealPotentials' && !matchesTaxonomy(record.dealPotential, filters.dealPotentials)) return false;
    if (skip !== 'channels' && !matchesTaxonomy(record.channel, filters.channels)) return false;
    if (skip !== 'scoreMin' && filters.scoreMin !== null && (record.sourceTotalScore === null || record.sourceTotalScore < filters.scoreMin)) return false;
    if (skip !== 'scoreMax' && filters.scoreMax !== null && (record.sourceTotalScore === null || record.sourceTotalScore > filters.scoreMax)) return false;
    if (skip !== 'campaignReadinessMin' && filters.campaignReadinessMin !== null && (record.campaignReadiness === null || record.campaignReadiness < filters.campaignReadinessMin)) return false;
    if (skip !== 'spendSignalMin' && filters.spendSignalMin !== null && (record.spendSignal === null || record.spendSignal < filters.spendSignalMin)) return false;
    if (skip !== 'executionPainMin' && filters.executionPainMin !== null && (record.executionPain === null || record.executionPain < filters.executionPainMin)) return false;
    if (skip !== 'accessMin' && filters.accessMin !== null && (record.access === null || record.access < filters.accessMin)) return false;
    if (skip !== 'contactability' && filters.contactability && !hasContact(record, filters.contactability)) return false;
    if (skip !== 'dateFrom' && filters.dateFrom && (!record.dateAdded || record.dateAdded < filters.dateFrom)) return false;
    if (skip !== 'dateTo' && filters.dateTo && (!record.dateAdded || record.dateAdded > filters.dateTo)) return false;
    if (skip !== 'dataQuality' && filters.dataQuality === 'warnings' && record.warnings.length === 0) return false;
    if (skip !== 'dataQuality' && filters.dataQuality === 'missing-decision-maker' && record.decisionMaker) return false;
    if (skip !== 'dataQuality' && filters.dataQuality === 'missing-contact' && hasContact(record, 'any')) return false;
    if (skip !== 'dataQuality' && filters.dataQuality === 'score-discrepancy' && (record.calculatedTotalScore === null || record.calculatedTotalScore === record.sourceTotalScore)) return false;
    if (skip !== 'dateMode' && filters.dateMode === 'dated' && !record.dateAdded) return false;
    if (skip !== 'dateMode' && filters.dateMode === 'undated' && record.dateAdded) return false;
    const decision = decisions.get(record.id)?.decision;
    if (skip !== 'review' && filters.review === 'unreviewed' && decision) return false;
    if (skip !== 'review' && filters.review === 'shortlisted' && decision !== 'Shortlisted') return false;
    if (skip !== 'review' && filters.review === 'not-fit' && decision !== 'Not a fit') return false;
    if (skip !== 'review' && filters.review === 'reviewed' && !decision) return false;
    return true;
  });
}

export function sortB2B(records: B2BRecord[], sort: B2BSort): B2BRecord[] {
  return [...records].sort((a, b) => {
    if (sort === 'company-asc') return a.companyName.localeCompare(b.companyName);
    if (sort === 'category-asc') return a.category.localeCompare(b.category) || a.companyName.localeCompare(b.companyName);
    if (sort === 'location-asc') return a.location.localeCompare(b.location) || a.companyName.localeCompare(b.companyName);
    if (sort === 'date-desc') return b.dateAdded.localeCompare(a.dateAdded);
    if (sort === 'campaign-desc') return (b.campaignReadiness ?? -Infinity) - (a.campaignReadiness ?? -Infinity);
    if (sort === 'spend-desc') return (b.spendSignal ?? -Infinity) - (a.spendSignal ?? -Infinity);
    if (sort === 'pain-desc') return (b.executionPain ?? -Infinity) - (a.executionPain ?? -Infinity);
    if (sort === 'access-desc') return (b.access ?? -Infinity) - (a.access ?? -Infinity);
    if (sort === 'score-asc') return (a.sourceTotalScore ?? Infinity) - (b.sourceTotalScore ?? Infinity);
    return (b.sourceTotalScore ?? -Infinity) - (a.sourceTotalScore ?? -Infinity) || a.companyName.localeCompare(b.companyName);
  });
}
