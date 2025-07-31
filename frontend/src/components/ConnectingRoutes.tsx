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
  
  return (
    <div className="connecting-routes" data-testid="connecting-routes">
      <h2 className="connecting-routes-title">{t('connectingRoutes.title')}</h2>
      <p className="connecting-routes-subtitle">{t('connectingRoutes.subtitle')}</p>
      
      {connectingRoutes.map(route => (
        <div 
          key={route.id} 
          className={`connecting-route-card ${expandedRouteId === route.id ? 'expanded' : ''}`}
          onClick={() => toggleRoute(route.id)}
        >
          <div className="route-summary">
            <div className="route-main-info">
              <h3>
                <span className="from">{route.firstLeg.from}</span> 
                <span className="connector"> → </span>
                <span className="connection-point">{route.connectionPoint}</span>
                <span className="connector"> → </span>
                <span className="to">{route.secondLeg.to}</span>
              </h3>
              <p className="route-duration">
                {t('connectingRoutes.totalDuration')}: {route.totalDuration}
              </p>
              <p className="route-wait-time">
                {t('connectingRoutes.waitingTime')}: {route.waitTime} {t('connectingRoutes.atStation')} {route.connectionPoint}
              </p>
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
      ))}
    </div>
  );
};

export default ConnectingRoutes;