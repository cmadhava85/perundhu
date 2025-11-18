import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ConnectingRoutes.css';

// Define proper type for connecting routes
interface BusLeg {
  id: number;
  from: string;
  to: string;
  busName: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
}

interface ConnectingRoute {
  id: number;
  isDirectRoute: boolean;
  firstLeg: BusLeg;
  secondLeg: BusLeg;
  connectionPoint: string;
  waitTime: string;
  totalDuration: string;
}

interface ConnectingRoutesProps {
  connectingRoutes: ConnectingRoute[];
}

const ConnectingRoutes: React.FC<ConnectingRoutesProps> = ({ connectingRoutes }) => {
  const { t } = useTranslation();
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  
  // If no routes, don't render component
  if (connectingRoutes.length === 0) {
    return null;
  }
  
  const toggleRoute = (routeId: number) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  };

  // Parse duration to minutes for comparison
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)h?\s*(\d+)?m?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
  };

  // Find the fastest route (shortest duration)
  const fastestRoute = connectingRoutes.reduce((fastest, route) => {
    const currentDuration = parseDuration(route.totalDuration);
    const fastestDuration = parseDuration(fastest.totalDuration);
    return currentDuration < fastestDuration ? route : fastest;
  }, connectingRoutes[0]);
  
  return (
    <div className="connecting-routes" data-testid="connecting-routes">
      <div className="connecting-routes-header">
        <h2 className="connecting-routes-title">🔄 {t('connectingRoutes.title')}</h2>
        <p className="connecting-routes-subtitle">
          {t('connectingRoutes.subtitle')} • Sorted by fastest route first
        </p>
      </div>
      
      {connectingRoutes.map((route, index) => {
        const isFastest = route.id === fastestRoute.id;
        return (
        <div 
          key={route.id} 
          className={`connecting-route-card ${expandedRouteId === route.id ? 'expanded' : ''} ${isFastest ? 'fastest-route' : ''}`}
          onClick={() => toggleRoute(route.id)}
        >
          {/* Fastest Route Badge */}
          {isFastest && (
            <div className="fastest-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">Fastest Route</span>
            </div>
          )}

          <div className="route-summary">
            <div className="route-main-info">
              <h3>
                <span className="from">{route.firstLeg.from}</span> 
                <span className="connector"> → </span>
                <span className="connection-point">{route.connectionPoint}</span>
                <span className="connector"> → </span>
                <span className="to">{route.secondLeg.to}</span>
              </h3>
              <div className="route-metrics">
                <div className="metric-item primary">
                  <span className="metric-icon">⏱️</span>
                  <span className="metric-label">Total:</span>
                  <strong className="metric-value">{route.totalDuration}</strong>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">⏸️</span>
                  <span className="metric-label">Wait at {route.connectionPoint}:</span>
                  <span className="metric-value">{route.waitTime}</span>
                </div>
              </div>
            </div>
          </div>
          
          {expandedRouteId === route.id && (
            <div className="route-details">
              <div className="connection-info">
                <h4>{t('connectingRoutes.connectionAt')}: {route.connectionPoint}</h4>
              </div>
              
              <div className="legs-container">
                <div className="leg-card">
                  <h4>{t('connectingRoutes.firstLeg')}</h4>
                  <div className="leg-details">
                    <p><strong>{t('connectingRoutes.from')}:</strong> {route.firstLeg.from}</p>
                    <p><strong>{t('connectingRoutes.to')}:</strong> {route.firstLeg.to}</p>
                    <p><strong>{t('connectingRoutes.busDetails')}:</strong> {route.firstLeg.busName} ({route.firstLeg.busNumber})</p>
                    <div className="bus-time">
                      <div className="departure">
                        <span>{t('connectingRoutes.departure')}:</span>
                        <strong>{route.firstLeg.departureTime}</strong>
                      </div>
                      <div className="arrival">
                        <span>{t('connectingRoutes.arrival')}:</span>
                        <strong>{route.firstLeg.arrivalTime}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="wait-time-indicator">
                  <div className="wait-time-badge">
                    <span>{t('connectingRoutes.waitTime')}</span>
                    <strong>{route.waitTime}</strong>
                  </div>
                </div>
                
                <div className="leg-card">
                  <h4>{t('connectingRoutes.secondLeg')}</h4>
                  <div className="leg-details">
                    <p><strong>{t('connectingRoutes.from')}:</strong> {route.secondLeg.from}</p>
                    <p><strong>{t('connectingRoutes.to')}:</strong> {route.secondLeg.to}</p>
                    <p><strong>{t('connectingRoutes.busDetails')}:</strong> {route.secondLeg.busName} ({route.secondLeg.busNumber})</p>
                    <div className="bus-time">
                      <div className="departure">
                        <span>{t('connectingRoutes.departure')}:</span>
                        <strong>{route.secondLeg.departureTime}</strong>
                      </div>
                      <div className="arrival">
                        <span>{t('connectingRoutes.arrival')}:</span>
                        <strong>{route.secondLeg.arrivalTime}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default ConnectingRoutes;