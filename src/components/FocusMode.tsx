import { useState, useEffect, useCallback, useRef } from 'react';
import type { EffectiveItem, ReviewStatus, SaveState } from '../types';
import { EditForm } from './EditForm';
import { SaveIndicator } from './SaveIndicator';
import { CommentBox } from './CommentBox';

interface FocusModeProps {
  items: EffectiveItem[];
  saveStates: Record<string, SaveState>;
  onStatusChange: (itemId: string, status: ReviewStatus) => void;
  onSaveEdits: (
    itemId: string,
    edits: { title: string; category: string; description: string; link: string }
  ) => void;
  onResetEdits: (itemId: string) => void;
  onSaveComment: (itemId: string, comment: string) => void;
  onExitFocus: () => void;
}

export function FocusMode({
  items,
  saveStates,
  onStatusChange,
  onSaveEdits,
  onResetEdits,
  onSaveComment,
  onExitFocus,
}: FocusModeProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at first unreviewed item
    const firstUnreviewed = items.findIndex((i) => i.status === 'unreviewed');
    return firstUnreviewed >= 0 ? firstUnreviewed : 0;
  });
  const [editing, setEditing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const item = items[currentIndex];
  const total = items.length;
  const reviewed = items.filter((i) => i.status !== 'unreviewed').length;
  const saveState = item ? (saveStates[item.id] ?? 'idle') : 'idle';

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev') => {
      if (index < 0 || index >= items.length || transitioning) return;
      setDirection(dir);
      setTransitioning(true);
      setEditing(false);
      setCommenting(false);
      setTimeout(() => {
        setCurrentIndex(index);
        setTransitioning(false);
      }, 200);
    },
    [items.length, transitioning]
  );

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      goTo(currentIndex + 1, 'next');
    }
  }, [currentIndex, items.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1, 'prev');
    }
  }, [currentIndex, goTo]);

  const handleStatus = useCallback(
    (status: ReviewStatus) => {
      if (!item || transitioning) return;
      onStatusChange(item.id, status);
      // Auto-advance after setting status
      if (currentIndex < items.length - 1) {
        goTo(currentIndex + 1, 'next');
      }
    },
    [item, currentIndex, items.length, goTo, onStatusChange, transitioning]
  );

  const handleSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle keys when editing or commenting
      if (editing || commenting) return;
      // Don't handle if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          handleStatus('use');
          break;
        case '2':
          e.preventDefault();
          handleStatus('like');
          break;
        case '3':
          e.preventDefault();
          handleStatus('remove');
          break;
        case ' ':
          e.preventDefault();
          handleSkip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'c':
          e.preventDefault();
          setCommenting((prev) => !prev);
          break;
        case 'e':
          e.preventDefault();
          setEditing((prev) => !prev);
          break;
        case 'Escape':
          e.preventDefault();
          if (commenting) {
            setCommenting(false);
          } else if (editing) {
            setEditing(false);
          } else {
            onExitFocus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, commenting, handleStatus, handleSkip, goPrev, goNext, onExitFocus]);

  if (!item) {
    return (
      <div className="focus-backdrop">
        <div className="focus-empty">No items to review.</div>
      </div>
    );
  }

  const hasImage = !!item.media;
  const pct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const reviewedPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const handleSaveEdits = (edits: {
    title: string;
    category: string;
    description: string;
    link: string;
  }) => {
    onSaveEdits(item.id, edits);
    setEditing(false);
  };

  const handleResetEdits = () => {
    onResetEdits(item.id);
    setEditing(false);
  };

  return (
    <div className="focus-backdrop" ref={containerRef}>
      {/* Top bar */}
      <div className="focus-topbar">
        <button
          type="button"
          className="focus-exit-btn"
          onClick={onExitFocus}
          title="Back to list (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
          </svg>
        </button>

        <div className="focus-position">
          <span className="focus-position-current">{currentIndex + 1}</span>
          <span className="focus-position-sep">/</span>
          <span className="focus-position-total">{total}</span>
        </div>

        <div className="focus-reviewed-count">
          <strong>{reviewed}</strong> reviewed
        </div>
      </div>

      {/* Progress rail */}
      <div className="focus-progress-rail">
        <div className="focus-progress-fill" style={{ width: `${pct}%` }} />
        <div className="focus-progress-reviewed" style={{ width: `${reviewedPct}%` }} />
      </div>

      {/* Main content area */}
      <div className="focus-stage">
        {/* Nav: Previous */}
        <button
          type="button"
          className="focus-nav-btn focus-nav-btn--prev"
          onClick={goPrev}
          disabled={currentIndex === 0}
          title="Previous (Left arrow)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Content */}
        <div
          className={`focus-content ${transitioning ? `focus-content--exit-${direction}` : 'focus-content--enter'}`}
        >
          {/* Image items: just show the image — it IS the content */}
          {hasImage && (
            <div className="focus-media">
              <img
                src={import.meta.env.BASE_URL + item.media}
                alt={item.title}
              />
            </div>
          )}

          {/* Text-only items: show title + description */}
          {!hasImage && (
            <>
              <h2 className="focus-title">
                {item.title}
                {item.isEdited && <span className="focus-edited-dot" />}
              </h2>
              {item.description && (
                <p className="focus-description">{item.description}</p>
              )}
            </>
          )}

          {/* Current status indicator */}
          {item.status !== 'unreviewed' && (
            <div className={`focus-current-status focus-current-status--${item.status}`}>
              {item.status}
            </div>
          )}

          {/* Existing comment preview */}
          {item.comment && !commenting && (
            <div className="focus-comment-preview" onClick={() => setCommenting(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {item.comment}
            </div>
          )}

          {/* Comment box */}
          {commenting && (
            <div className="focus-edit-wrap">
              <CommentBox
                comment={item.comment}
                onSave={(c) => { onSaveComment(item.id, c); if (!c) setCommenting(false); }}
                saving={saveState === 'saving'}
              />
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="focus-edit-wrap">
              <EditForm
                item={item}
                onSave={handleSaveEdits}
                onCancel={() => setEditing(false)}
                onReset={handleResetEdits}
                saving={saveState === 'saving'}
              />
            </div>
          )}
        </div>

        {/* Nav: Next */}
        <button
          type="button"
          className="focus-nav-btn focus-nav-btn--next"
          onClick={goNext}
          disabled={currentIndex === items.length - 1}
          title="Next (Right arrow)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Action bar */}
      <div className="focus-actions">
        <div className="focus-actions-left">
          <button
            type="button"
            className={`focus-comment-btn${item.comment ? ' focus-comment-btn--active' : ''}`}
            onClick={() => setCommenting((prev) => !prev)}
            title="Comment (C)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="focus-edit-btn"
            onClick={() => setEditing((prev) => !prev)}
            title="Edit (E)"
          >
            &#9998;
          </button>
          <SaveIndicator state={saveState} />
        </div>

        <div className="focus-actions-center">
          <button
            type="button"
            className="focus-action-btn focus-action-btn--use"
            onClick={() => handleStatus('use')}
            disabled={transitioning}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Use
            <kbd>1</kbd>
          </button>
          <button
            type="button"
            className="focus-action-btn focus-action-btn--like"
            onClick={() => handleStatus('like')}
            disabled={transitioning}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            Like
            <kbd>2</kbd>
          </button>
          <button
            type="button"
            className="focus-action-btn focus-action-btn--remove"
            onClick={() => handleStatus('remove')}
            disabled={transitioning}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Remove
            <kbd>3</kbd>
          </button>
          <button
            type="button"
            className="focus-action-btn focus-action-btn--skip"
            onClick={handleSkip}
            disabled={transitioning || currentIndex === items.length - 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
            Skip
            <kbd>&#9251;</kbd>
          </button>
        </div>

        <div className="focus-actions-right">
          <span className="focus-hint">Keys: 1 2 3 Space &larr; &rarr;</span>
        </div>
      </div>
    </div>
  );
}
