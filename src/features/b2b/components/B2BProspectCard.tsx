import { BadgeCheck, Building2, CalendarDays, ExternalLink, GitCompareArrows, Linkedin, Mail, MapPin, ThumbsDown, UserRound } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import { ScoreMetric } from '@/shared/components/ScoreMetric';
import type { B2BDecision } from '../model/b2b.model';

interface B2BProspectCardProps {
  record: B2BRecord;
  decision?: B2BDecision;
  comparing: boolean;
  onOpen(): void;
  onDecision(decision: B2BDecision | null): void;
  onCompare(): void;
}

function ExternalButton({ href, label, icon: Icon }: { href: string; label: string; icon: typeof ExternalLink }) {
  if (!href) return null;
  return <a className="link-icon" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon size={15} /></a>;
}

export function B2BProspectCard({ record, decision, comparing, onOpen, onDecision, onCompare }: B2BProspectCardProps) {
  return (
    <article className={decision === 'Shortlisted' ? 'prospect-card is-shortlisted' : decision === 'Not a fit' ? 'prospect-card is-not-fit' : 'prospect-card'}>
      <div className="prospect-card__identity">
        <span className="company-avatar"><Building2 /></span>
        <div><div className="title-row"><h3>{record.companyName}</h3>{record.tier && <span className="tier-badge">{record.tier}</span>}{record.warnings.length > 0 && <span className="warning-count" title={`${record.warnings.length} data-quality notes`}>! {record.warnings.length}</span>}</div><p>{[record.category, record.subcategory].filter(Boolean).join(' · ') || 'Category not provided'}</p><span><MapPin size={13} />{record.location || 'Location not provided'}{record.dateAdded && <><CalendarDays size={13} />{record.dateAdded}</>}</span></div>
        <div className="total-score"><strong>{record.sourceTotalScore ?? '—'}</strong><small>Total score</small></div>
      </div>
      <div className="prospect-card__scores">
        <ScoreMetric compact label="Campaign" value={record.campaignReadiness} />
        <ScoreMetric compact label="Spend" value={record.spendSignal} />
        <ScoreMetric compact label="Pain" value={record.executionPain} />
        <ScoreMetric compact label="Access" value={record.access} />
      </div>
      <div className="prospect-card__contact">
        <UserRound />
        <div><strong>{record.decisionMaker || 'Decision maker not provided'}</strong><span>{record.role || 'Role not provided'}</span></div>
        <div className="contact-links"><ExternalButton href={record.website} label={`Open ${record.companyName} website`} icon={ExternalLink} /><ExternalButton href={record.linkedInProfile} label={`Open ${record.decisionMaker || record.companyName} on LinkedIn`} icon={Linkedin} />{record.emails[0] && <a className="link-icon" href={`mailto:${record.emails[0]}`} aria-label={`Email ${record.emails[0]}`} title={record.emails.join('; ')}><Mail size={15} /></a>}</div>
      </div>
      <div className="prospect-card__thesis">
        <div><small>Observed activity</small><p>{record.observedCampaignActivity || 'No observed activity provided.'}</p></div>
        <div className="hypothesis"><small>Hypothesis</small><p>{record.hypothesizedPain || 'No pain hypothesis provided.'}</p></div>
        <div><small>Outreach angle</small><p>{record.outreachAngle || 'No outreach angle provided.'}</p></div>
      </div>
      <div className="prospect-card__actions">
        <button type="button" className="button button--secondary" onClick={onOpen}>Review full profile</button>
        <button type="button" className={comparing ? 'icon-text-button is-active' : 'icon-text-button'} onClick={onCompare} aria-pressed={comparing}><GitCompareArrows size={15} /> Compare</button>
        <div className="decision-buttons">
          <button type="button" className={decision === 'Not a fit' ? 'decision is-negative' : 'decision'} onClick={() => onDecision(decision === 'Not a fit' ? null : 'Not a fit')} aria-pressed={decision === 'Not a fit'}><ThumbsDown size={15} /> Not a fit</button>
          <button type="button" className={decision === 'Shortlisted' ? 'decision is-positive' : 'decision'} onClick={() => onDecision(decision === 'Shortlisted' ? null : 'Shortlisted')} aria-pressed={decision === 'Shortlisted'}><BadgeCheck size={15} /> Shortlist</button>
        </div>
      </div>
    </article>
  );
}
