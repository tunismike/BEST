import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useContentReview } from '../hooks/useContentReview';
import { ContentCard } from '../components/ContentCard';
import { FilterBar } from '../components/FilterBar';
import { ProgressSummary } from '../components/ProgressSummary';
import type { ReviewStatus } from '../types';

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

  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="page-container">
      <div className="controls-bar">
        <ProgressSummary items={items} />

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
