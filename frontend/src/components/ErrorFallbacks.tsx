import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/transit-design-system.css';

interface SearchErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

/**
 * Error fallback component specifically for search-related features.
 * Provides helpful messages and recovery options for search failures.
 */
const SearchErrorFallback: React.FC<SearchErrorFallbackProps> = React.memo(({ error, retry }) => {
  const { t } = useTranslation();

  const getErrorMessage = () => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return t('error.search.network', 'Unable to connect to the server. Please check your internet connection.');
    }
    if (message.includes('timeout')) {
      return t('error.search.timeout', 'The search took too long. Please try again with a simpler query.');
    }
    if (message.includes('not found') || message.includes('404')) {
      return t('error.search.notFound', 'No routes found for your search criteria.');
    }
    return t('error.search.generic', 'An error occurred while searching. Please try again.');
  };

  return (
    <div className="transit-card error-fallback-container" role="alert" aria-live="polite">
      <div className="error-fallback-content">
        <div className="error-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        
        <h3 className="error-title">
          {t('error.search.title', 'Search Error')}
        </h3>
        
        <p className="error-message">
          {getErrorMessage()}
        </p>
        
        {import.meta.env.MODE === 'development' && error && (
          <details className="error-details">
            <summary>{t('error.details', 'Technical Details')}</summary>
            <pre className="error-stack">{error.message}</pre>
          </details>
        )}
        
        <div className="error-actions">
          {retry && (
            <button 
              onClick={retry}
              className="transit-button primary"
              aria-label={t('error.retry', 'Retry search')}
            >
              <span className="button-icon">🔄</span>
              {t('error.retryButton', 'Try Again')}
            </button>
          )}
          
          <a 
            href="/"
            className="transit-button secondary"
            aria-label={t('error.goHome', 'Go to home page')}
          >
            <span className="button-icon">🏠</span>
            {t('error.homeButton', 'Go Home')}
          </a>
        </div>
      </div>
    </div>
  );
});

SearchErrorFallback.displayName = 'SearchErrorFallback';

interface MapErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

/**
 * Error fallback component specifically for map-related features.
 * Provides helpful messages when maps fail to load.
 */
const MapErrorFallback: React.FC<MapErrorFallbackProps> = React.memo(({ error, retry }) => {
  const { t } = useTranslation();

  return (
    <div className="transit-card error-fallback-container map-error" role="alert">
      <div className="error-fallback-content">
        <div className="error-icon map-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
            <path d="M8 2v16M16 6v16" />
          </svg>
        </div>
        
        <h3 className="error-title">
          {t('error.map.title', 'Map Loading Error')}
        </h3>
        
        <p className="error-message">
          {t('error.map.message', 'Unable to load the map. You can still view route information in list format.')}
        </p>
        
        {import.meta.env.MODE === 'development' && error && (
          <details className="error-details">
            <summary>{t('error.details', 'Technical Details')}</summary>
            <pre className="error-stack">{error.message}</pre>
          </details>
        )}
        
        <div className="error-actions">
          {retry && (
            <button 
              onClick={retry}
              className="transit-button primary"
            >
              <span className="button-icon">🔄</span>
              {t('error.retryButton', 'Reload Map')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MapErrorFallback.displayName = 'MapErrorFallback';

interface ContributionErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

/**
 * Error fallback for contribution features.
 * Preserves user data hints and provides recovery options.
 */
const ContributionErrorFallback: React.FC<ContributionErrorFallbackProps> = React.memo(({ error, retry }) => {
  const { t } = useTranslation();

  return (
    <div className="transit-card error-fallback-container contribution-error" role="alert">
      <div className="error-fallback-content">
        <div className="error-icon contribution-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        
        <h3 className="error-title">
          {t('error.contribution.title', 'Contribution Error')}
        </h3>
        
        <p className="error-message">
          {t('error.contribution.message', 'There was a problem processing your contribution. Your data may have been saved locally.')}
        </p>
        
        <p className="error-hint">
          {t('error.contribution.hint', 'Tip: Check your browser\'s local storage or try refreshing the page.')}
        </p>
        
        {import.meta.env.MODE === 'development' && error && (
          <details className="error-details">
            <summary>{t('error.details', 'Technical Details')}</summary>
            <pre className="error-stack">{error.message}</pre>
          </details>
        )}
        
        <div className="error-actions">
          {retry && (
            <button 
              onClick={retry}
              className="transit-button primary"
            >
              <span className="button-icon">🔄</span>
              {t('error.retryButton', 'Try Again')}
            </button>
          )}
          
          <a 
            href="/contribute"
            className="transit-button secondary"
          >
            <span className="button-icon">📝</span>
            {t('error.startOver', 'Start New Contribution')}
          </a>
        </div>
      </div>
    </div>
  );
});

ContributionErrorFallback.displayName = 'ContributionErrorFallback';

export { SearchErrorFallback, MapErrorFallback, ContributionErrorFallback };
