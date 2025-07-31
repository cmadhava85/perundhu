import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/AnalyticsComponents.css';

interface ExportSectionProps {
  dataPoints: number;
  onExport: () => void;
}

/**
 * Component for exporting analytics data
 */
const ExportSection: React.FC<ExportSectionProps> = ({ dataPoints, onExport }) => {
  const { t } = useTranslation();
  
  return (
    <div className="export-section">
      <button className="export-btn" onClick={onExport}>
        <i className="export-icon"></i>
        {t('analytics.exportData', 'Export Data')}
      </button>
      <p className="data-points-info">
        {dataPoints} {t('analytics.dataPoints', 'data points')}
      </p>
    </div>
  );
};

export default ExportSection;