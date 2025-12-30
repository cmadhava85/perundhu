import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/bus-card.css';

interface BusListFiltersProps {
  sortBy: 'fastest' | 'cheapest' | 'earliest' | 'latest';
  filterBy: 'all' | 'government' | 'private';
  onSortChange: (sort: 'fastest' | 'cheapest' | 'earliest' | 'latest') => void;
  onFilterChange: (filter: 'all' | 'government' | 'private') => void;
}

const BusListFilters: React.FC<BusListFiltersProps> = ({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <span className="filter-label">{t('busList.sortBy', 'Sort by')}:</span>
        <button
          className={`filter-chip ${sortBy === 'fastest' ? 'active' : ''}`}
          onClick={() => onSortChange('fastest')}
        >
          ⚡ {t('busList.fastest', 'Fastest')}
        </button>
        <button
          className={`filter-chip ${sortBy === 'cheapest' ? 'active' : ''}`}
          onClick={() => onSortChange('cheapest')}
        >
          💰 {t('busList.cheapest', 'Cheapest')}
        </button>
        <button
          className={`filter-chip ${sortBy === 'earliest' ? 'active' : ''}`}
          onClick={() => onSortChange('earliest')}
        >
          🌅 {t('busList.earliest', 'Earliest')}
        </button>
        <button
          className={`filter-chip ${sortBy === 'latest' ? 'active' : ''}`}
          onClick={() => onSortChange('latest')}
        >
          🌙 {t('busList.latest', 'Latest')}
        </button>
      </div>
      <div className="filter-row">
        <span className="filter-label">{t('busList.operator', 'Operator')}:</span>
        <button
          className={`filter-chip ${filterBy === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          🚌 {t('busList.all', 'All')}
        </button>
        <button
          className={`filter-chip ${filterBy === 'government' ? 'active' : ''}`}
          onClick={() => onFilterChange('government')}
        >
          🏛️ {t('busList.government', 'Government')}
        </button>
        <button
          className={`filter-chip ${filterBy === 'private' ? 'active' : ''}`}
          onClick={() => onFilterChange('private')}
        >
          🏢 {t('busList.private', 'Private')}
        </button>
      </div>
    </div>
  );
};

export default BusListFilters;