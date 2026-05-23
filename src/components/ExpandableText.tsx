import { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxHeight?: number;
  className?: string;
}

const ExpandableText = memo(function ExpandableText({ text, maxHeight = 100, className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsExpansion(contentRef.current.scrollHeight > maxHeight);
    }
  }, [text, maxHeight]);

  if (!text || text.trim() === '' || text === '\u2014' || text === '-') {
    return <span className="text-gray-300 text-sm">{"\u2014"}</span>;
  }

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="text-[13px] text-gray-600 leading-relaxed overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 2000 : maxHeight }}
      >
        {text.split('\n').map((paragraph, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>{paragraph}</p>
        ))}
      </div>
      {needsExpansion && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show More <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
});

export default ExpandableText;
