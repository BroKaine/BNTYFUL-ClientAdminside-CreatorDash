import type { CellValue } from '@/features/import/model/import.types';
import { B2B_SCHEMA, CREATOR_SCHEMA } from '@/features/import/model/workbook';

export const creatorHeaders = CREATOR_SCHEMA.map(definition => definition.label);
export const b2bHeaders = B2B_SCHEMA.map(definition => definition.label);

function rowFrom(headers: string[], values: Record<string, CellValue>): CellValue[] {
  return headers.map(header => values[header] ?? null);
}

export function creatorRows(count = 3): CellValue[][] {
  const rows: CellValue[][] = [
    ['BNTYFUL creator research'],
    ['Prepared for testing'],
    ['#', 'A. CREATOR INFO'],
    creatorHeaders,
  ];
  for (let index = 0; index < count; index += 1) {
    rows.push(rowFrom(creatorHeaders, {
      '#': index + 1,
      'Creator / Page Name': `Creator ${index + 1}`,
      'Creator Type': index % 2 ? 'Expert' : 'Publisher',
      Catagory: index % 2 ? 'Health & Wellness' : 'Financial Education',
      Subcategory: index % 2 ? 'Running / Mobility' : 'Personal Finance, Basics',
      'Primary Platform': index === 0 ? 'Insatgram' : 'YouTube',
      'Instagram URL': `instagram.com/creator${index + 1}`,
      Region: index % 2 ? 'Johannesburg' : 'Cape Town',
      Language: 'English',
      'Audience Size': `${index + 1}K`,
      'Total Likes': (index + 1) * 2500,
      'Video Count': 25 + index,
      Email: `creator${index + 1}@example.test`,
      'Link-in-Bio': `creator${index + 1}.example/link`,
      'DM Viable': index === 0 ? 'Yes — public DMs open' : 'No',
      'Content Fit': 4,
      'Audience & Engagement': 3,
      'Authority & Opinion Strength': 5,
      'Access & Partnership Viability': 2,
      'Total Score': 14,
      Tier: index % 2 ? 'Priority' : 'Watchlist',
      'Observed Activity': 'Regular educational content',
      'Partnership Angle': 'Expert-led explainers',
      'Outreach Angle': 'Reference recent educational series',
      'Content Fit Evidence': 'Topic alignment is explicit.',
      'Audience & Engagement Signal Evidence': 'Comments show intent.',
      'Authority & Opinion Strength Evidence': 'Frequently cited by peers.',
      'Access & Partnership Viability Evidence': 'Public contact route.',
      'Observed Activity Evidence': 'Recent posts were reviewed.',
      'Partnership Angle Evidence': 'Format matches campaign needs.',
      'High Level Notes': '=potential spreadsheet formula',
    }));
  }
  return rows;
}

export function b2bRows(count = 3): CellValue[][] {
  const headers = ['', ...b2bHeaders, '', ''];
  const rows: CellValue[][] = [
    ['BNTYFUL B2B research'],
    ['Prepared for testing'],
    ['', 'A. COMPANY INFO'],
    headers,
  ];
  const categories = ['Legal Services', 'Industrial SaaS', 'Agricultural Co-operative'];
  for (let index = 0; index < count; index += 1) {
    rows.push(rowFrom(headers, {
      'Company Name': `Prospect ${index + 1}`,
      Category: categories[index % categories.length],
      Subcategory: index % 2 ? 'Operations & Logistics' : 'Risk / Compliance',
      'Location (City)': index % 2 ? 'Nairobi' : 'Cape Town',
      Website: `prospect${index + 1}.example`,
      'Instagram Handle': `@prospect${index + 1}`,
      'LinkedIn Page': `linkedin.com/company/prospect-${index + 1}`,
      'Decision Maker': `Decision Maker ${index + 1}`,
      Role: 'Commercial Director',
      'LinkedIn Profile': index === 1 ? 'NA (alternative: linkedin.com/in/alternate-contact)' : `linkedin.com/in/person-${index + 1}`,
      Email: index === 0 ? 'first@example.test; second@example.test' : `person${index + 1}@example.test`,
      'IG DM Viable': index === 0 ? 'Yes — active profile' : 'No',
      'Campaign Readiness': 4,
      'Spend Signal': 3,
      'Execution Pain': 5,
      Access: 2,
      'Total Score': 14,
      Tier: index % 2 ? 'Explore' : 'Priority / Now',
      'Observed Campaign Activity': 'Active multi-channel launches.',
      'Hypothesized Pain': 'Coordination may be fragmented.',
      'Outreach Angle': 'Lead with operational simplification.',
      'Date Added': index === 0 ? 46244 : '2026-08-11',
      'Campaign Readiness Evidence': 'Current campaign cadence.',
      'Spend Signal Evidence': 'Visible paid placements.',
      'Execution Pain Evidence': 'Many concurrent workstreams.',
      'Access Evidence': 'Named decision maker.',
      'Observed Campaign Activity Evidence': 'Reviewed public channels.',
      'Hypothesized Pain Evidence': 'Inference from operating pattern.',
    }));
  }
  return rows;
}
