import React from 'react';
import { useTranslation } from 'react-i18next';
import './AdvancedSearchFilters.css';

interface AdvancedSearchFiltersProps {
  includeIntermediateStops: boolean;
  includeContinuingBuses: boolean;
  showOSMData: boolean;
  onToggleIntermediateStops: () => void;
  onToggleContinuingBuses: () => void;
  onToggleOSMData: () => void;
  className?: string;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  includeIntermediateStops,
  includeContinuingBuses,
  showOSMData,
  onToggleIntermediateStops,
  onToggleContinuingBuses,
  onToggleOSMData,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`advanced-search-filters ${className}`}>
      <h4 className="filters-title">
        {t('search.advancedFilters', 'Advanced Search Options')}
      </h4>
      
      <div className="filter-options">
        <div className="filter-option">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={includeIntermediateStops}
              onChange={onToggleIntermediateStops}
              className="filter-checkbox"
            />
            <span className="checkmark"></span>
            <div className="filter-content">
              <span className="filter-title">
                {t('search.includeIntermediateStops', 'Include buses with intermediate stops')}
              </span>
              <span className="filter-description">
                {t('search.intermediateStopsDesc', 'Show buses where your locations are stops on a longer route')}
              </span>
            </div>
          </label>
        </div>

        <div className="filter-option">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={includeContinuingBuses}
              onChange={onToggleContinuingBuses}
              className="filter-checkbox"
            />
            <span className="checkmark"></span>
            <div className="filter-content">
              <span className="filter-title">
                {t('search.includeContinuingBuses', 'Include buses continuing beyond destination')}
              </span>
              <span className="filter-description">
                {t('search.continuingBusesDesc', 'Show buses that continue to other cities after your destination')}
              </span>
            </div>
          </label>
        </div>

        <div className="filter-option">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={showOSMData}
              onChange={onToggleOSMData}
              className="filter-checkbox"
            />
            <span className="checkmark"></span>
            <div className="filter-content">
              <span className="filter-title">
                {t('search.showOSMData', 'Show additional route data')}
              </span>
              <span className="filter-description">
                {t('search.osmDataDesc', 'Include routes and stops from OpenStreetMap')}
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchFilters;