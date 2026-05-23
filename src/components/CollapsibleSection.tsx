import { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { hasContent } from '@/utils/validators';
import ExpandableText from './ExpandableText';

interface CollapsibleSectionProps {
  title: string;
  text: string;
  icon: LucideIcon;
  maxHeight?: number;
  defaultExpanded?: boolean;
  className?: string;
}

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  text,
  icon: Icon,
  maxHeight = 120,
  defaultExpanded = false,
  className = '',
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!hasContent(text)) return null;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center">
            <Icon size={14} className="text-gray-500" />
          </div>
          <span className="text-[13px] font-semibold text-gray-700">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100">
          <ExpandableText text={text} maxHeight={maxHeight} />
        </div>
      )}
    </div>
  );
});

export default CollapsibleSection;
