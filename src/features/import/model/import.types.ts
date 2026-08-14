export type DatasetKind = 'creator' | 'b2b';

export type CellValue = string | number | boolean | Date | null;

export interface CellHyperlink {
  rowIndex: number;
  columnIndex: number;
  target: string;
}

export type IssueSeverity = 'warning' | 'error';

export interface ImportIssue {
  id: string;
  severity: IssueSeverity;
  code:
    | 'missing-identity'
    | 'duplicate-candidate'
    | 'invalid-number'
    | 'invalid-url'
    | 'invalid-email'
    | 'multiple-emails'
    | 'invalid-date'
    | 'score-mismatch'
    | 'unknown-value';
  rowNumber: number;
  recordLabel: string;
  field: string;
  sourceValue: string;
  message: string;
}

export interface ImportReport {
  detectedKind: DatasetKind;
  expectedKind: DatasetKind;
  fileName: string;
  fileSize: number;
  sheetName: string;
  additionalSheets: string[];
  headerRowNumber: number;
  sourceHeaders: string[];
  recognizedHeaders: string[];
  unknownHeaders: string[];
  missingRecommendedHeaders: string[];
  recordCount: number;
  blankRowCount: number;
  quarantinedRowCount: number;
  duplicateCount: number;
  repairedUrlCount: number;
  multipleEmailCount: number;
  contactableCount: number;
  scoreMismatchCount: number;
  issues: ImportIssue[];
}

export interface SourceRecord {
  headers: string[];
  values: CellValue[];
}

export interface BaseRecord {
  id: string;
  rowNumber: number;
  source: SourceRecord;
  warnings: string[];
  searchText: string;
}

export interface CreatorRecord extends BaseRecord {
  kind: 'creator';
  sequence: string;
  creatorName: string;
  creatorType: string;
  category: string;
  subcategory: string;
  primaryPlatform: string;
  tiktokUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  otherPlatform: string;
  otherPlatformUrls: string[];
  region: string;
  language: string;
  audienceSize: number | null;
  totalLikes: number | null;
  videoCount: number | null;
  descriptionNotes: string;
  contactName: string;
  emailRaw: string;
  emails: string[];
  linkInBio: string;
  agency: string;
  dmViable: boolean | null;
  dmQualifier: string;
  contentFit: number | null;
  audienceEngagement: number | null;
  authorityOpinion: number | null;
  accessPartnership: number | null;
  sourceTotalScore: number | null;
  calculatedTotalScore: number | null;
  tier: string;
  status: string;
  firstContact: string;
  channel: string;
  lastTouch: string;
  touches: number | null;
  callDate: string;
  callOutcome: string;
  dealPotential: string;
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
}

export interface B2BRecord extends BaseRecord {
  kind: 'b2b';
  companyName: string;
  category: string;
  subcategory: string;
  location: string;
  website: string;
  instagramRaw: string;
  instagramHandle: string;
  instagramUrl: string;
  linkedInPage: string;
  decisionMaker: string;
  role: string;
  linkedInProfile: string;
  emailRaw: string;
  emails: string[];
  igDmViable: boolean | null;
  igDmQualifier: string;
  campaignReadiness: number | null;
  spendSignal: number | null;
  executionPain: number | null;
  access: number | null;
  sourceTotalScore: number | null;
  calculatedTotalScore: number | null;
  tier: string;
  status: string;
  firstContactDate: string;
  channel: string;
  lastTouchDate: string;
  numberOfTouches: number | null;
  responseType: string;
  callDate: string;
  callOutcome: string;
  dealPotential: string;
  notes: string;
  observedCampaignActivity: string;
  hypothesizedPain: string;
  outreachAngle: string;
  dateAdded: string;
  campaignReadinessEvidence: string;
  spendSignalEvidence: string;
  executionPainEvidence: string;
  accessEvidence: string;
  observedCampaignActivityEvidence: string;
  hypothesizedPainEvidence: string;
}

export type ImportedRecord = CreatorRecord | B2BRecord;

export interface ImportResult<T extends ImportedRecord = ImportedRecord> {
  kind: DatasetKind;
  fingerprint: string;
  records: T[];
  report: ImportReport;
}

export interface WorkbookRowsPayload {
  rows: CellValue[][];
  hyperlinks?: CellHyperlink[];
  fileName: string;
  fileSize: number;
  sheetName: string;
  additionalSheets: string[];
  expectedKind: DatasetKind;
}

export type WorkerRequest = {
  type: 'parse';
  buffer: ArrayBuffer;
  fileName: string;
  fileSize: number;
  expectedKind: DatasetKind;
  parserUrl: string;
  parserWorkerUrl: string;
};

export type WorkerResponse =
  | { type: 'progress'; stage: 'reading' | 'detecting' | 'normalizing' | 'validating'; progress: number }
  | { type: 'complete'; result: ImportResult }
  | { type: 'error'; message: string };
