import type { EffectiveItem } from '../types';

interface ProgressSummaryProps {
  items: EffectiveItem[];
}

export function ProgressSummary({ items }: ProgressSummaryProps) {
  const total = items.length;
  const reviewed = items.filter((i) => i.status !== 'unreviewed').length;
  const useCount = items.filter((i) => i.status === 'use').length;
  const likeCount = items.filter((i) => i.status === 'like').length;
  const removeCount = items.filter((i) => i.status === 'remove').length;
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <div className="progress-summary">
      <div className="progress-text">
        <strong>
          {reviewed} of {total}
        </strong>{' '}
        reviewed ({pct}%)
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="progress-chips">
        {useCount > 0 && <span className="chip chip--use">{useCount} Use</span>}
        {likeCount > 0 && <span className="chip chip--like">{likeCount} Like</span>}
        {removeCount > 0 && <span className="chip chip--remove">{removeCount} Remove</span>}
      </div>
    </div>
  );
}
