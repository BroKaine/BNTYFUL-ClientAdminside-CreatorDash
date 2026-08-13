import { BadgeCheck, Globe2, Mail, UserRound, XCircle } from 'lucide-react';
import type { CreatorRecord } from '@/features/import/model/import.types';
import { ScoreMetric } from '@/shared/components/ScoreMetric';
import { formatNumber } from '@/shared/lib/normalize';
import type { CreatorDecision } from '../model/creator.model';

interface CreatorCardProps {
  record: CreatorRecord;
  decision?: CreatorDecision;
  onOpen(): void;
  onDecision(decision: CreatorDecision | null): void;
}

export function CreatorCard({ record, decision, onOpen, onDecision }: CreatorCardProps) {
  return (
    <article className={decision === 'Approved' ? 'creator-card is-approved' : decision === 'Not approved' ? 'creator-card is-not-approved' : 'creator-card'}>
      <div className="creator-card__identity"><span className="creator-avatar"><UserRound /></span><div><div className="title-row"><h3>{record.creatorName}</h3>{record.tier && <span className="tier-badge">{record.tier}</span>}{record.warnings.length > 0 && <span className="warning-count">! {record.warnings.length}</span>}</div><p>{[record.creatorType, record.category, record.subcategory].filter(Boolean).join(' · ') || 'Creator details not provided'}</p><span><Globe2 size={13} />{record.region || 'Region not provided'}{record.language && ` · ${record.language}`}</span></div></div>
      <div className="creator-card__scores"><ScoreMetric compact label="Content" value={record.contentFit} /><ScoreMetric compact label="Audience" value={record.audienceEngagement} /><ScoreMetric compact label="Authority" value={record.authorityOpinion} /><ScoreMetric compact label="Access" value={record.accessPartnership} /><div className="total-score"><strong>{record.sourceTotalScore ?? '—'}</strong><small>Total score</small></div></div>
      <div className="creator-card__reach"><span><strong>{formatNumber(record.audienceSize)}</strong><small>Audience</small></span><span><strong>{formatNumber(record.totalLikes)}</strong><small>Likes</small></span><span><strong>{formatNumber(record.videoCount)}</strong><small>Videos</small></span></div>
      <div className="creator-card__research"><div><small>Observed activity</small><p>{record.observedActivity || 'No observed activity provided.'}</p></div><div><small>Partnership angle</small><p>{record.partnershipAngle || 'No partnership angle provided.'}</p></div><div><small>Outreach angle</small><p>{record.outreachAngle || 'No outreach angle provided.'}</p></div></div>
      <div className="creator-card__actions"><div className="contact-preview">{record.emails[0] && <a href={`mailto:${record.emails[0]}`}><Mail size={14} />{record.emails[0]}</a>}<span>{record.primaryPlatform || 'Platform not provided'}</span></div><button className="button button--secondary" type="button" onClick={onOpen}>Review full profile</button><div className="decision-buttons"><button type="button" className={decision === 'Not approved' ? 'decision is-negative' : 'decision'} onClick={() => onDecision(decision === 'Not approved' ? null : 'Not approved')}><XCircle size={15} /> Not approved</button><button type="button" className={decision === 'Approved' ? 'decision is-positive' : 'decision'} onClick={() => onDecision(decision === 'Approved' ? null : 'Approved')}><BadgeCheck size={15} /> Approve</button></div></div>
    </article>
  );
}
