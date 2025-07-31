import React from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsFilterControls from './AnalyticsFilterControls';
import type { TimeRange, DataType } from './types';
import '../../styles/AnalyticsComponents.css';

interface NoDataDisplayProps {
  timeRange: TimeRange;
  dataType: DataType;
  customStartDate: string;
  customEndDate: string;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  onDataTypeChange: (dataType: DataType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

/**
 * Component shown when there is no data available
 */
const NoDataDisplay: React.FC<NoDataDisplayProps> = (props) => {
  const { t } = useTranslation();

  return (
    <>
      <AnalyticsFilterControls {...props} />
      
      <div className="analytics-no-data">
        <p>{t('analytics.noDataAvailable', 'No data available')}</p>
        <p>{t('analytics.tryDifferentFilters', 'Try a different time range or data type')}</p>
      </div>
    </>
  );
};

export default NoDataDisplay;