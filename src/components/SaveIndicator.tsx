import type { SaveState } from '../types';

interface SaveIndicatorProps {
  state: SaveState;
  onRetry?: () => void;
}

export function SaveIndicator({ state, onRetry }: SaveIndicatorProps) {
  if (state === 'idle') return null;

  return (
    <span className={`save-indicator save-indicator--${state}`}>
      {state === 'saving' && <span className="save-spinner" />}
      {state === 'saved' && <>&#10003;</>}
      {state === 'error' && (
        <>
          &#10007;
          {onRetry && (
            <button className="save-retry" onClick={onRetry} type="button">
              retry
            </button>
          )}
        </>
      )}
    </span>
  );
}
