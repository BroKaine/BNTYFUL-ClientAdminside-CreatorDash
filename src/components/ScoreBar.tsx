import React from 'react';

interface ScoreBarProps {
  score: number;
  label: string;
  ariaLabel?: string;
}

const ScoreBar = React.memo(function ScoreBar({ score, label, ariaLabel }: ScoreBarProps) {
  const filledSegments = Math.max(0, Math.min(5, Math.round(score)));

  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={ariaLabel || `${label}: ${score} out of 5`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="rounded-sm transition-colors duration-200"
            style={{
              width: 24,
              height: 8,
              backgroundColor: i < filledSegments ? '#14B8A6' : '#E2E8F0',
              borderRadius: 3,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
    </div>
  );
});

export default ScoreBar;
