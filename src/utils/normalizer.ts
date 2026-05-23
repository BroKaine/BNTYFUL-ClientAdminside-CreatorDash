import * as XLSX from 'xlsx';
import type { Influencer } from '@/types/influencer';
import { parseNumberValue, parseIntegerValue } from './formatters';
import { normalizeYesNo, isValidUrl } from './validators';

// Map of canonical field names to possible header names (case-insensitive)
const HEADER_MAP: Record<string, string[]> = {
  creatorName: ['creator / page name', 'creator name', 'page name', 'creator/page name'],
  creatorType: ['creator type', 'type'],
  category: ['catagory', 'category'],
  subcategory: ['subcategory'],
  primaryPlatform: ['primary platform', 'platform'],
  tiktokUrl: ['tiktok url', 'tiktok'],
  instagramUrl: ['instagram url', 'instagram'],
  youtubeUrl: ['youtube url', 'youtube'],
  twitterUrl: ['x/twitter url', 'twitter url', 'x url'],
  otherPlatformUrl: ['other platform', 'other platform url'],
  region: ['region'],
  language: ['language'],
  audienceSize: ['audience size', 'audience', 'followers'],
  totalLikes: ['total likes', 'likes'],
  videoCount: ['video count', 'videos'],
  descriptionNotes: ['description notes', 'description', 'notes'],
  contactName: ['contact name'],
  email: ['email'],
  linkInBio: ['link-in-bio', 'link in bio', 'linkinbio'],
  agency: ['agency'],
  dmViable: ['dm viable'],
  contentFit: ['content fit'],
  audienceEngagement: ['audience & engagement', 'audience and engagement', 'audience engagement'],
  authorityOpinion: ['authority & opinion strength', 'authority and opinion strength', 'authority opinion'],
  accessPartnership: ['access & partnership viability', 'access and partnership viability', 'access partnership'],
  totalScore: ['total score', 'score'],
  tier: ['tier'],
  status: ['status'],
  observedActivity: ['observed activity'],
  partnershipAngle: ['partnership angle'],
  outreachAngle: ['outreach angle'],
  contentFitEvidence: ['content fit evidence'],
  audienceEngagementEvidence: ['audience & engagement signal evidence', 'audience engagement signal evidence', 'audience & engagement evidence'],
  authorityOpinionEvidence: ['authority & opinion strength evidence', 'authority opinion strength evidence', 'authority opinion evidence'],
  accessPartnershipEvidence: ['access & partnership viability evidence', 'access partnership viability evidence', 'access partnership evidence'],
  observedActivityEvidence: ['observed activity evidence'],
  partnershipAngleEvidence: ['partnership angle evidence'],
  highLevelNotes: ['high level notes', 'high-level notes'],
  firstContact: ['first contact'],
  channel: ['channel'],
  lastTouch: ['last touch'],
  touches: ['touches'],
  callDate: ['call date'],
  callOutcome: ['call outcome'],
  dealPotential: ['deal potential'],
};

function findHeaderMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const lowerHeaders = headers.map((h, i) => ({ original: h, lower: h.toLowerCase().trim(), index: i }));

  for (const [canonical, possibleNames] of Object.entries(HEADER_MAP)) {
    for (const name of possibleNames) {
      const match = lowerHeaders.find(h => h.lower === name);
      if (match) {
        mapping[canonical] = match.index;
        break;
      }
    }
    // Fallback: partial match
    if (!mapping[canonical]) {
      for (const name of possibleNames) {
        const match = lowerHeaders.find(h => h.lower.includes(name));
        if (match) {
          mapping[canonical] = match.index;
          break;
        }
      }
    }
  }

  return mapping;
}

function getCellValue(row: any[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) return '';
  const val = row[index];
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val.toString();
  return val.toString().trim();
}

function getNumberCell(row: any[], index: number | undefined): number {
  if (index === undefined || index < 0 || index >= row.length) return 0;
  const val = row[index];
  if (val === null || val === undefined) return 0;
  return parseNumberValue(val);
}

function getIntegerCell(row: any[], index: number | undefined): number {
  if (index === undefined || index < 0 || index >= row.length) return 0;
  const val = row[index];
  if (val === null || val === undefined) return 0;
  return parseIntegerValue(val);
}

function getBooleanCell(row: any[], index: number | undefined): boolean {
  if (index === undefined || index < 0 || index >= row.length) return false;
  return normalizeYesNo(row[index]);
}

export function detectHeaderRow(jsonData: any[][]): { headers: string[]; dataStartIndex: number } {
  // Try row index 3 first (0-indexed, which is row 4 in the brief)
  if (jsonData.length > 3) {
    const row3 = jsonData[3];
    const validHeaders = row3.filter(h => h && h.toString().trim().length > 0);
    if (validHeaders.length >= 10) {
      return { headers: row3.map(h => h?.toString().trim() || ''), dataStartIndex: 4 };
    }
  }

  // Fallback: scan first 10 rows for the row with the most text-based headers
  let bestRow = 0;
  let bestCount = 0;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row)) continue;
    const textHeaders = row.filter(h => h && h.toString().trim().length > 0 && isNaN(Number(h)));
    if (textHeaders.length > bestCount) {
      bestCount = textHeaders.length;
      bestRow = i;
    }
  }

  return { headers: jsonData[bestRow].map(h => h?.toString().trim() || ''), dataStartIndex: bestRow + 1 };
}

