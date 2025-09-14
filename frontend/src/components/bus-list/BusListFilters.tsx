import React from 'react';
import { useTranslation } from 'react-i18next';

interface BusListFiltersProps {
  sortBy: 'time' | 'duration' | 'price';
  filterBy: 'all' | 'ac' | 'non-ac';
  onSortChange: (sort: 'time' | 'duration' | 'price') => void;
  onFilterChange: (filter: 'all' | 'ac' | 'non-ac') => void;
}

const BusListFilters: React.FC<BusListFiltersProps> = ({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('busList.sortBy', 'Sort by')}:
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="form-control text-sm py-1 px-2 w-auto"
            >
              <option value="time">{t('busList.sortTime', 'Departure Time')}</option>
              <option value="duration">{t('busList.sortDuration', 'Duration')}</option>
              <option value="price">{t('busList.sortPrice', 'Price')}</option>
            </select>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('busList.filter', 'Filter')}:
            </label>
            <div className="flex gap-1">
              {(['all', 'ac', 'non-ac'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => onFilterChange(filter)}
                  className={`
                    px-3 py-1 text-sm rounded-full transition-colors
                    ${filterBy === filter
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {filter === 'all' && t('busList.all', 'All')}
                  {filter === 'ac' && t('busList.ac', 'AC')}
                  {filter === 'non-ac' && t('busList.nonAc', 'Non-AC')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusListFilters;