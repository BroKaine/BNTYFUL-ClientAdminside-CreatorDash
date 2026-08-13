import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BadgeCheck, ExternalLink, GitCompareArrows } from 'lucide-react';
import type { B2BRecord } from '@/features/import/model/import.types';
import type { B2BDecision } from '../model/b2b.model';

interface B2BProspectTableProps {
  records: B2BRecord[];
  decisions: Map<string, { decision: B2BDecision }>;
  compareIds: Set<string>;
  onOpen(record: B2BRecord): void;
  onDecision(record: B2BRecord, decision: B2BDecision | null): void;
  onCompare(record: B2BRecord): void;
}

const COLUMNS = ['Decision', 'Company', 'Category', 'Location', 'Decision maker', 'Total', 'Tier', 'Campaign', 'Spend', 'Pain', 'Access', 'Contact', 'Actions'];

export function B2BProspectTable({ records, decisions, compareIds, onOpen, onDecision, onCompare }: B2BProspectTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({ count: records.length, getScrollElement: () => parentRef.current, estimateSize: () => 67, overscan: 8 });
  return (
    <div ref={parentRef} className="data-table" role="table" aria-label="B2B prospects">
      <div className="data-table__header" role="row">{COLUMNS.map(column => <div role="columnheader" key={column}>{column}</div>)}</div>
      <div className="data-table__body" style={{ height: `${virtualizer.getTotalSize()}px` }} role="rowgroup">
        {virtualizer.getVirtualItems().map(item => {
          const record = records[item.index];
          const decision = decisions.get(record.id)?.decision;
          return (
            <div className="data-table__row" role="row" key={record.id} style={{ transform: `translateY(${item.start}px)` }}>
              <div role="cell"><button type="button" className={decision === 'Shortlisted' ? 'table-decision is-positive' : decision === 'Not a fit' ? 'table-decision is-negative' : 'table-decision'} onClick={() => onDecision(record, decision === 'Shortlisted' ? null : 'Shortlisted')} aria-label={`${decision ?? 'Unreviewed'}: toggle shortlist for ${record.companyName}`}><BadgeCheck size={16} />{decision ?? 'Unreviewed'}</button></div>
              <div role="cell"><button className="cell-link" type="button" onClick={() => onOpen(record)}>{record.companyName}</button><small>{record.subcategory}</small></div>
              <div role="cell">{record.category || '—'}</div><div role="cell">{record.location || '—'}</div>
              <div role="cell"><strong>{record.decisionMaker || '—'}</strong><small>{record.role}</small></div>
              <div role="cell" className="numeric-cell"><strong>{record.sourceTotalScore ?? '—'}</strong></div><div role="cell">{record.tier || '—'}</div>
              {[record.campaignReadiness, record.spendSignal, record.executionPain, record.access].map((value, index) => <div role="cell" className="numeric-cell" key={index}>{value ?? '—'}</div>)}
              <div role="cell" className="contact-dots"><i className={record.website ? 'is-on' : ''} title="Website" /><i className={record.linkedInProfile ? 'is-on' : ''} title="LinkedIn" /><i className={record.emails.length ? 'is-on' : ''} title="Email" /></div>
              <div role="cell" className="row-actions"><button type="button" onClick={() => onCompare(record)} className={compareIds.has(record.id) ? 'icon-button is-active' : 'icon-button'} aria-label={`Compare ${record.companyName}`}><GitCompareArrows size={15} /></button><button type="button" className="icon-button" onClick={() => onOpen(record)} aria-label={`Open ${record.companyName}`}><ExternalLink size={15} /></button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
