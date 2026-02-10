import type { ReviewStatus } from '../types';

export type ContentTypeFilter = 'all' | 'images' | 'text';

interface FilterBarProps {
  statusFilter: ReviewStatus | 'all';
  onStatusFilterChange: (status: ReviewStatus | 'all') => void;
  contentTypeFilter: ContentTypeFilter;
  onContentTypeFilterChange: (type: ContentTypeFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  statusFilter,
  onStatusFilterChange,
  contentTypeFilter,
  onContentTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchChange,
  categories,
  onClear,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <select
        className="filter-select"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as ReviewStatus | 'all')}
      >
        <option value="all">All Statuses</option>
        <option value="unreviewed">Unreviewed</option>
        <option value="use">Use</option>
        <option value="like">Like</option>
        <option value="remove">Remove</option>
      </select>

      <select
        className="filter-select"
        value={contentTypeFilter}
        onChange={(e) => onContentTypeFilterChange(e.target.value as ContentTypeFilter)}
      >
        <option value="all">Images & Text</option>
        <option value="images">Images Only</option>
        <option value="text">Text Only</option>
      </select>

      <select
        className="filter-select"
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="filter-search"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {hasActiveFilters && (
        <button type="button" className="filter-clear-btn" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}
