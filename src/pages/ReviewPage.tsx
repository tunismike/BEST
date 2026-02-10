import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContentReview } from '../hooks/useContentReview';
import { ContentCard } from '../components/ContentCard';
import { FilterBar } from '../components/FilterBar';
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

export function ReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const {
    items,
    isLoading,
    loadError,
    saveStates,
    setStatus,
    saveEdits,
    resetEdits,
    categories,
  } = useContentReview(reviewId ?? '');

  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try { localStorage.setItem('best-view-mode', viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== '' || searchQuery !== '';

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, searchQuery]);

  const clearFilters = () => {
    setStatusFilter('all');
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

        <FilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
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
            onSaveEdits={(edits) => saveEdits(item.id, edits)}
            onResetEdits={() => resetEdits(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
