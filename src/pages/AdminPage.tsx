import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useContentReview } from '../hooks/useContentReview';
import { exportToJson, exportToCsv, downloadFile } from '../utils/export';
import { LoginPrompt } from '../components/LoginPrompt';

export function AdminPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key');
  const [reviewerName, setReviewerName] = useState<string | null>(null);

  const expectedKey = import.meta.env.VITE_ADMIN_KEY as string;

  useEffect(() => {
    const stored = localStorage.getItem('best-reviewer-name');
    if (stored) {
      setReviewerName(stored);
    }
  }, []);

  if (!adminKey || adminKey !== expectedKey) {
    return (
      <div className="page-container">
        <div className="error-state">Access denied. Invalid admin key.</div>
      </div>
    );
  }

  const handleLogin = (name: string) => {
    localStorage.setItem('best-reviewer-name', name);
    setReviewerName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('best-reviewer-name');
    setReviewerName(null);
  };

  if (!reviewerName) {
    return <LoginPrompt onLogin={handleLogin} />;
  }

  return <AdminContent reviewId={reviewId ?? ''} reviewerName={reviewerName} onLogout={handleLogout} />;
}

function AdminContent({ reviewId, reviewerName, onLogout }: { reviewId: string; reviewerName: string; onLogout: () => void }) {
  const { items, isLoading, loadError, resetEdits, saveStates } = useContentReview(reviewId, reviewerName);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-container">
        <div className="error-state">Failed to load: {loadError}</div>
      </div>
    );
  }

  const handleExportJson = () => {
    const content = exportToJson(items);
    downloadFile(content, `review-${reviewId}.json`, 'application/json');
  };

  const handleExportCsv = () => {
    const content = exportToCsv(items);
    downloadFile(content, `review-${reviewId}.csv`, 'text/csv');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Admin: Review Results</h1>
        <p className="page-subtitle">Review ID: {reviewId}</p>
        <button type="button" className="btn btn--sm" style={{ marginTop: '0.5rem' }} onClick={onLogout}>
          Switch User
        </button>
      </header>

      <div className="admin-actions">
        <button type="button" className="btn btn--primary" onClick={handleExportJson}>
          Export JSON
        </button>
        <button type="button" className="btn btn--secondary" onClick={handleExportCsv}>
          Export CSV
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Description</th>
              <th>Link</th>
              <th>Status</th>
              <th>Edited</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`admin-row admin-row--${item.status}`}>
                <td className="admin-cell-id">{item.id}</td>
                <td>{item.title}</td>
                <td>{item.category ?? ''}</td>
                <td className="admin-cell-desc">
                  {item.description
                    ? item.description.length > 80
                      ? item.description.slice(0, 80) + '...'
                      : item.description
                    : ''}
                </td>
                <td>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  ) : (
                    ''
                  )}
                </td>
                <td>
                  <span className={`status-badge status-badge--${item.status}`}>{item.status}</span>
                </td>
                <td>{item.isEdited ? 'Yes' : ''}</td>
                <td className="admin-cell-date">
                  {item.statusUpdatedAt
                    ? new Date(item.statusUpdatedAt).toLocaleString()
                    : ''}
                </td>
                <td>
                  {item.isEdited && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => resetEdits(item.id)}
                      disabled={saveStates[item.id] === 'saving'}
                    >
                      Reset Edits
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
