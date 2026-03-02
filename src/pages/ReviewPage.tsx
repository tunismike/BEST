import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContentReview } from '../hooks/useContentReview';
import { ContentCard } from '../components/ContentCard';
import { FilterBar } from '../components/FilterBar';
import type { ContentTypeFilter } from '../components/FilterBar';
import { ProgressSummary } from '../components/ProgressSummary';
import { FocusMode } from '../components/FocusMode';
import type { ReviewStatus } from '../types';

type ViewMode = 'list' | 'focus';

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('best-view-mode');
    if (stored === 'focus' || stored === 'list') return stored;
  } catch { /* ignore */ }
  return 'list';
}

interface ReviewPageProps {
  reviewerName: string;
  onLogout: () => void;
}

export function ReviewPage({ reviewerName, onLogout }: ReviewPageProps) {
  const { reviewId } = useParams<{ reviewId: string }>();
  const {
    items,
    isLoading,
    loadError,
    saveStates,
    setStatus,
    saveEdits,
    resetEdits,
    saveComment,
    categories,
  } = useContentReview(reviewId ?? '', reviewerName);

  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try { localStorage.setItem('best-view-mode', viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  const hasActiveFilters = statusFilter !== 'all' || contentTypeFilter !== 'all' || categoryFilter !== '' || searchQuery !== '';

  const LOGO_IDS = ['new-design-best-logo-redesign', 'legacy-layer-8'];

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (contentTypeFilter === 'images' && !item.media) return false;
      if (contentTypeFilter === 'text' && item.media) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });

    // Reorder logos: in "All" view, place them together after the last
    // site mockup component; in a specific category, place them at the top.
    const logos = filtered.filter((i) => LOGO_IDS.includes(i.id));
    if (logos.length === 0) return filtered;

    const rest = filtered.filter((i) => !LOGO_IDS.includes(i.id));
    if (!categoryFilter) {
      // "All" — insert after last component-* item
      const lastComponentIdx = rest.reduce(
        (acc, item, idx) => (item.id.startsWith('component-') ? idx : acc),
        -1
      );
      rest.splice(lastComponentIdx + 1, 0, ...logos);
      return rest;
    }
    // Specific category — logos at top
    return [...logos, ...rest];
  }, [items, statusFilter, contentTypeFilter, categoryFilter, searchQuery]);

  const clearFilters = () => {
    setStatusFilter('all');
    setContentTypeFilter('all');
    setCategoryFilter('');
    setSearchQuery('');
  };

  if (!reviewId) {
    return (
      <div className="page-container">
        <div className="error-state">No review ID provided.</div>
      </div>
    );
  }

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
        <div className="error-state">{loadError}</div>
      </div>
    );
  }

  // Focus mode: takes over the entire viewport
  if (viewMode === 'focus') {
    return (
      <FocusMode
        items={filteredItems.length > 0 ? filteredItems : items}
        saveStates={saveStates}
        onStatusChange={(itemId, status) => setStatus(itemId, status)}
        onSaveEdits={(itemId, edits) => saveEdits(itemId, edits)}
        onResetEdits={(itemId) => resetEdits(itemId)}
        onSaveComment={(itemId, comment) => saveComment(itemId, comment)}
        onExitFocus={() => setViewMode('list')}
      />
    );
  }

  // List mode (existing)
  return (
    <div className="page-container">
      <div className="controls-bar">
        <div className="controls-bar-row">
          <ProgressSummary items={items} />
          <button
            type="button"
            className="view-toggle-btn"
            onClick={() => setViewMode('focus')}
            title="Focus mode — review one at a time"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="3" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            Focus
          </button>
        </div>
        <div className="controls-bar-user">
          <span className="controls-bar-user-label">
            Reviewing as: <strong>{reviewerName}</strong>
          </span>
          <button
            type="button"
            className="btn btn--sm"
            onClick={onLogout}
            title="Switch User Log In Identity"
          >
            Switch User
          </button>
        </div>
      </div>

      <div className="controls-bar" style={{ marginTop: '1rem' }}>
        <FilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          contentTypeFilter={contentTypeFilter}
          onContentTypeFilterChange={setContentTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">No matches.</div>
      )}

      <div className="card-list">
        {filteredItems.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            saveState={saveStates[item.id] ?? 'idle'}
            onStatusChange={(status) => setStatus(item.id, status)}
            onSaveComment={(comment) => saveComment(item.id, comment)}
          />
        ))}
      </div>
    </div>
  );
}
