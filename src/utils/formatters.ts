export function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return value.toString();
}

export function parseNumberValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const cleaned = value.toString().replace(/,/g, '').replace(/\+/g, '').trim();

  // Handle K/M/B suffixes
  if (cleaned.match(/^\d+\.?\d*K$/i)) {
    return parseFloat(cleaned.replace(/K/i, '')) * 1000;
  }
  if (cleaned.match(/^\d+\.?\d*M$/i)) {
    return parseFloat(cleaned.replace(/M/i, '')) * 1_000_000;
  }
  if (cleaned.match(/^\d+\.?\d*B$/i)) {
    return parseFloat(cleaned.replace(/B/i, '')) * 1_000_000_000;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseIntegerValue(value: string | number | null | undefined): number {
  const parsed = parseNumberValue(value);
  return Math.round(parsed);
}

export function formatAudienceSize(value: number): string {
  return formatNumber(value);
}

export function formatTotalLikes(value: number): string {
  return formatNumber(value);
}

// Tier colors for scoring tiers (A/B/C/D)
export function getTierColor(tier: string): string {
  const tierUpper = tier.toUpperCase().trim();
  if (tierUpper.includes('A')) return '#2E7D6F';
  if (tierUpper.includes('B')) return '#ffd966';
  if (tierUpper.includes('C')) return '#6fa8dc';
  if (tierUpper.includes('D')) return '#6B7280';
  return '#6B7280';
}

// Follower tier config: dot color, bg color, label, follower range tooltip
export const FOLLOWER_TIER_CONFIG: Record<string, { dotColor: string; bgColor: string; label: string; range: string; icon: string }> = {
  huge:   { dotColor: '#FBBF24', bgColor: '#111827', label: 'Huge',   range: 'Above 10M followers',               icon: 'Crown' },
  mega:   { dotColor: '#DC2626', bgColor: '#FEF2F2', label: 'Mega',   range: 'Between 1M and 10M followers',       icon: 'Crown' },
  medium: { dotColor: '#10B981', bgColor: '#ECFDF5', label: 'Medium', range: 'Between 100K and 1M followers',      icon: 'TrendingUp' },
  small:  { dotColor: '#E879F9', bgColor: '#FDF4FF', label: 'Small',  range: 'Between 10K and 100K followers',      icon: 'UserCheck' },
  micro:  { dotColor: '#416AF0', bgColor: '#EFF6FF', label: 'Micro',  range: 'Between 5K and 10K followers',        icon: 'User' },
  nano:   { dotColor: '#22D3EE', bgColor: '#ECFEFF', label: 'Nano',   range: 'Up to 5K followers',                  icon: 'UserMinus' },
};

// Follower size classification
export function getFollowerTier(followers: number): 'huge' | 'mega' | 'medium' | 'small' | 'micro' | 'nano' {
  if (followers >= 10_000_000) return 'huge';
  if (followers >= 1_000_000) return 'mega';
  if (followers >= 100_000) return 'medium';
  if (followers >= 10_000) return 'small';
  if (followers >= 5_000) return 'micro';
  return 'nano';
}

export function getFollowerTierLabel(followers: number): string {
  const tier = getFollowerTier(followers);
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function getFollowerTierConfig(followers: number) {
  return FOLLOWER_TIER_CONFIG[getFollowerTier(followers)];
}

export function getFollowerTierRange(tier: string): string {
  return FOLLOWER_TIER_CONFIG[tier.toLowerCase()]?.range || '';
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateDatasetHash(influencers: { creatorName: string }[]): string {
  const sample = influencers.slice(0, 5).map(i => i.creatorName).join('|');
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `influencer_approvals_${hash}_${influencers.length}`;
}
