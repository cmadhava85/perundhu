import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BusIcon, UsersIcon, CityIcon } from './icons';
import '../styles/StatisticsSection.css';

interface PlatformStatistics {
  totalBuses: number;
  routesCovered: number;
  dailyUsers: number;
  contributorCount: number;
}

const StatisticsSection: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlatformStatistics>({
    totalBuses: 1247,
    routesCovered: 156,
    dailyUsers: 45000,
    contributorCount: 125
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/v1/bus-schedules/public-stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalBuses: data.totalBuses || 1247,
            routesCovered: data.routesCovered || 156,
            dailyUsers: data.dailyUsers || 45000,
            contributorCount: data.contributorCount || 125
          });
        }
      } catch (error) {
        console.warn('Failed to fetch platform statistics:', error);
        // Use default values if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K${num % 1000 !== 0 ? '+' : ''}`;
    }
    return num.toString();
  };

  return (
    <section className="statistics-section">
      <div className="statistics-container">
        <div className="statistics-grid">
          {/* Total Buses */}
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-number bus-stat">
                {loading ? '...' : formatNumber(stats.totalBuses)}
              </div>
              <div className="stat-icon-container bus-icon">
                <BusIcon size={32} />
              </div>
            </div>
            <p className="stat-label">
              {t('statistics.totalBuses', 'Total Buses')}
            </p>
          </div>

          {/* Routes Covered */}
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-number routes-stat">
                {loading ? '...' : formatNumber(stats.routesCovered)}
              </div>
              <div className="stat-icon-container routes-icon">
                <CityIcon size={32} />
              </div>
            </div>
            <p className="stat-label">
              {t('statistics.routesCovered', 'Routes Covered')}
            </p>
          </div>

          {/* Daily Users */}
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-number users-stat">
                {loading ? '...' : formatNumber(stats.dailyUsers)}
              </div>
              <div className="stat-icon-container users-icon">
                <UsersIcon size={32} />
              </div>
            </div>
            <p className="stat-label">
              {t('statistics.dailyUsers', 'Daily Users')}
            </p>
          </div>

          {/* Contributors */}
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-number contributors-stat">
                {loading ? '...' : formatNumber(stats.contributorCount)}
              </div>
              <div className="stat-icon-container contributors-icon">
                <UsersIcon size={32} />
              </div>
            </div>
            <p className="stat-label">
              {t('statistics.contributors', 'Contributors')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(StatisticsSection);
