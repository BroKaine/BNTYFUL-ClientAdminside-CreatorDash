export interface Influencer {
  id: string;
  rowIndex: number;

  // Creator Info
  creatorName: string;
  creatorType: string;
  category: string;
  subcategory: string;
  primaryPlatform: string;
  tiktokUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  otherPlatformUrl: string;
  region: string;
  language: string;
  audienceSize: number;
  totalLikes: number;
  videoCount: string;
  descriptionNotes: string;

  // Contact
  contactName: string;
  email: string;
  linkInBio: string;
  agency: string;
  dmViable: boolean;

  // Scoring
  contentFit: number;
  audienceEngagement: number;
  authorityOpinion: number;
  accessPartnership: number;
  totalScore: number;
  tier: string;

  // Status
  status: string;

  // Evidence
  observedActivity: string;
  partnershipAngle: string;
  outreachAngle: string;
  contentFitEvidence: string;
  audienceEngagementEvidence: string;
  authorityOpinionEvidence: string;
  accessPartnershipEvidence: string;
  observedActivityEvidence: string;
  partnershipAngleEvidence: string;
  highLevelNotes: string;

  // Internal
  firstContact: string;
  channel: string;
  lastTouch: string;
  touches: number;
  callDate: string;
  callOutcome: string;
  dealPotential: string;
}

export interface Filters {
  search: string;
  tiers: string[];
  categories: string[];
  subcategories: string[];
  platforms: string[];
  regions: string[];
  languages: string[];
  audienceMin: number | null;
  audienceMax: number | null;
  scoreMin: number | null;
  scoreMax: number | null;
  approvalStatus: 'all' | 'approved' | 'pending';
  dmViableOnly: boolean;
  followerTier: 'all' | 'huge' | 'mega' | 'medium' | 'small' | 'micro' | 'nano';
}

export type SortOption =
  | 'default'
  | 'score-desc'
  | 'score-asc'
  | 'audience-desc'
  | 'audience-asc'
  | 'name-asc'
  | 'name-desc';

export interface AppState {
  file: File | null;
  rawData: Influencer[];
  isLoading: boolean;
  error: string | null;
  filteredData: Influencer[];
  expandedCards: Set<string>;
  approvedIds: Set<string>;
  filters: Filters;
  sortBy: SortOption;
}

export type AppAction =
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_RAW_DATA'; payload: Influencer[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERED_DATA'; payload: Influencer[] }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'TOGGLE_APPROVE'; payload: string }
  | { type: 'SET_APPROVED'; payload: Set<string> }
  | { type: 'SET_FILTER'; payload: { key: keyof Filters; value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SORT'; payload: SortOption }
  | { type: 'RESET_STATE' };

export const initialFilters: Filters = {
  search: '',
  tiers: [],
  categories: [],
  subcategories: [],
  platforms: [],
  regions: [],
  languages: [],
  audienceMin: null,
  audienceMax: null,
  scoreMin: null,
  scoreMax: null,
  approvalStatus: 'all',
  dmViableOnly: false,
  followerTier: 'all',
};

export const initialState: AppState = {
  file: null,
  rawData: [],
  isLoading: false,
  error: null,
  filteredData: [],
  expandedCards: new Set(),
  approvedIds: new Set(),
  filters: { ...initialFilters },
  sortBy: 'default',
};
