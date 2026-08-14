import { ArrowLeft, ArrowRight, BadgeCheck, Building2, ExternalLink, Instagram, Linkedin, Mail, MapPin, ThumbsDown, UserRound } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import { SidePanel } from '@/shared/components/SidePanel';
import { ScoreMetric } from '@/shared/components/ScoreMetric';
import type { B2BDecision } from '../model/b2b.model';

interface B2BProspectDetailProps {
  record: B2BRecord;
  decision?: B2BDecision;
  position: number;
  total: number;
  onClose(): void;
  onPrevious(): void;
  onNext(): void;
  onDecision(decision: B2BDecision | null): void;
}

function Value({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="detail-value"><dt>{label}</dt><dd>{value || '—'}</dd></div>;
}

function SafeLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof ExternalLink }) {
  return href ? <a className="contact-button" href={href} target="_blank" rel="noopener noreferrer"><Icon size={16} />{label}<ExternalLink size={13} /></a> : null;
}

export function B2BProspectDetail({ record, decision, position, total, onClose, onPrevious, onNext, onDecision }: B2BProspectDetailProps) {
  const pipelinePresent = Boolean(record.status || record.firstContactDate || record.channel || record.lastTouchDate || record.numberOfTouches !== null || record.responseType || record.callDate || record.callOutcome || record.dealPotential || record.notes);
  const evidence = [
    ['Campaign readiness', record.campaignReadinessEvidence], ['Spend signal', record.spendSignalEvidence],
    ['Execution pain', record.executionPainEvidence], ['Access', record.accessEvidence],
    ['Observed campaign activity', record.observedCampaignActivityEvidence], ['Hypothesized pain', record.hypothesizedPainEvidence],
  ];
  return (
    <SidePanel eyebrow={`${record.category || 'B2B prospect'} · ${position + 1} of ${total}`} title={record.companyName} onClose={onClose} footer={<><div className="panel-pagination"><button type="button" onClick={onPrevious} disabled={position === 0}><ArrowLeft size={15} /> Previous</button><button type="button" onClick={onNext} disabled={position === total - 1}>Next <ArrowRight size={15} /></button></div><div className="decision-buttons"><button type="button" className={decision === 'Not a fit' ? 'decision is-negative' : 'decision'} onClick={() => onDecision(decision === 'Not a fit' ? null : 'Not a fit')}><ThumbsDown size={15} /> Not a fit</button><button type="button" className={decision === 'Shortlisted' ? 'decision is-positive' : 'decision'} onClick={() => onDecision(decision === 'Shortlisted' ? null : 'Shortlisted')}><BadgeCheck size={15} /> Shortlist</button></div></>}>
      <section className="detail-hero"><span className="company-avatar company-avatar--large"><Building2 /></span><div><p>{record.subcategory || 'Subcategory not provided'}</p><span><MapPin size={14} />{record.location || 'Location not provided'}</span></div><div className="detail-total"><strong>{record.sourceTotalScore ?? '—'}</strong><small>Total score</small>{record.tier && <span className="tier-badge">{record.tier}</span>}</div></section>
      <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Qualification</p><h3>Why this prospect scored this way</h3></div></div><div className="detail-score-grid"><ScoreMetric label="Campaign readiness" value={record.campaignReadiness} /><ScoreMetric label="Spend signal" value={record.spendSignal} /><ScoreMetric label="Execution pain" value={record.executionPain} /><ScoreMetric label="Access" value={record.access} /></div>{record.sourceTotalScore !== record.calculatedTotalScore && record.calculatedTotalScore !== null && <p className="callout"><strong>Score check:</strong> source total {record.sourceTotalScore ?? 'not provided'}, calculated total {record.calculatedTotalScore}.</p>}</section>
      <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Contact</p><h3>Decision maker and routes</h3></div></div><div className="contact-person"><UserRound /><div><strong>{record.decisionMaker || 'Not provided'}</strong><span>{record.role || 'Role not provided'}</span></div></div><div className="contact-button-grid"><SafeLink href={record.website} label="Company website" icon={Building2} /><SafeLink href={record.linkedInPage} label="Company LinkedIn" icon={Linkedin} /><SafeLink href={record.linkedInProfile} label="Decision-maker LinkedIn" icon={Linkedin} /><SafeLink href={record.instagramUrl} label={record.instagramHandle || 'Instagram'} icon={Instagram} />{record.emails.map(email => <a className="contact-button" href={`mailto:${email}`} key={email}><Mail size={16} />{email}</a>)}</div>{record.emailRaw && record.emails.length === 0 && <p className="callout">Source email value could not be validated: {record.emailRaw}</p>}</section>
      <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Commercial thesis</p><h3>Research and recommended angle</h3></div></div><div className="thesis-stack"><article><small>Observed campaign activity</small><p>{record.observedCampaignActivity || 'Not provided'}</p></article><article className="hypothesis"><small>Hypothesis · not a verified fact</small><p>{record.hypothesizedPain || 'Not provided'}</p></article><article><small>Outreach angle</small><p>{record.outreachAngle || 'Not provided'}</p></article></div></section>
      <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Evidence</p><h3>Research supporting the assessment</h3></div></div><div className="evidence-list">{evidence.map(([label, value]) => <details key={label}><summary>{label}<span>{value ? 'Available' : 'Not provided'}</span></summary><p>{value || 'No evidence was supplied for this field.'}</p></details>)}</div></section>
      <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Pipeline</p><h3>Outreach and conversion</h3></div></div>{pipelinePresent ? <dl className="definition-grid"><Value label="Status" value={record.status} /><Value label="First contact" value={record.firstContactDate} /><Value label="Channel" value={record.channel} /><Value label="Last touch" value={record.lastTouchDate} /><Value label="Touches" value={record.numberOfTouches} /><Value label="Response" value={record.responseType} /><Value label="Call date" value={record.callDate} /><Value label="Call outcome" value={record.callOutcome} /><Value label="Deal potential" value={record.dealPotential} /><Value label="Notes" value={record.notes} /></dl> : <p className="empty-inline">No outreach has been recorded in the source workbook.</p>}</section>
      {record.warnings.length > 0 && <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Data quality</p><h3>Source notes</h3></div></div><ul className="warning-list">{record.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></section>}
    </SidePanel>
  );
}
