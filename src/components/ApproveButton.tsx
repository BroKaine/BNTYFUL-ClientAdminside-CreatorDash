import React from 'react';
import { Check } from 'lucide-react';

interface ApproveButtonProps {
  approved: boolean;
  onToggle: () => void;
}

const ApproveButton = React.memo(function ApproveButton({ approved, onToggle }: ApproveButtonProps) {
  if (approved) {
    return (
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all duration-200 hover:bg-emerald-200"
        aria-pressed="true"
        title="Click to unapprove"
      >
        <Check size={14} strokeWidth={3} />
        APPROVED
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold transition-all duration-200 hover:bg-emerald-600 active:scale-95"
      aria-pressed="false"
    >
      <Check size={14} strokeWidth={3} />
      Approve
    </button>
  );
});

export default ApproveButton;
