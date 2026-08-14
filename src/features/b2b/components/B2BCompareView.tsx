import { X } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import { SidePanel } from '@/shared/components/SidePanel';

interface B2BCompareViewProps {
  records: B2BRecord[];
  onRemove(id: string): void;
  onClose(): void;
}

const comparisonRows: Array<[string, (record: B2BRecord) => React.ReactNode]> = [
  ['Category', record => record.category || '—'], ['Location', record => record.location || '—'],
  ['Decision maker', record => record.decisionMaker || '—'], ['Role', record => record.role || '—'],
  ['Total score', record => record.sourceTotalScore ?? '—'], ['Tier', record => record.tier || '—'],
  ['Campaign readiness', record => record.campaignReadiness ?? '—'], ['Spend signal', record => record.spendSignal ?? '—'],
  ['Execution pain', record => record.executionPain ?? '—'], ['Access', record => record.access ?? '—'],
  ['Contact routes', record => [record.emails.length && 'Email', record.linkedInProfile && 'LinkedIn', record.website && 'Website', record.instagramUrl && 'Instagram'].filter(Boolean).join(', ') || '—'],
  ['Observed activity', record => record.observedCampaignActivity || '—'],
  ['Hypothesized pain', record => <span className="hypothesis-text"><small>Hypothesis</small>{record.hypothesizedPain || '—'}</span>],
  ['Outreach angle', record => record.outreachAngle || '—'],
  ['Evidence coverage', record => `${[record.campaignReadinessEvidence, record.spendSignalEvidence, record.executionPainEvidence, record.accessEvidence, record.observedCampaignActivityEvidence, record.hypothesizedPainEvidence].filter(Boolean).length} of 6`],
];

export function B2BCompareView({ records, onRemove, onClose }: B2BCompareViewProps) {
  return (
    <SidePanel eyebrow="Side-by-side assessment" title={`Compare ${records.length} prospects`} onClose={onClose}>
      <p className="comparison-intro">Source values and evidence are aligned for review. BNTYFUL does not choose a winner or assume a scoring dimension is universally preferable.</p>
      <div className="comparison-table" style={{ '--compare-count': records.length } as React.CSSProperties} role="table" aria-label="Prospect comparison">
        <div className="comparison-row comparison-row--header" role="row"><div role="columnheader">Attribute</div>{records.map(record => <div role="columnheader" key={record.id}><strong>{record.companyName}</strong><button className="icon-button" type="button" onClick={() => onRemove(record.id)} aria-label={`Remove ${record.companyName} from comparison`}><X size={14} /></button></div>)}</div>
        {comparisonRows.map(([label, accessor]) => <div className="comparison-row" role="row" key={label}><div role="rowheader">{label}</div>{records.map(record => <div role="cell" key={record.id}>{accessor(record)}</div>)}</div>)}
      </div>
    </SidePanel>
  );
}
