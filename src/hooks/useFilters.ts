import { useMemo } from 'react';
import type { Influencer, Filters, SortOption } from '@/types/influencer';
import { getFollowerTier } from '@/utils/formatters';
import { isValidUrl } from '@/utils/validators';

export function useFilteredAndSortedData(
  rawData: Influencer[],
  filters: Filters,
  sortBy: SortOption,
  approvedIds: Set<string>
): Influencer[] {
  return useMemo(() => {
    let result = [...rawData];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(i =>
        i.creatorName.toLowerCase().includes(searchLower) ||
        i.descriptionNotes.toLowerCase().includes(searchLower) ||
        i.observedActivity.toLowerCase().includes(searchLower) ||
        i.partnershipAngle.toLowerCase().includes(searchLower) ||
        i.region.toLowerCase().includes(searchLower) ||
        i.subcategory.toLowerCase().includes(searchLower)
      );
    }

    if (filters.tiers.length > 0) {
      result = result.filter(i => filters.tiers.includes(i.tier));
    }

    if (filters.categories.length > 0) {
      result = result.filter(i => filters.categories.includes(i.category));
    }

    if (filters.subcategories.length > 0) {
      result = result.filter(i => filters.subcategories.includes(i.subcategory));
    }

    // Platform filter: check if influencer has a valid URL for the selected platform(s)
    if (filters.platforms.length > 0) {
      result = result.filter(i => {
        const hasPlatforms: string[] = [];
        if (isValidUrl(i.tiktokUrl)) hasPlatforms.push('TikTok');
        if (isValidUrl(i.instagramUrl)) hasPlatforms.push('Instagram');
        if (isValidUrl(i.youtubeUrl)) hasPlatforms.push('YouTube');
        if (isValidUrl(i.twitterUrl)) hasPlatforms.push('X');
        return filters.platforms.some(p => hasPlatforms.includes(p));
      });
    }

    if (filters.regions.length > 0) {
      result = result.filter(i => filters.regions.includes(i.region));
    }

    if (filters.languages.length > 0) {
      result = result.filter(i => filters.languages.includes(i.language));
    }

    if (filters.audienceMin !== null) {
      result = result.filter(i => i.audienceSize >= filters.audienceMin!);
    }

    if (filters.audienceMax !== null) {
      result = result.filter(i => i.audienceSize <= filters.audienceMax!);
    }

    if (filters.scoreMin !== null) {
      result = result.filter(i => i.totalScore >= filters.scoreMin!);
    }

    if (filters.scoreMax !== null) {
      result = result.filter(i => i.totalScore <= filters.scoreMax!);
    }

    if (filters.approvalStatus === 'approved') {
      result = result.filter(i => approvedIds.has(i.id));
    } else if (filters.approvalStatus === 'pending') {
      result = result.filter(i => !approvedIds.has(i.id));
    }

    if (filters.dmViableOnly) {
      result = result.filter(i => i.dmViable);
    }

    // Follower tier filter (now includes huge >= 10M)
    if (filters.followerTier !== 'all') {
      result = result.filter(i => getFollowerTier(i.audienceSize) === filters.followerTier);
    }

    // Apply sorting
    result.sort((a, b) => {
      // Always sort approved first
      const aApproved = approvedIds.has(a.id) ? 1 : 0;
      const bApproved = approvedIds.has(b.id) ? 1 : 0;
      if (aApproved !== bApproved) return bApproved - aApproved;

      // Then apply user-selected sort
      switch (sortBy) {
        case 'score-desc':
          return b.totalScore - a.totalScore;
        case 'score-asc':
          return a.totalScore - b.totalScore;
        case 'audience-desc':
          return b.audienceSize - a.audienceSize;
        case 'audience-asc':
          return a.audienceSize - b.audienceSize;
        case 'name-asc':
          return a.creatorName.localeCompare(b.creatorName);
        case 'name-desc':
          return b.creatorName.localeCompare(a.creatorName);
        case 'default':
        default:
          // Default: total score desc, then tier asc, then name asc
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          const tierOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
          const aTier = tierOrder[a.tier?.replace(/Tier\s?/i, '').trim() as keyof typeof tierOrder] || 5;
          const bTier = tierOrder[b.tier?.replace(/Tier\s?/i, '').trim() as keyof typeof tierOrder] || 5;
          if (aTier !== bTier) return aTier - bTier;
          return a.creatorName.localeCompare(b.creatorName);
      }
    });

    return result;
  }, [rawData, filters, sortBy, approvedIds]);
}

export function useActiveFilterCount(filters: Filters): number {
  return useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tiers.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.subcategories.length > 0) count++;
    if (filters.platforms.length > 0) count++;
    if (filters.regions.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.audienceMin !== null || filters.audienceMax !== null) count++;
    if (filters.scoreMin !== null || filters.scoreMax !== null) count++;
    if (filters.approvalStatus !== 'all') count++;
    if (filters.dmViableOnly) count++;
    if (filters.followerTier !== 'all') count++;
    return count;
  }, [filters]);
}
