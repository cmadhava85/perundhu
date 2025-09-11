import React from 'react';
import { useTranslation } from 'react-i18next';

// Simple Card components to replace missing UI library
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b">
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-900">
    {children}
  </h3>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4">
    {children}
  </div>
);

interface AnalyticsCardsProps {
  totalTrips: number;
  averageDelay: number;
  onTimePercentage: number;
  totalDistance: number;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  totalTrips,
  averageDelay,
  onTimePercentage,
  totalDistance
}) => {
  const { t } = useTranslation();

  const formatDelay = (delay: number) => {
    if (delay === 0) return t('onTime');
    return delay > 0 ? `+${delay}${t('min')}` : `${delay}${t('min')}`;
  };

  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toFixed(1)} km`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('totalTrips')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrips.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('averageDelay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            averageDelay > 0 ? 'text-red-600' : 
            averageDelay < 0 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {formatDelay(averageDelay)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('onTimePerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            onTimePercentage >= 90 ? 'text-green-600' :
            onTimePercentage >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {onTimePercentage.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('totalDistance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDistance(totalDistance)}</div>
        </CardContent>
      </Card>
    </div>
  );
};