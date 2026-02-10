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
      <span className="progress-text">
        <strong>{reviewed}</strong>/{total}
      </span>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="progress-chips">
        {useCount > 0 && <span className="chip chip--use">{useCount}</span>}
        {likeCount > 0 && <span className="chip chip--like">{likeCount}</span>}
        {removeCount > 0 && <span className="chip chip--remove">{removeCount}</span>}
      </div>
    </div>
  );
}
