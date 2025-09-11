import React from 'react';
import { useTranslation } from 'react-i18next';

interface ViewModeControlsProps {
  viewMode: 'list' | 'map' | 'split';
  onViewModeChange: (mode: 'list' | 'map' | 'split') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

const ViewModeControls: React.FC<ViewModeControlsProps> = ({
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  sortBy,
  onSortChange
}) => {
  const { t } = useTranslation();

  const getViewModeIcon = (mode: typeof viewMode) => {
    switch (mode) {
      case 'list': return '📋';
      case 'map': return '🗺️';
      case 'split': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="view-controls-section">
      <div className="filter-toggle">
        <button 
          className={`filter-btn ${showFilters ? 'active' : ''}`}
          onClick={onToggleFilters}
        >
          <span className="filter-icon">⚙️</span>
          <span className="filter-text">{t('search.filters', 'Filters')}</span>
          {showFilters && <span className="active-indicator"></span>}
        </button>
      </div>

      <div className="sort-selector">
        <select 
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="premium-select"
        >
          <option value="departure-time">{t('search.sort.departureTime', 'Departure Time')}</option>
          <option value="price-low">{t('search.sort.priceLow', 'Price: Low to High')}</option>
          <option value="price-high">{t('search.sort.priceHigh', 'Price: High to Low')}</option>
          <option value="duration">{t('search.sort.duration', 'Duration')}</option>
          <option value="rating">{t('search.sort.rating', 'Highest Rated')}</option>
        </select>
      </div>

      <div className="view-mode-controls">
        {(['list', 'split', 'map'] as const).map((mode) => (
          <button
            key={mode}
            className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
            onClick={() => onViewModeChange(mode)}
            title={t(`search.viewMode.${mode}`, mode)}
          >
            <span className="view-icon">{getViewModeIcon(mode)}</span>
            <span className="view-label">{t(`search.viewMode.${mode}`, mode)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewModeControls;