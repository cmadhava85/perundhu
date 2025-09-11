import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus } from '../../types';
import './BusResultsList.css';

interface BusResultsListProps {
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  onBusSelect: (bus: Bus) => void;
  selectedBus: Bus | null;
}

export const BusResultsList: React.FC<BusResultsListProps> = ({
  buses,
  isLoading,
  error,
  onBusSelect,
  selectedBus
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="compact-results-container">
        <div className="compact-loading">
          <div className="loading-spinner-sm"></div>
          <span className="loading-text">{t('busTracker.searching', 'Searching...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compact-results-container">
        <div className="compact-error">
          <p className="error-title">{t('busTracker.error', 'Error')}</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="compact-results-container">
        <div className="compact-empty">
          <div className="empty-icon">🚌</div>
          <p className="empty-message">{t('busTracker.noBuses', 'No buses found for this route')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compact-results-container">
      <div className="compact-header">
        <h3 className="results-title">
          {t('busTracker.results', 'Available Buses')} 
          <span className="bus-count">({buses.length})</span>
        </h3>
      </div>
      
      <div className="compact-bus-list">
        {buses.map((bus) => (
          <div
            key={bus.id}
            onClick={() => onBusSelect(bus)}
            className={`compact-bus-card ${
              selectedBus?.id === bus.id ? 'selected' : ''
            }`}
          >
            <div className="bus-card-content">
              <div className="bus-main-info">
                <div className="bus-header-compact">
                  <h4 className="bus-name-compact">
                    {bus.name || `Bus ${bus.id}`}
                  </h4>
                  <div className={`bus-status-compact ${
                    bus.status === 'active' ? 'active' : 'inactive'
                  }`}>
                    <div className="status-dot"></div>
                    <span className="status-text">
                      {bus.status === 'active' 
                        ? t('busTracker.active', 'Active')
                        : t('busTracker.inactive', 'Inactive')
                      }
                    </span>
                  </div>
                </div>
                
                <div className="bus-details-compact">
                  <div className="route-info-compact">
                    <span className="route-label">Route:</span>
                    <span className="route-value">{bus.routeName}</span>
                  </div>
                  
                  {bus.estimatedArrival && (
                    <div className="eta-info-compact">
                      <span className="eta-label">ETA:</span>
                      <span className="eta-value">{bus.estimatedArrival}</span>
                    </div>
                  )}
                  
                  {bus.capacity && (
                    <div className="capacity-info-compact">
                      <span className="capacity-label">Cap:</span>
                      <span className="capacity-value">{bus.capacity}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bus-select-indicator">
                <div className="select-arrow">→</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};