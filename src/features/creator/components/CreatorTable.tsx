import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { CreatorRecord } from '@/features/import/model/import.types';
import type { CreatorDecision } from '../model/creator.model';
import { formatNumber } from '@/shared/lib/normalize';

interface CreatorTableProps {
  records: CreatorRecord[];
  decisions: Map<string, { decision: CreatorDecision }>;
  onOpen(record: CreatorRecord): void;
  onDecision(record: CreatorRecord, decision: CreatorDecision | null): void;
}

const COLUMNS = ['Decision', 'Creator', 'Category', 'Platform', 'Region', 'Audience', 'Total', 'Tier', 'Content', 'Audience fit', 'Authority', 'Access', 'Actions'];

export function CreatorTable({ records, decisions, onOpen, onDecision }: CreatorTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({ count: records.length, getScrollElement: () => parentRef.current, estimateSize: () => 67, overscan: 8 });
  return <div ref={parentRef} className="data-table creator-table" role="table" aria-label="Creators">
    <div className="data-table__header" role="row">{COLUMNS.map(column => <div role="columnheader" key={column}>{column}</div>)}</div>
    <div className="data-table__body" style={{ height: `${virtualizer.getTotalSize()}px` }} role="rowgroup">{virtualizer.getVirtualItems().map(item => {
      const record = records[item.index]; const decision = decisions.get(record.id)?.decision;
      return <div className="data-table__row" role="row" key={record.id} style={{ transform: `translateY(${item.start}px)` }}>
        <div role="cell"><button type="button" className={decision === 'Approved' ? 'table-decision is-positive' : decision === 'Not approved' ? 'table-decision is-negative' : 'table-decision'} onClick={() => onDecision(record, decision === 'Approved' ? null : 'Approved')} aria-label={`${decision ?? 'Unreviewed'}: toggle approval for ${record.creatorName}`}><BadgeCheck size={16} />{decision ?? 'Unreviewed'}</button></div>
        <div role="cell"><button className="cell-link" type="button" onClick={() => onOpen(record)}>{record.creatorName}</button><small>{record.creatorType}</small></div>
        <div role="cell">{record.category || '—'}<small>{record.subcategory}</small></div><div role="cell">{record.primaryPlatform || '—'}</div><div role="cell">{record.region || '—'}</div><div role="cell" className="numeric-cell">{formatNumber(record.audienceSize)}</div><div role="cell" className="numeric-cell"><strong>{record.sourceTotalScore ?? '—'}</strong></div><div role="cell">{record.tier || '—'}</div>
        {[record.contentFit, record.audienceEngagement, record.authorityOpinion, record.accessPartnership].map((value, index) => <div role="cell" className="numeric-cell" key={index}>{value ?? '—'}</div>)}
        <div role="cell" className="row-actions"><button type="button" className="icon-button" onClick={() => onOpen(record)} aria-label={`Open ${record.creatorName}`}><ExternalLink size={15} /></button></div>
      </div>;
    })}</div>
  </div>;
}
