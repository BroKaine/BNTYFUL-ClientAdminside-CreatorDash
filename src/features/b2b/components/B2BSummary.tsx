import { AlertTriangle, BadgeCheck, BriefcaseBusiness, ChartNoAxesCombined, ContactRound, ListChecks } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import type { B2BStoredDecision } from '../model/b2b.model';
import { deriveTaxonomy } from '@/shared/lib/taxonomy';
import { formatNumber } from '@/shared/lib/normalize';

interface B2BSummaryProps {
  records: B2BRecord[];
  decisions: Map<string, B2BStoredDecision>;
}

function average(records: B2BRecord[], accessor: (record: B2BRecord) => number | null): string {
  const values = records.map(accessor).filter((value): value is number => value !== null);
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : '—';
}

export function B2BSummary({ records, decisions }: B2BSummaryProps) {
  const shortlisted = records.filter(record => decisions.get(record.id)?.decision === 'Shortlisted').length;
  const reviewed = records.filter(record => decisions.has(record.id)).length;
  const contactable = records.filter(record => record.emails.length || record.linkedInProfile || record.website || record.linkedInPage).length;
  const warnings = records.reduce((sum, record) => sum + record.warnings.length, 0);
  const categories = deriveTaxonomy(records, record => record.category);
  const tiers = deriveTaxonomy(records, record => record.tier);
  const main = [
    { label: 'Matched prospects', value: formatNumber(records.length), icon: BriefcaseBusiness, tone: 'blue' },
    { label: 'Shortlisted', value: formatNumber(shortlisted), icon: BadgeCheck, tone: 'green' },
    { label: 'Reviewed', value: formatNumber(reviewed), icon: ListChecks, tone: 'purple' },
    { label: 'Average total score', value: average(records, record => record.sourceTotalScore), icon: ChartNoAxesCombined, tone: 'amber' },
  ];
  const dimensions = [
    ['Campaign readiness', average(records, record => record.campaignReadiness)],
    ['Spend signal', average(records, record => record.spendSignal)],
    ['Execution pain', average(records, record => record.executionPain)],
    ['Access', average(records, record => record.access)],
  ];
  return (
    <section className="summary-stack" aria-label="B2B prospect overview">
      <div className="kpi-grid">{main.map(item => <article className="kpi-card" key={item.label}><span className={`kpi-icon kpi-icon--${item.tone}`}><item.icon /></span><div><small>{item.label}</small><strong>{item.value}</strong></div></article>)}</div>
      <div className="portfolio-strip">
        <div className="dimension-summary">{dimensions.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}<em>/ 5</em></strong></span>)}</div>
        <div className="coverage-summary">
          <span><ContactRound /><strong>{contactable}</strong><small>Contactable</small></span>
          <span><AlertTriangle /><strong>{warnings}</strong><small>Data notes</small></span>
        </div>
      </div>
      <div className="distribution-grid">
        <article className="surface distribution-card"><div className="section-heading"><div><p className="eyebrow">Dynamic portfolio</p><h2>Category mix</h2></div><span>{categories.length} values</span></div><div className="bar-list">{categories.slice(0, 6).map(option => <div key={option.key}><span><strong>{option.label}</strong><small>{option.count}</small></span><div><i style={{ width: `${(option.count / Math.max(records.length, 1)) * 100}%` }} /></div></div>)}</div>{categories.length > 6 && <p className="table-note">+ {categories.length - 6} more categories remain available in filters.</p>}</article>
        <article className="surface distribution-card"><div className="section-heading"><div><p className="eyebrow">Source-defined</p><h2>Tier mix</h2></div><span>{tiers.length} values</span></div><div className="tier-cloud">{tiers.length ? tiers.map(option => <span key={option.key}><strong>{option.label}</strong>{option.count}</span>) : <p className="empty-inline">No tier data provided</p>}</div><p className="table-note">Tiers are shown as supplied; BNTYFUL does not impose an ordering.</p></article>
      </div>
    </section>
  );
}
