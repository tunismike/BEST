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

  return (
    <article className={`content-card content-card--${item.status}`}>
      {item.media && (
        <div className="card-media">
          <img src={import.meta.env.BASE_URL + item.media} alt={item.title} />
        </div>
      )}

      <div className="card-body">
        <div className="card-header">
          <h3 className="card-title">{item.title}</h3>
          <div className="card-meta">
            {item.category && <span className="card-category">{item.category}</span>}
            {item.isEdited && <span className="card-edited-badge">Edited</span>}
          </div>
        </div>

        {item.description && <p className="card-description">{item.description}</p>}

        {item.link && (
          <a className="card-link" href={item.link} target="_blank" rel="noopener noreferrer">
            {item.link}
          </a>
        )}

        <StatusControl
          status={item.status}
          onChange={onStatusChange}
          disabled={saveState === 'saving'}
        />

        {!editing && (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setEditing(true)}
          >
            Edit Content
          </button>
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

        <div className="card-footer">
          <SaveIndicator state={saveState} />
          {item.statusUpdatedAt && (
            <span className="card-timestamp">
              Last updated: {new Date(item.statusUpdatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
