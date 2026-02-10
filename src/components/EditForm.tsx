import { useState } from 'react';
import type { EffectiveItem } from '../types';

interface EditFormProps {
  item: EffectiveItem;
  onSave: (edits: { title: string; category: string; description: string; link: string }) => void;
  onCancel: () => void;
  onReset?: () => void;
  saving?: boolean;
}

export function EditForm({ item, onSave, onCancel, onReset, saving }: EditFormProps) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [link, setLink] = useState(item.link ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, category, description, link });
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <label className="edit-field">
        <span className="edit-label">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
        />
      </label>

      <label className="edit-field">
        <span className="edit-label">Category</span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={saving}
        />
      </label>

      <label className="edit-field">
        <span className="edit-label">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={saving}
        />
      </label>

      <label className="edit-field">
        <span className="edit-label">Link</span>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={saving}
          placeholder="https://..."
        />
      </label>

      <div className="edit-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          Save Changes
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        {item.isEdited && onReset && (
          <button type="button" className="btn btn--danger" onClick={onReset} disabled={saving}>
            Reset to Original
          </button>
        )}
      </div>
    </form>
  );
}
