import { useState, useRef, useEffect } from 'react';

interface CommentBoxProps {
  comment: string;
  onSave: (comment: string) => void;
  saving?: boolean;
}

export function CommentBox({ comment, onSave, saving }: CommentBoxProps) {
  const [draft, setDraft] = useState(comment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDirty = draft !== comment;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    onSave(draft.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="comment-box">
      <textarea
        ref={textareaRef}
        className="comment-textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note..."
        rows={2}
        disabled={saving}
      />
      {isDirty && (
        <div className="comment-actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </button>
          <span className="comment-hint">&#8984;&#9166;</span>
        </div>
      )}
    </div>
  );
}
