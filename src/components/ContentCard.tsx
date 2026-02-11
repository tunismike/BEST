import { useState } from 'react';
import type { EffectiveItem, ReviewStatus, SaveState } from '../types';
import { StatusControl } from './StatusControl';
import { EditForm } from './EditForm';
import { SaveIndicator } from './SaveIndicator';
import { CommentBox } from './CommentBox';

interface ContentCardProps {
  item: EffectiveItem;
  saveState: SaveState;
  onStatusChange: (status: ReviewStatus) => void;
  onSaveEdits: (edits: {
    title: string;
    category: string;
    description: string;
    link: string;
  }) => void;
  onResetEdits: () => void;
  onSaveComment: (comment: string) => void;
}

export function ContentCard({
  item,
  saveState,
  onStatusChange,
  onSaveEdits,
  onResetEdits,
  onSaveComment,
}: ContentCardProps) {
  const [editing, setEditing] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const handleSave = (edits: {
    title: string;
    category: string;
    description: string;
    link: string;
  }) => {
    onSaveEdits(edits);
    setEditing(false);
  };

  const handleReset = () => {
    onResetEdits();
    setEditing(false);
  };

  const handleSaveComment = (comment: string) => {
    onSaveComment(comment);
    if (!comment) setCommenting(false);
  };

  const hasImage = !!item.media;
  const hasComment = !!item.comment;

  return (
    <article className={`content-card content-card--${item.status}`}>
      {hasImage && (
        <div className="card-media">
          <img src={import.meta.env.BASE_URL + item.media} alt={item.title} />
        </div>
      )}

      <div className="card-body">
        {/* Text-only cards: show title + description */}
        {!hasImage && (
          <>
            {item.isEdited && <span className="card-edited-dot" title="Edited" />}
            {item.description && (
              <p className="card-description">{item.description}</p>
            )}
          </>
        )}
        {/* Image cards: the image IS the content — no title/description needed */}
        {hasImage && item.isEdited && (
          <span className="card-edited-dot" title="Edited" />
        )}

        {/* Show existing comment inline */}
        {hasComment && !commenting && (
          <div className="card-comment-preview" onClick={() => setCommenting(true)}>
            {item.comment}
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
              className={`comment-toggle-btn${hasComment ? ' comment-toggle-btn--active' : ''}`}
              onClick={() => setCommenting((prev) => !prev)}
              title="Comment"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            {!editing && (
              <button
                type="button"
                className="edit-toggle-btn"
                onClick={() => setEditing(true)}
                title="Edit content"
              >
                &#9998;
              </button>
            )}
          </div>
        </div>

        {commenting && (
          <CommentBox
            comment={item.comment}
            onSave={handleSaveComment}
            saving={saveState === 'saving'}
          />
        )}

        {editing && (
          <EditForm
            item={item}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            onReset={handleReset}
            saving={saveState === 'saving'}
          />
        )}
      </div>
    </article>
  );
}
