import React from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/RouteSearch.css';

interface RouteSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

/**
 * Component for searching routes
 */
const RouteSearch: React.FC<RouteSearchProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching
}) => {
  const { t } = useTranslation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="route-search">
      <h2 className="search-title">{t('routes.search.title', 'Find Your Route')}</h2>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('routes.search.placeholder', 'Enter source and destination (e.g. "Chennai to Bangalore")')}
            className="search-input"
            disabled={isSearching}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <span className="loading-spinner"></span>
            ) : (
              t('common.search', 'Search')
            )}
          </button>
        </div>
        
        <div className="search-tips">
          {t('routes.search.tips', 'Tip: You can also search for specific bus numbers or landmarks')}
        </div>
      </form>
    </div>
  );
};

export default RouteSearch;