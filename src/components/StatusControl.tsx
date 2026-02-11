import type { ReviewStatus } from '../types';

interface StatusControlProps {
  status: ReviewStatus;
  onChange: (status: ReviewStatus) => void;
  disabled?: boolean;
}

export function StatusControl({ status, onChange, disabled }: StatusControlProps) {
  return (
    <div className="status-control">
      <button
        type="button"
        className={`status-btn status-btn--use${status === 'use' ? ' status-btn--active' : ''}`}
        onClick={() => onChange(status === 'use' ? 'unreviewed' : 'use')}
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Use
      </button>
      <button
        type="button"
        className={`status-btn status-btn--like${status === 'like' ? ' status-btn--active' : ''}`}
        onClick={() => onChange(status === 'like' ? 'unreviewed' : 'like')}
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        Like
      </button>
      <button
        type="button"
        className={`status-btn status-btn--remove${status === 'remove' ? ' status-btn--active' : ''}`}
        onClick={() => onChange(status === 'remove' ? 'unreviewed' : 'remove')}
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Remove
      </button>
    </div>
  );
}
