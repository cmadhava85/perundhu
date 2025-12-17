import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConnectingRoute } from '../types';
import '../styles/ConnectingRoutes.css';

interface ConnectingRoutesProps {
  connectingRoutes: ConnectingRoute[];
}

// Helper function to format duration
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Helper to calculate wait time between legs
const calculateWaitTime = (leg1ArrivalTime: string, leg2DepartureTime: string): number => {
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const arrival = parseTime(leg1ArrivalTime);
  const departure = parseTime(leg2DepartureTime);
  return departure >= arrival ? departure - arrival : (24 * 60 - arrival) + departure;
};

const ConnectingRoutes: React.FC<ConnectingRoutesProps> = ({ connectingRoutes }) => {
  const { t } = useTranslation();
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  
  // If no routes, don't render component
  if (!connectingRoutes || connectingRoutes.length === 0) {
    return null;
  }
  
  const toggleRoute = (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  };

  // Find the fastest route (shortest duration)
  const fastestRoute = connectingRoutes.reduce((fastest, route) => {
    return route.totalDuration < fastest.totalDuration ? route : fastest;
  }, connectingRoutes[0]);
  
  return (
    <div className="connecting-routes" data-testid="connecting-routes">
      <div className="connecting-routes-header">
        <h2 className="connecting-routes-title">🔄 {t('connectingRoutes.title', 'Connecting Routes')}</h2>
        <p className="connecting-routes-subtitle">
          {t('connectingRoutes.subtitle', 'Routes with transfers')} • {t('connectingRoutes.sortedBy', 'Sorted by fastest route first')}
        </p>
      </div>
      
      {connectingRoutes.map((route) => {
        const isFastest = route.id === fastestRoute.id;
        const legs = route.legs;
        const firstLeg = legs[0];
        const lastLeg = legs.at(-1)!;
        
        // Calculate wait times between legs
        const waitTimes: number[] = [];
        for (let i = 0; i < legs.length - 1; i++) {
          const waitTime = calculateWaitTime(legs[i].arrivalTime, legs[i + 1].departureTime);
          waitTimes.push(waitTime);
        }
        const totalWaitTime = waitTimes.reduce((sum, wt) => sum + wt, 0);
        
        return (
        <div 
          key={route.id} 
          className={`connecting-route-card ${expandedRouteId === route.id ? 'expanded' : ''} ${isFastest ? 'fastest-route' : ''}`}
          onClick={() => toggleRoute(route.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleRoute(route.id); }}
          role="button"
          tabIndex={0}
        >
          {/* Fastest Route Badge */}
          {isFastest && (
            <div className="fastest-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">{t('connectingRoutes.fastestRoute', 'Fastest Route')}</span>
            </div>
          )}

          <div className="route-summary">
            <div className="route-main-info">
              <h3>
                <span className="from">{firstLeg.fromStop.name}</span> 
                {legs.length > 1 && legs.slice(0, -1).map((leg) => (
                  <React.Fragment key={`leg-${leg.busId}-${leg.fromStopId}`}>
                    <span className="connector"> → </span>
                    <span className="connection-point">{leg.toStop.name}</span>
                  </React.Fragment>
                ))}
                <span className="connector"> → </span>
                <span className="to">{lastLeg.toStop.name}</span>
              </h3>
              <div className="route-metrics">
                <div className="metric-item primary">
                  <span className="metric-icon">⏱️</span>
                  <span className="metric-label">{t('connectingRoutes.total', 'Total')}:</span>
                  <strong className="metric-value">{formatDuration(route.totalDuration)}</strong>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">🔄</span>
                  <span className="metric-label">{t('connectingRoutes.transfers', 'Transfers')}:</span>
                  <span className="metric-value">{route.transfers}</span>
                </div>
                {totalWaitTime > 0 && (
                  <div className="metric-item">
                    <span className="metric-icon">⏸️</span>
                    <span className="metric-label">{t('connectingRoutes.waitTotal', 'Wait')}:</span>
                    <span className="metric-value">{formatDuration(totalWaitTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {expandedRouteId === route.id && (
            <div className="route-details">
              <div className="buses-container">
                {legs.map((leg, idx) => (
                  <React.Fragment key={leg.busId}>
                    <div className="bus-card">
                      <h4>Bus {idx + 1}: 🚌 {leg.busName || leg.busNumber}</h4>
                      <div className="bus-details">
                        <p><strong>{t('connectingRoutes.from', 'From')}</strong><span>{leg.fromStop.name}</span></p>
                        <p><strong>{t('connectingRoutes.to', 'To')}</strong><span>{leg.toStop.name}</span></p>
                      </div>
                      <div className="bus-time-row">
                        <div className="time-box departure">
                          <span>DEP</span>
                          <strong>{leg.departureTime}</strong>
                        </div>
                        <div className="duration-badge">
                          <span>⏱️ {formatDuration(leg.duration)}</span>
                        </div>
                        <div className="time-box arrival">
                          <span>ARR</span>
                          <strong>{leg.arrivalTime}</strong>
                        </div>
                      </div>
                    </div>
                    
                    {idx < legs.length - 1 && waitTimes[idx] > 0 && (
                      <div className="wait-time-indicator">
                        <div className="wait-time-badge">
                          <span>{t('connectingRoutes.waitAt', 'Wait at')} {leg.toStop.name}</span>
                          <strong>{formatDuration(waitTimes[idx])}</strong>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default React.memo(ConnectingRoutes);