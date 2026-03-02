import { useState } from 'react';
import type { EffectiveItem, ReviewStatus, SaveState } from '../types';
import { StatusControl } from './StatusControl';
import { SaveIndicator } from './SaveIndicator';
import { CommentBox } from './CommentBox';
import { AutoResizeIframe } from './AutoResizeIframe';

interface ContentCardProps {
  item: EffectiveItem;
  saveState: SaveState;
  onStatusChange: (status: ReviewStatus) => void;
  onSaveComment: (comment: string) => void;
}

export function ContentCard({
  item,
  saveState,
  onStatusChange,
  onSaveComment,
}: ContentCardProps) {
  const [commenting, setCommenting] = useState(false);

  const handleSaveComment = (comment: string) => {
    onSaveComment(comment);
    setCommenting(false);
  };

  const hasImage = !!item.media;
  const hasComments = item.allComments.length > 0;

  const formatNames = (status: ReviewStatus) => {
    return item.allVotes
      ? item.allVotes.filter(v => v.status === status).map(v => v.reviewerName.split('@')[0]).join(', ')
      : '';
  };

  return (
    <article className={`content-card content-card--${item.status}`}>
      <div className="card-body">
        {/* Text-only cards: show title + description */}
        {!hasImage && (
          <>
            {item.description && (
              <p className="card-description">{item.description}</p>
            )}
          </>
        )}
        {/* Image cards: the image IS the content — no title/description needed */}
        {hasImage && !item.htmlFile && (
          <div className="card-media">
            <img src={import.meta.env.BASE_URL + item.media} alt={item.title} />
          </div>
        )}

        {/* HTML cards: an isolated design mockup rendered perfectly */}
        {item.htmlFile && (
          <AutoResizeIframe
            src={import.meta.env.BASE_URL + item.htmlFile}
            title={item.title}
          />
        )}

        <div className="card-metrics">
          {item.voteCounts.use > 0 && <span className="metric metric--use" title={formatNames('use')}>Use: {item.voteCounts.use} ({formatNames('use')})</span>}
          {item.voteCounts.like > 0 && <span className="metric metric--like" title={formatNames('like')}>Like: {item.voteCounts.like} ({formatNames('like')})</span>}
          {item.voteCounts.remove > 0 && <span className="metric metric--remove" title={formatNames('remove')}>Remove: {item.voteCounts.remove} ({formatNames('remove')})</span>}
        </div>

        {/* Show all comments inline */}
        {hasComments && !commenting && (
          <div className="card-comments-list" onClick={() => setCommenting(true)}>
            {item.allComments.map((c, i) => (
              <div key={i} className="comment-item">
                <strong>{c.reviewerName}:</strong> {c.text}
              </div>
            ))}
          </div>
        )}

        <div className="card-actions">
          <StatusControl
            status={item.status}
            onChange={onStatusChange}
            disabled={saveState === 'saving'}
          />
          <div className="card-actions-right">
            <SaveIndicator state={saveState} />
            <button
              type="button"
              className={`comment-toggle-btn${item.comment ? ' comment-toggle-btn--active' : ''}`}
              onClick={() => setCommenting((prev) => !prev)}
              title="Comment"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {commenting && (
          <CommentBox
            comment={item.comment}
            onSave={handleSaveComment}
            saving={saveState === 'saving'}
          />
        )}
      </div>
    </article>
  );
}
