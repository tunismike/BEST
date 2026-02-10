import { useState } from 'react';
import type { EffectiveItem, ReviewStatus, SaveState } from '../types';
import { StatusControl } from './StatusControl';
import { EditForm } from './EditForm';
import { SaveIndicator } from './SaveIndicator';

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
}

export function ContentCard({
  item,
  saveState,
  onStatusChange,
  onSaveEdits,
  onResetEdits,
}: ContentCardProps) {
  const [editing, setEditing] = useState(false);

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

  const hasImage = !!item.media;

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
            <div className="card-header">
              <span className="card-title">{item.title}</span>
              {item.isEdited && <span className="card-edited-dot" title="Edited" />}
            </div>
            {item.description && (
              <p className="card-description">{item.description}</p>
            )}
          </>
        )}
        {/* Image cards: the image IS the content — no title/description needed */}
        {hasImage && item.isEdited && (
          <span className="card-edited-dot" title="Edited" />
        )}

        <div className="card-actions">
          <StatusControl
            status={item.status}
            onChange={onStatusChange}
            disabled={saveState === 'saving'}
          />
          <div className="card-actions-right">
            <SaveIndicator state={saveState} />
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