export function parseXlsx(file: File): Promise<Influencer[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('The file is empty.'));
          return;
        }

        const { headers, dataStartIndex } = detectHeaderRow(jsonData);
        const mapping = findHeaderMapping(headers);

        // Check if we found essential columns
        if (!mapping.creatorName) {
          reject(new Error('Could not find required column "Creator / Page Name". Please check your file format.'));
          return;
        }

        const influencers: Influencer[] = [];

        for (let i = dataStartIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;

          const creatorName = getCellValue(row, mapping.creatorName);
          if (!creatorName || creatorName.trim() === '') continue;

          const influencer: Influencer = {
            id: `inf_${i}_${creatorName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`,
            rowIndex: i,

            creatorName,
            creatorType: getCellValue(row, mapping.creatorType),
            category: getCellValue(row, mapping.category),
            subcategory: getCellValue(row, mapping.subcategory),
            primaryPlatform: getCellValue(row, mapping.primaryPlatform),
            tiktokUrl: getCellValue(row, mapping.tiktokUrl),
            instagramUrl: getCellValue(row, mapping.instagramUrl),
            youtubeUrl: getCellValue(row, mapping.youtubeUrl),
            twitterUrl: getCellValue(row, mapping.twitterUrl),
            otherPlatformUrl: getCellValue(row, mapping.otherPlatformUrl),
            region: getCellValue(row, mapping.region),
            language: getCellValue(row, mapping.language),
            audienceSize: getNumberCell(row, mapping.audienceSize),
            totalLikes: getNumberCell(row, mapping.totalLikes),
            videoCount: getCellValue(row, mapping.videoCount),
            descriptionNotes: getCellValue(row, mapping.descriptionNotes),

            contactName: getCellValue(row, mapping.contactName),
            email: getCellValue(row, mapping.email),
            linkInBio: getCellValue(row, mapping.linkInBio),
            agency: getCellValue(row, mapping.agency),
            dmViable: getBooleanCell(row, mapping.dmViable),

            contentFit: getIntegerCell(row, mapping.contentFit),
            audienceEngagement: getIntegerCell(row, mapping.audienceEngagement),
            authorityOpinion: getIntegerCell(row, mapping.authorityOpinion),
            accessPartnership: getIntegerCell(row, mapping.accessPartnership),
            totalScore: getIntegerCell(row, mapping.totalScore),
            tier: getCellValue(row, mapping.tier),
            status: getCellValue(row, mapping.status),

            observedActivity: getCellValue(row, mapping.observedActivity),
            partnershipAngle: getCellValue(row, mapping.partnershipAngle),
            outreachAngle: getCellValue(row, mapping.outreachAngle),
            contentFitEvidence: getCellValue(row, mapping.contentFitEvidence),
            audienceEngagementEvidence: getCellValue(row, mapping.audienceEngagementEvidence),
            authorityOpinionEvidence: getCellValue(row, mapping.authorityOpinionEvidence),
            accessPartnershipEvidence: getCellValue(row, mapping.accessPartnershipEvidence),
            observedActivityEvidence: getCellValue(row, mapping.observedActivityEvidence),
            partnershipAngleEvidence: getCellValue(row, mapping.partnershipAngleEvidence),
            highLevelNotes: getCellValue(row, mapping.highLevelNotes),

            firstContact: getCellValue(row, mapping.firstContact),
            channel: getCellValue(row, mapping.channel),
            lastTouch: getCellValue(row, mapping.lastTouch),
            touches: getIntegerCell(row, mapping.touches),
            callDate: getCellValue(row, mapping.callDate),
            callOutcome: getCellValue(row, mapping.callOutcome),
            dealPotential: getCellValue(row, mapping.dealPotential),
          };

          influencers.push(influencer);
        }

        if (influencers.length === 0) {
          reject(new Error('No influencer data found in the file. Please check the format.'));
          return;
        }

        resolve(influencers);
      } catch (err) {
        reject(new Error('Failed to parse the file. Please ensure it is a valid Excel or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

export function extractFilterOptions(influencers: Influencer[]) {
  const unique = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();

  // Derive available platforms from URLs (not just primaryPlatform)
  const platformSet = new Set<string>();
  influencers.forEach(i => {
    if (isValidUrl(i.tiktokUrl)) platformSet.add('TikTok');
    if (isValidUrl(i.instagramUrl)) platformSet.add('Instagram');
    if (isValidUrl(i.youtubeUrl)) platformSet.add('YouTube');
    if (isValidUrl(i.twitterUrl)) platformSet.add('X');
  });

  return {
    tiers: unique(influencers.map(i => i.tier)),
    categories: unique(influencers.map(i => i.category)),
    subcategories: unique(influencers.map(i => i.subcategory)),
    platforms: Array.from(platformSet).sort(),
    regions: unique(influencers.map(i => i.region)),
    languages: unique(influencers.map(i => i.language)),
    audienceRange: {
      min: Math.min(...influencers.map(i => i.audienceSize).filter(v => v > 0)),
      max: Math.max(...influencers.map(i => i.audienceSize)),
    },
    scoreRange: {
      min: Math.min(...influencers.map(i => i.totalScore).filter(v => v > 0)),
      max: Math.max(...influencers.map(i => i.totalScore)),
    },
  };
}
