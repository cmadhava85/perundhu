import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchFilters } from '../../types';

interface NoResultsStateProps {
  searchFilters: SearchFilters;
  onChangeFilters: (filters: SearchFilters) => void;
}

const NoResultsState: React.FC<NoResultsStateProps> = ({ searchFilters, onChangeFilters }) => {
  const { t } = useTranslation();

  return (
    <div className="premium-no-results">
      <div className="no-results-animation">
        <div className="empty-bus">🚌</div>
        <div className="sad-emoji">😔</div>
      </div>
      <div className="no-results-content">
        <h3 className="no-results-title">{t('search.noResults.title', 'No buses found')}</h3>
        <p className="no-results-subtitle">{t('search.noResults.description', 'We couldn\'t find any buses for your search criteria.')}</p>
        
        <div className="suggestions-grid">
          <div className="suggestion-card">
            <div className="suggestion-icon">📅</div>
            <h4>{t('search.noResults.tryDate', 'Try Different Dates')}</h4>
            <p>{t('search.noResults.tryDateDesc', 'More buses may be available on other days')}</p>
            <button className="suggestion-btn">
              {t('search.noResults.changeDates', 'Change Dates')}
            </button>
          </div>
          
          <div className="suggestion-card">
            <div className="suggestion-icon">🚌</div>
            <h4>{t('search.noResults.allTypes', 'Show All Bus Types')}</h4>
            <p>{t('search.noResults.allTypesDesc', 'Include all available bus categories')}</p>
            <button 
              className="suggestion-btn"
              onClick={() => onChangeFilters({ ...searchFilters, busType: 'all' })}
            >
              {t('search.noResults.showAll', 'Show All Types')}
            </button>
          </div>
          
          <div className="suggestion-card">
            <div className="suggestion-icon">🔍</div>
            <h4>{t('search.noResults.nearby', 'Nearby Locations')}</h4>
            <p>{t('search.noResults.nearbyDesc', 'Check buses from nearby cities')}</p>
            <button className="suggestion-btn">
              {t('search.noResults.findNearby', 'Find Nearby')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoResultsState;