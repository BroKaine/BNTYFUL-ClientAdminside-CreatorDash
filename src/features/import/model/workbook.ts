import type {
  B2BRecord,
  BaseRecord,
  CellValue,
  CreatorRecord,
  DatasetKind,
  ImportIssue,
  ImportResult,
  SourceRecord,
  WorkbookRowsPayload,
} from './import.types';
import {
  canonicalDomain,
  displayText,
  extractUrls,
  isMissing,
  normalizeInstagram,
  normalizeKey,
  normalizeUrl,
  parseBooleanLike,
  parseDate,
  parseNumber,
  sourceText,
  splitEmails,
  stableHash,
} from '@/shared/lib/normalize';

interface SchemaField {
  key: string;
  label: string;
  aliases: string[];
  recommended?: boolean;
}

const field = (key: string, label: string, aliases: string[] = [], recommended = true): SchemaField => ({
  key,
  label,
  aliases: [label, ...aliases],
  recommended,
});

export const CREATOR_SCHEMA: SchemaField[] = [
  field('sequence', '#', [], false),
  field('creatorName', 'Creator / Page Name', ['Creator Name', 'Page Name', 'Creator/Page Name']),
  field('creatorType', 'Creator Type', ['Type']),
  field('category', 'Catagory', ['Category']),
  field('subcategory', 'Subcategory'),
  field('primaryPlatform', 'Primary Platform', ['Platform']),
  field('tiktokUrl', 'TikTok URL', ['TikTok'], false),
  field('instagramUrl', 'Instagram URL', ['Instagram'], false),
  field('youtubeUrl', 'YouTube URL', ['YouTube'], false),
  field('twitterUrl', 'X/Twitter URL', ['Twitter URL', 'X URL'], false),
  field('otherPlatform', 'Other Platform', ['Other Platform URL'], false),
  field('region', 'Region'),
  field('language', 'Language'),
  field('audienceSize', 'Audience Size', ['Audience', 'Followers']),
  field('totalLikes', 'Total Likes', ['Likes']),
  field('videoCount', 'Video Count', ['Videos']),
  field('descriptionNotes', 'Description Notes', ['Description'], false),
  field('contactName', 'Contact Name', [], false),
  field('emailRaw', 'Email', [], false),
  field('linkInBio', 'Link-in-Bio', ['Link in Bio', 'Linkinbio'], false),
  field('agency', 'Agency', [], false),
  field('dmViable', 'DM Viable', [], false),
  field('contentFit', 'Content Fit'),
  field('audienceEngagement', 'Audience & Engagement', ['Audience and Engagement', 'Audience Engagement']),
  field('authorityOpinion', 'Authority & Opinion Strength', ['Authority and Opinion Strength']),
  field('accessPartnership', 'Access & Partnership Viability', ['Access and Partnership Viability']),
  field('sourceTotalScore', 'Total Score', ['Score']),
  field('tier', 'Tier'),
  field('status', 'Status', [], false),
  field('firstContact', 'First Contact', [], false),
  field('channel', 'Channel', [], false),
  field('lastTouch', 'Last Touch', [], false),
  field('touches', 'Touches', [], false),
  field('callDate', 'Call Date', [], false),
  field('callOutcome', 'Call Outcome', [], false),
  field('dealPotential', 'Deal Potential', [], false),
  field('observedActivity', 'Observed Activity', [], false),
  field('partnershipAngle', 'Partnership Angle', [], false),
  field('outreachAngle', 'Outreach Angle', [], false),
  field('contentFitEvidence', 'Content Fit Evidence', [], false),
  field('audienceEngagementEvidence', 'Audience & Engagement Signal Evidence', [], false),
  field('authorityOpinionEvidence', 'Authority & Opinion Strength Evidence', [], false),
  field('accessPartnershipEvidence', 'Access & Partnership Viability Evidence', [], false),
  field('observedActivityEvidence', 'Observed Activity Evidence', [], false),
  field('partnershipAngleEvidence', 'Partnership Angle Evidence', [], false),
  field('highLevelNotes', 'High Level Notes', ['High-Level Notes'], false),
];

export const B2B_SCHEMA: SchemaField[] = [
  field('companyName', 'Company Name'),
  field('category', 'Category'),
  field('subcategory', 'Subcategory'),
  field('location', 'Location (City)', ['Location', 'City']),
  field('website', 'Website', [], false),
  field('instagramRaw', 'Instagram Handle', ['Instagram'], false),
  field('linkedInPage', 'LinkedIn Page', ['Company LinkedIn'], false),
  field('decisionMaker', 'Decision Maker', [], false),
  field('role', 'Role', ['Decision Maker Role'], false),
  field('linkedInProfile', 'LinkedIn Profile', [], false),
  field('emailRaw', 'Email', [], false),
  field('igDmViable', 'IG DM Viable', ['Instagram DM Viable'], false),
  field('campaignReadiness', 'Campaign Readiness'),
  field('spendSignal', 'Spend Signal'),
  field('executionPain', 'Execution Pain'),
  field('access', 'Access'),
  field('sourceTotalScore', 'Total Score', ['Score']),
  field('tier', 'Tier'),
  field('status', 'Status', [], false),
  field('firstContactDate', 'First Contact Date', ['First Contact'], false),
  field('channel', 'Channel', [], false),
  field('lastTouchDate', 'Last Touch Date', ['Last Touch'], false),
  field('numberOfTouches', 'Number of Touches', ['Touches'], false),
  field('responseType', 'Response Type', [], false),
  field('callDate', 'Call Date', [], false),
  field('callOutcome', 'Call Outcome', [], false),
  field('dealPotential', 'Deal Potential', [], false),
  field('notes', 'Notes', [], false),
  field('observedCampaignActivity', 'Observed Campaign Activity', [], false),
  field('hypothesizedPain', 'Hypothesized Pain', [], false),
  field('outreachAngle', 'Outreach Angle', [], false),
  field('dateAdded', 'Date Added', [], false),
  field('campaignReadinessEvidence', 'Campaign Readiness Evidence', [], false),
  field('spendSignalEvidence', 'Spend Signal Evidence', [], false),
  field('executionPainEvidence', 'Execution Pain Evidence', [], false),
  field('accessEvidence', 'Access Evidence', [], false),
  field('observedCampaignActivityEvidence', 'Observed Campaign Activity Evidence', [], false),
  field('hypothesizedPainEvidence', 'Hypothesized Pain Evidence', [], false),
];

function normalizeHeader(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[()/_-]+/g, ' ')
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function aliasesFor(schema: SchemaField[]): Map<string, SchemaField> {
  const aliases = new Map<string, SchemaField>();
  schema.forEach(definition => definition.aliases.forEach(alias => aliases.set(normalizeHeader(alias), definition)));
  return aliases;
}

const CREATOR_ALIASES = aliasesFor(CREATOR_SCHEMA);
const B2B_ALIASES = aliasesFor(B2B_SCHEMA);

function headerScore(headers: string[], kind: DatasetKind): number {
  const normalized = new Set(headers.map(normalizeHeader));
  const has = (label: string) => normalized.has(normalizeHeader(label));
  if (kind === 'creator') {
    return (has('Creator / Page Name') ? 8 : 0)
      + (has('Creator Type') ? 4 : 0)
      + (has('Primary Platform') ? 5 : 0)
      + (has('Audience Size') ? 3 : 0)
      + (has('Authority & Opinion Strength') ? 3 : 0)
      + headers.filter(header => CREATOR_ALIASES.has(normalizeHeader(header))).length;
  }
  return (has('Company Name') ? 8 : 0)
    + (has('Decision Maker') ? 5 : 0)
    + (has('Campaign Readiness') ? 5 : 0)
    + (has('Execution Pain') ? 4 : 0)
    + (has('Hypothesized Pain') ? 3 : 0)
    + headers.filter(header => B2B_ALIASES.has(normalizeHeader(header))).length;
}

export interface HeaderDetection {
  kind: DatasetKind;
  headerRowIndex: number;
  headers: string[];
  creatorScore: number;
  b2bScore: number;
}

export function detectWorkbookHeaders(rows: CellValue[][]): HeaderDetection {
  let best: HeaderDetection | null = null;
  const candidates = rows.slice(0, 10);
  for (let headerRowIndex = 0; headerRowIndex < candidates.length; headerRowIndex += 1) {
    const row = candidates[headerRowIndex];
    const headers = row.map(sourceText);
    const creatorScore = headerScore(headers, 'creator');
    const b2bScore = headerScore(headers, 'b2b');
    const kind: DatasetKind = creatorScore >= b2bScore ? 'creator' : 'b2b';
    const candidate = { kind, headerRowIndex, headers, creatorScore, b2bScore };
    if (!best || Math.max(creatorScore, b2bScore) > Math.max(best.creatorScore, best.b2bScore)) best = candidate;
  }
  if (!best || Math.max(best.creatorScore, best.b2bScore) < 15) {
    throw new Error('This workbook does not match the Creator or B2B prospect format. Check the required headers and try again.');
  }
  if (Math.abs(best.creatorScore - best.b2bScore) < 3) {
    throw new Error('This workbook is ambiguous between the Creator and B2B formats. Check that it contains only one supported header structure.');
  }
  return best;
}

function buildMapping(headers: string[], schema: SchemaField[]): Map<string, number> {
  const aliases = aliasesFor(schema);
  const mapping = new Map<string, number>();
  headers.forEach((header, index) => {
    const definition = aliases.get(normalizeHeader(header));
    if (definition && !mapping.has(definition.key)) mapping.set(definition.key, index);
  });
  return mapping;
}

function cell(row: CellValue[], mapping: Map<string, number>, key: string): CellValue | undefined {
  const index = mapping.get(key);
  return index === undefined ? undefined : row[index];
}

function hyperlinkKey(rowIndex: number, columnIndex: number): string {
  return `${rowIndex}:${columnIndex}`;
}

function cellHyperlink(
  hyperlinks: Map<string, string>,
  rowIndex: number,
  mapping: Map<string, number>,
  key: string,
): string | undefined {
  const columnIndex = mapping.get(key);
  return columnIndex === undefined ? undefined : hyperlinks.get(hyperlinkKey(rowIndex, columnIndex));
}

function sourceRecord(headers: string[], row: CellValue[]): SourceRecord {
  const named = headers
    .map((header, index) => ({ header: header.trim(), value: row[index] ?? null }))
    .filter(entry => entry.header.length > 0);
  return { headers: named.map(entry => entry.header), values: named.map(entry => entry.value) };
}

function hasRowData(row: CellValue[]): boolean {
  return row.some(value => !isMissing(value));
}

function normalizedPlatform(value: CellValue | undefined): string {
  const text = displayText(value);
  return /^insatgram$/i.test(text) ? 'Instagram' : text;
}

function recordBase(rowNumber: number, source: SourceRecord): Pick<BaseRecord, 'rowNumber' | 'source' | 'warnings'> {
  return { rowNumber, source, warnings: [] };
}

function makeIssue(
  issues: ImportIssue[],
  warnings: string[],
  details: Omit<ImportIssue, 'id'>,
): void {
  const id = `${details.code}-${details.rowNumber}-${normalizeHeader(details.field)}-${issues.length}`;
  issues.push({ ...details, id });
  warnings.push(details.message);
}

function readNumber(
  row: CellValue[],
  mapping: Map<string, number>,
  key: string,
  label: string,
  rowNumber: number,
  recordLabel: string,
  issues: ImportIssue[],
  warnings: string[],
): number | null {
  const raw = cell(row, mapping, key);
  const parsed = parseNumber(raw);
  if (!isMissing(raw) && parsed === null) {
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'invalid-number', rowNumber, recordLabel, field: label,
      sourceValue: sourceText(raw), message: `${label} is not a valid number and was treated as unavailable.`,
    });
  }
  return parsed;
}

function readDate(
  row: CellValue[],
  mapping: Map<string, number>,
  key: string,
  label: string,
  rowNumber: number,
  recordLabel: string,
  issues: ImportIssue[],
  warnings: string[],
): string {
  const raw = cell(row, mapping, key);
  const parsed = parseDate(raw);
  if (!isMissing(raw) && !parsed) {
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'invalid-date', rowNumber, recordLabel, field: label,
      sourceValue: sourceText(raw), message: `${label} could not be interpreted as a date.`,
    });
  }
  return parsed;
}

interface MutableStats {
  duplicateCount: number;
  repairedUrlCount: number;
  multipleEmailCount: number;
  contactableCount: number;
  scoreMismatchCount: number;
  blankRowCount: number;
  quarantinedRowCount: number;
}

function readUrl(
  raw: CellValue | undefined,
  hyperlinkTarget: string | undefined,
  label: string,
  rowNumber: number,
  recordLabel: string,
  issues: ImportIssue[],
  warnings: string[],
  stats: MutableStats,
): string {
  const normalizedTarget = normalizeUrl(hyperlinkTarget);
  const normalizedSource = normalizeUrl(raw);
  const normalized = normalizedTarget.valid ? normalizedTarget : normalizedSource;
  if (normalized.repaired) stats.repairedUrlCount += 1;
  if (!isMissing(hyperlinkTarget) && !normalizedTarget.valid) {
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'invalid-url', rowNumber, recordLabel, field: label,
      sourceValue: sourceText(hyperlinkTarget),
      message: normalizedSource.valid
        ? `${label} contained an unsafe embedded hyperlink; the displayed URL was used instead.`
        : `${label} does not contain a safe, usable HTTP(S) link.`,
    });
  } else if (!isMissing(raw) && !normalized.valid) {
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'invalid-url', rowNumber, recordLabel, field: label,
      sourceValue: sourceText(raw), message: `${label} is not a safe, usable HTTP(S) link.`,
    });
  }
  return normalized.url;
}

function readEmails(
  raw: CellValue | undefined,
  rowNumber: number,
  recordLabel: string,
  issues: ImportIssue[],
  warnings: string[],
  stats: MutableStats,
): string[] {
  const parsed = splitEmails(raw);
  if (parsed.multiple) {
    stats.multipleEmailCount += 1;
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'multiple-emails', rowNumber, recordLabel, field: 'Email',
      sourceValue: sourceText(raw), message: `Multiple email addresses were retained (${parsed.valid.length} valid).`,
    });
  }
  if (parsed.invalid.length > 0) {
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'invalid-email', rowNumber, recordLabel, field: 'Email',
      sourceValue: parsed.invalid.join('; '), message: 'One or more email values could not be validated.',
    });
  }
  return parsed.valid;
}

function scoreTotal(
  dimensions: Array<number | null>,
  sourceTotal: number | null,
  rowNumber: number,
  recordLabel: string,
  issues: ImportIssue[],
  warnings: string[],
  stats: MutableStats,
): number | null {
  if (dimensions.some(value => value === null)) return null;
  const calculated = dimensions.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  if (sourceTotal !== null && sourceTotal !== calculated) {
    stats.scoreMismatchCount += 1;
    makeIssue(issues, warnings, {
      severity: 'warning', code: 'score-mismatch', rowNumber, recordLabel, field: 'Total Score',
      sourceValue: String(sourceTotal), message: `Source total ${sourceTotal} does not equal calculated total ${calculated}.`,
    });
  }
  return calculated;
}

function creatorFromRow(
  row: CellValue[],
  rowIndex: number,
  rowNumber: number,
  headers: string[],
  mapping: Map<string, number>,
  hyperlinks: Map<string, string>,
  issues: ImportIssue[],
  stats: MutableStats,
): { record: CreatorRecord; identitySeed: string } | null {
  const creatorName = displayText(cell(row, mapping, 'creatorName'));
  const primaryPlatform = normalizedPlatform(cell(row, mapping, 'primaryPlatform'));
  const warnings: string[] = [];
  const recordLabel = creatorName || `Row ${rowNumber}`;
  const source = sourceRecord(headers, row);
  const tiktokUrl = readUrl(cell(row, mapping, 'tiktokUrl'), cellHyperlink(hyperlinks, rowIndex, mapping, 'tiktokUrl'), 'TikTok URL', rowNumber, recordLabel, issues, warnings, stats);
  const instagramUrl = readUrl(cell(row, mapping, 'instagramUrl'), cellHyperlink(hyperlinks, rowIndex, mapping, 'instagramUrl'), 'Instagram URL', rowNumber, recordLabel, issues, warnings, stats);
  const youtubeUrl = readUrl(cell(row, mapping, 'youtubeUrl'), cellHyperlink(hyperlinks, rowIndex, mapping, 'youtubeUrl'), 'YouTube URL', rowNumber, recordLabel, issues, warnings, stats);
  const twitterUrl = readUrl(cell(row, mapping, 'twitterUrl'), cellHyperlink(hyperlinks, rowIndex, mapping, 'twitterUrl'), 'X/Twitter URL', rowNumber, recordLabel, issues, warnings, stats);
  const linkInBio = readUrl(cell(row, mapping, 'linkInBio'), cellHyperlink(hyperlinks, rowIndex, mapping, 'linkInBio'), 'Link-in-Bio', rowNumber, recordLabel, issues, warnings, stats);
  const otherPlatform = displayText(cell(row, mapping, 'otherPlatform'));
  const otherPlatformTarget = cellHyperlink(hyperlinks, rowIndex, mapping, 'otherPlatform');
  const preferredOtherPlatformUrl = otherPlatformTarget
    ? readUrl(cell(row, mapping, 'otherPlatform'), otherPlatformTarget, 'Other Platform', rowNumber, recordLabel, issues, warnings, stats)
    : '';
  const otherPlatformUrls = [...new Set([preferredOtherPlatformUrl, ...extractUrls(cell(row, mapping, 'otherPlatform'))].filter(Boolean))];
  const emails = readEmails(cell(row, mapping, 'emailRaw'), rowNumber, recordLabel, issues, warnings, stats);
  const hasIdentitySignal = Boolean(primaryPlatform || tiktokUrl || instagramUrl || youtubeUrl || twitterUrl || otherPlatformUrls.length);
  if (!creatorName || !hasIdentitySignal) {
    makeIssue(issues, warnings, {
      severity: 'error', code: 'missing-identity', rowNumber, recordLabel, field: 'Creator / Page Name',
      sourceValue: creatorName, message: 'Creator row needs a name and at least one platform identity signal.',
    });
    stats.quarantinedRowCount += 1;
    return null;
  }
  const dm = parseBooleanLike(cell(row, mapping, 'dmViable'));
  const contentFit = readNumber(row, mapping, 'contentFit', 'Content Fit', rowNumber, recordLabel, issues, warnings);
  const audienceEngagement = readNumber(row, mapping, 'audienceEngagement', 'Audience & Engagement', rowNumber, recordLabel, issues, warnings);
  const authorityOpinion = readNumber(row, mapping, 'authorityOpinion', 'Authority & Opinion Strength', rowNumber, recordLabel, issues, warnings);
  const accessPartnership = readNumber(row, mapping, 'accessPartnership', 'Access & Partnership Viability', rowNumber, recordLabel, issues, warnings);
  const sourceTotalScore = readNumber(row, mapping, 'sourceTotalScore', 'Total Score', rowNumber, recordLabel, issues, warnings);
  const calculatedTotalScore = scoreTotal(
    [contentFit, audienceEngagement, authorityOpinion, accessPartnership], sourceTotalScore,
    rowNumber, recordLabel, issues, warnings, stats,
  );
  const strongestIdentity = instagramUrl || tiktokUrl || youtubeUrl || twitterUrl || otherPlatformUrls[0] || primaryPlatform;
  const identitySeed = `${normalizeKey(creatorName)}|${normalizeKey(strongestIdentity)}`;
  const values = {
    sequence: displayText(cell(row, mapping, 'sequence')),
    creatorName,
    creatorType: displayText(cell(row, mapping, 'creatorType')),
    category: displayText(cell(row, mapping, 'category')),
    subcategory: displayText(cell(row, mapping, 'subcategory')),
    primaryPlatform,
    tiktokUrl, instagramUrl, youtubeUrl, twitterUrl, otherPlatform, otherPlatformUrls,
    region: displayText(cell(row, mapping, 'region')),
    language: displayText(cell(row, mapping, 'language')),
    audienceSize: readNumber(row, mapping, 'audienceSize', 'Audience Size', rowNumber, recordLabel, issues, warnings),
    totalLikes: readNumber(row, mapping, 'totalLikes', 'Total Likes', rowNumber, recordLabel, issues, warnings),
    videoCount: readNumber(row, mapping, 'videoCount', 'Video Count', rowNumber, recordLabel, issues, warnings),
    descriptionNotes: displayText(cell(row, mapping, 'descriptionNotes')),
    contactName: displayText(cell(row, mapping, 'contactName')),
    emailRaw: displayText(cell(row, mapping, 'emailRaw')),
    emails, linkInBio,
    agency: displayText(cell(row, mapping, 'agency')),
    dmViable: dm.value,
    dmQualifier: dm.qualifier,
    contentFit, audienceEngagement, authorityOpinion, accessPartnership, sourceTotalScore, calculatedTotalScore,
    tier: displayText(cell(row, mapping, 'tier')),
    status: displayText(cell(row, mapping, 'status')),
    firstContact: readDate(row, mapping, 'firstContact', 'First Contact', rowNumber, recordLabel, issues, warnings),
    channel: displayText(cell(row, mapping, 'channel')),
    lastTouch: readDate(row, mapping, 'lastTouch', 'Last Touch', rowNumber, recordLabel, issues, warnings),
    touches: readNumber(row, mapping, 'touches', 'Touches', rowNumber, recordLabel, issues, warnings),
    callDate: readDate(row, mapping, 'callDate', 'Call Date', rowNumber, recordLabel, issues, warnings),
    callOutcome: displayText(cell(row, mapping, 'callOutcome')),
    dealPotential: displayText(cell(row, mapping, 'dealPotential')),
    observedActivity: displayText(cell(row, mapping, 'observedActivity')),
    partnershipAngle: displayText(cell(row, mapping, 'partnershipAngle')),
    outreachAngle: displayText(cell(row, mapping, 'outreachAngle')),
    contentFitEvidence: displayText(cell(row, mapping, 'contentFitEvidence')),
    audienceEngagementEvidence: displayText(cell(row, mapping, 'audienceEngagementEvidence')),
    authorityOpinionEvidence: displayText(cell(row, mapping, 'authorityOpinionEvidence')),
    accessPartnershipEvidence: displayText(cell(row, mapping, 'accessPartnershipEvidence')),
    observedActivityEvidence: displayText(cell(row, mapping, 'observedActivityEvidence')),
    partnershipAngleEvidence: displayText(cell(row, mapping, 'partnershipAngleEvidence')),
    highLevelNotes: displayText(cell(row, mapping, 'highLevelNotes')),
  };
  const searchText = Object.values(values).filter(value => typeof value === 'string').join(' ').toLocaleLowerCase();
  if (emails.length || linkInBio || dm.value || tiktokUrl || instagramUrl || youtubeUrl || twitterUrl) stats.contactableCount += 1;
  return {
    identitySeed,
    record: {
      kind: 'creator', id: '', ...recordBase(rowNumber, source), ...values, searchText,
    },
  };
}

function b2bFromRow(
  row: CellValue[],
  rowIndex: number,
  rowNumber: number,
  headers: string[],
  mapping: Map<string, number>,
  hyperlinks: Map<string, string>,
  issues: ImportIssue[],
  stats: MutableStats,
): { record: B2BRecord; identitySeed: string } | null {
  const companyName = displayText(cell(row, mapping, 'companyName'));
  const warnings: string[] = [];
  const recordLabel = companyName || `Row ${rowNumber}`;
  const source = sourceRecord(headers, row);
  const website = readUrl(cell(row, mapping, 'website'), cellHyperlink(hyperlinks, rowIndex, mapping, 'website'), 'Website', rowNumber, recordLabel, issues, warnings, stats);
  const linkedInPage = readUrl(cell(row, mapping, 'linkedInPage'), cellHyperlink(hyperlinks, rowIndex, mapping, 'linkedInPage'), 'LinkedIn Page', rowNumber, recordLabel, issues, warnings, stats);
  const linkedInProfile = readUrl(cell(row, mapping, 'linkedInProfile'), cellHyperlink(hyperlinks, rowIndex, mapping, 'linkedInProfile'), 'LinkedIn Profile', rowNumber, recordLabel, issues, warnings, stats);
  const instagramRaw = cell(row, mapping, 'instagramRaw');
  const instagram = normalizeInstagram(instagramRaw);
  const instagramTarget = cellHyperlink(hyperlinks, rowIndex, mapping, 'instagramRaw');
  const instagramUrl = instagramTarget
    ? readUrl(instagram.url || instagramRaw, instagramTarget, 'Instagram', rowNumber, recordLabel, issues, warnings, stats)
    : instagram.url;
  const instagramHandle = instagram.handle || normalizeInstagram(instagramUrl).handle;
  if (instagram.url && !/^https?:/i.test(displayText(cell(row, mapping, 'instagramRaw')))) stats.repairedUrlCount += 1;
  const emails = readEmails(cell(row, mapping, 'emailRaw'), rowNumber, recordLabel, issues, warnings, stats);
  const decisionMaker = displayText(cell(row, mapping, 'decisionMaker'));
  const location = displayText(cell(row, mapping, 'location'));
  if (!companyName || !(website || linkedInPage || decisionMaker || location)) {
    makeIssue(issues, warnings, {
      severity: 'error', code: 'missing-identity', rowNumber, recordLabel, field: 'Company Name',
      sourceValue: companyName, message: 'Prospect row needs a company name and at least one company/contact identity signal.',
    });
    stats.quarantinedRowCount += 1;
    return null;
  }
  const dm = parseBooleanLike(cell(row, mapping, 'igDmViable'));
  const campaignReadiness = readNumber(row, mapping, 'campaignReadiness', 'Campaign Readiness', rowNumber, recordLabel, issues, warnings);
  const spendSignal = readNumber(row, mapping, 'spendSignal', 'Spend Signal', rowNumber, recordLabel, issues, warnings);
  const executionPain = readNumber(row, mapping, 'executionPain', 'Execution Pain', rowNumber, recordLabel, issues, warnings);
  const access = readNumber(row, mapping, 'access', 'Access', rowNumber, recordLabel, issues, warnings);
  const sourceTotalScore = readNumber(row, mapping, 'sourceTotalScore', 'Total Score', rowNumber, recordLabel, issues, warnings);
  const calculatedTotalScore = scoreTotal(
    [campaignReadiness, spendSignal, executionPain, access], sourceTotalScore,
    rowNumber, recordLabel, issues, warnings, stats,
  );
  const identitySeed = `${canonicalDomain(website) || normalizeKey(companyName)}|${normalizeKey(companyName)}|${normalizeKey(location)}`;
  const values = {
    companyName,
    category: displayText(cell(row, mapping, 'category')),
    subcategory: displayText(cell(row, mapping, 'subcategory')),
    location,
    website,
    instagramRaw: instagram.raw,
    instagramHandle,
    instagramUrl,
    linkedInPage,
    decisionMaker,
    role: displayText(cell(row, mapping, 'role')),
    linkedInProfile,
    emailRaw: displayText(cell(row, mapping, 'emailRaw')),
    emails,
    igDmViable: dm.value,
    igDmQualifier: dm.qualifier,
    campaignReadiness, spendSignal, executionPain, access, sourceTotalScore, calculatedTotalScore,
    tier: displayText(cell(row, mapping, 'tier')),
    status: displayText(cell(row, mapping, 'status')),
    firstContactDate: readDate(row, mapping, 'firstContactDate', 'First Contact Date', rowNumber, recordLabel, issues, warnings),
    channel: displayText(cell(row, mapping, 'channel')),
    lastTouchDate: readDate(row, mapping, 'lastTouchDate', 'Last Touch Date', rowNumber, recordLabel, issues, warnings),
    numberOfTouches: readNumber(row, mapping, 'numberOfTouches', 'Number of Touches', rowNumber, recordLabel, issues, warnings),
    responseType: displayText(cell(row, mapping, 'responseType')),
    callDate: readDate(row, mapping, 'callDate', 'Call Date', rowNumber, recordLabel, issues, warnings),
    callOutcome: displayText(cell(row, mapping, 'callOutcome')),
    dealPotential: displayText(cell(row, mapping, 'dealPotential')),
    notes: displayText(cell(row, mapping, 'notes')),
    observedCampaignActivity: displayText(cell(row, mapping, 'observedCampaignActivity')),
    hypothesizedPain: displayText(cell(row, mapping, 'hypothesizedPain')),
    outreachAngle: displayText(cell(row, mapping, 'outreachAngle')),
    dateAdded: readDate(row, mapping, 'dateAdded', 'Date Added', rowNumber, recordLabel, issues, warnings),
    campaignReadinessEvidence: displayText(cell(row, mapping, 'campaignReadinessEvidence')),
    spendSignalEvidence: displayText(cell(row, mapping, 'spendSignalEvidence')),
    executionPainEvidence: displayText(cell(row, mapping, 'executionPainEvidence')),
    accessEvidence: displayText(cell(row, mapping, 'accessEvidence')),
    observedCampaignActivityEvidence: displayText(cell(row, mapping, 'observedCampaignActivityEvidence')),
    hypothesizedPainEvidence: displayText(cell(row, mapping, 'hypothesizedPainEvidence')),
  };
  const searchText = Object.values(values).filter(value => typeof value === 'string').join(' ').toLocaleLowerCase();
  if (website || linkedInPage || linkedInProfile || emails.length || instagramUrl) stats.contactableCount += 1;
  return {
    identitySeed,
    record: {
      kind: 'b2b', id: '', ...recordBase(rowNumber, source), ...values, searchText,
    },
  };
}

