import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConfidenceLegendProps {
  className?: string;
}

const ConfidenceLegend: React.FC<ConfidenceLegendProps> = ({ className = '' }) => {
  const { t } = useTranslation();

  return (
    <div className={`confidence-legend ${className}`}>
      <h4>{t('liveTracker.confidenceLegend', 'Confidence Score')}</h4>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
          <span>{t('liveTracker.highConfidence', 'High (70-100)')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
          <span>{t('liveTracker.mediumConfidence', 'Medium (40-69)')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FF0000' }}></span>
          <span>{t('liveTracker.lowConfidence', 'Low (0-39)')}</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceLegend;