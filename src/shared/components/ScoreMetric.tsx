import { formatNumber } from '@/shared/lib/normalize';

interface ScoreMetricProps {
  label: string;
  value: number | null;
  max?: number;
  compact?: boolean;
}

export function ScoreMetric({ label, value, max = 5, compact = false }: ScoreMetricProps) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={compact ? 'score-metric score-metric--compact' : 'score-metric'}>
      <div className="score-metric__label">
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
      <div className="score-metric__track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
