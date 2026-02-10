import type { SaveState } from '../types';

interface SaveIndicatorProps {
  state: SaveState;
  onRetry?: () => void;
}

export function SaveIndicator({ state, onRetry }: SaveIndicatorProps) {
  if (state === 'idle') return null;

  return (
    <span className={`save-indicator save-indicator--${state}`}>
      {state === 'saving' && (
        <>
          <span className="save-spinner" />
          Saving...
        </>
      )}
      {state === 'saved' && <>&#10003; Saved</>}
      {state === 'error' && (
        <>
          &#10007; Save failed
          {onRetry && (
            <button className="save-retry" onClick={onRetry} type="button">
              Retry
            </button>
          )}
        </>
      )}
    </span>
  );
}