export function importWorkbookRows(payload: WorkbookRowsPayload): ImportResult {
  const detection = detectWorkbookHeaders(payload.rows);
  const hyperlinks = new Map(
    (payload.hyperlinks ?? [])
      .filter(link => Number.isInteger(link.rowIndex) && link.rowIndex >= 0
        && Number.isInteger(link.columnIndex) && link.columnIndex >= 0
        && typeof link.target === 'string' && link.target.trim())
      .map(link => [hyperlinkKey(link.rowIndex, link.columnIndex), link.target.trim()]),
  );
  const schema = detection.kind === 'creator' ? CREATOR_SCHEMA : B2B_SCHEMA;
  const aliases = aliasesFor(schema);
  const mapping = buildMapping(detection.headers, schema);
  const namedHeaders = detection.headers.filter(header => header.trim());
  const recognizedHeaders = namedHeaders.filter(header => aliases.has(normalizeHeader(header)));
  const unknownHeaders = namedHeaders.filter(header => !aliases.has(normalizeHeader(header)));
  const missingRecommendedHeaders = schema
    .filter(definition => definition.recommended && !mapping.has(definition.key))
    .map(definition => definition.label);
  const issues: ImportIssue[] = [];
  const stats: MutableStats = {
    duplicateCount: 0, repairedUrlCount: 0, multipleEmailCount: 0, contactableCount: 0,
    scoreMismatchCount: 0, blankRowCount: 0, quarantinedRowCount: 0,
  };
  const parsed: Array<{ record: CreatorRecord | B2BRecord; identitySeed: string }> = [];
  payload.rows.slice(detection.headerRowIndex + 1).forEach((row, offset) => {
    const rowIndex = detection.headerRowIndex + offset + 1;
    const rowNumber = detection.headerRowIndex + offset + 2;
    if (!hasRowData(row)) {
      stats.blankRowCount += 1;
      return;
    }
    const candidate = detection.kind === 'creator'
      ? creatorFromRow(row, rowIndex, rowNumber, detection.headers, mapping, hyperlinks, issues, stats)
      : b2bFromRow(row, rowIndex, rowNumber, detection.headers, mapping, hyperlinks, issues, stats);
    if (candidate) parsed.push(candidate);
  });
  if (parsed.length === 0) throw new Error(`No valid ${detection.kind === 'creator' ? 'creator' : 'B2B prospect'} records were found.`);
  const identityCounts = new Map<string, number>();
  parsed.forEach(candidate => {
    const duplicateNumber = identityCounts.get(candidate.identitySeed) ?? 0;
    identityCounts.set(candidate.identitySeed, duplicateNumber + 1);
    const baseId = `${detection.kind}_${stableHash(candidate.identitySeed)}`;
    candidate.record.id = duplicateNumber === 0 ? baseId : `${baseId}_duplicate_${duplicateNumber + 1}`;
    if (duplicateNumber > 0) {
      stats.duplicateCount += 1;
      makeIssue(issues, candidate.record.warnings, {
        severity: 'warning', code: 'duplicate-candidate', rowNumber: candidate.record.rowNumber,
        recordLabel: candidate.record.kind === 'creator' ? candidate.record.creatorName : candidate.record.companyName,
        field: 'Identity', sourceValue: candidate.identitySeed,
        message: 'This record shares its normalized identity with another row and was retained separately.',
      });
    }
  });
  const records = parsed.map(candidate => candidate.record);
  const fingerprint = `${detection.kind}_v1_${stableHash(records.map(record => record.id).sort().join('|'))}_${records.length}`;
  return {
    kind: detection.kind,
    fingerprint,
    records,
    report: {
      detectedKind: detection.kind,
      expectedKind: payload.expectedKind,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      sheetName: payload.sheetName,
      additionalSheets: payload.additionalSheets,
      headerRowNumber: detection.headerRowIndex + 1,
      sourceHeaders: namedHeaders,
      recognizedHeaders,
      unknownHeaders,
      missingRecommendedHeaders,
      recordCount: records.length,
      blankRowCount: stats.blankRowCount,
      quarantinedRowCount: stats.quarantinedRowCount,
      duplicateCount: stats.duplicateCount,
      repairedUrlCount: stats.repairedUrlCount,
      multipleEmailCount: stats.multipleEmailCount,
      contactableCount: stats.contactableCount,
      scoreMismatchCount: stats.scoreMismatchCount,
      issues,
    },
  };
}
