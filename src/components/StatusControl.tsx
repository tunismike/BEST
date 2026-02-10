import type { ReviewStatus } from '../types';

interface StatusControlProps {
  status: ReviewStatus;
  onChange: (status: ReviewStatus) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'use', label: 'Use' },
  { value: 'like', label: 'Like' },
  { value: 'remove', label: 'Remove' },
];

export function StatusControl({ status, onChange, disabled }: StatusControlProps) {
  return (
    <div className="status-control">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`status-btn status-btn--${opt.value}${status === opt.value ? ' status-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
