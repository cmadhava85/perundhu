import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeRange, DataType } from './types';
import '../../styles/AnalyticsComponents.css';

interface AnalyticsFilterControlsProps {
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
 * Component for analytics filtering controls
 */
const AnalyticsFilterControls: React.FC<AnalyticsFilterControlsProps> = ({
  timeRange,
  dataType,
  customStartDate,
  customEndDate,
  onTimeRangeChange,
  onDataTypeChange,
  onStartDateChange,
  onEndDateChange
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="analytics-filter-bar">
        <div className="filter-group">
          <label>{t('analytics.timeRange', 'Time Range')}</label>
          <select 
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          >
            <option value="day">{t('analytics.today', 'Today')}</option>
            <option value="week">{t('analytics.lastWeek', 'Last Week')}</option>
            <option value="month">{t('analytics.lastMonth', 'Last Month')}</option>
            <option value="custom">{t('analytics.customRange', 'Custom Range')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('analytics.dataType', 'Data Type')}</label>
          <select
            value={dataType}
            onChange={(e) => onDataTypeChange(e.target.value as DataType)}
          >
            <option value="punctuality">{t('analytics.punctuality', 'Punctuality')}</option>
            <option value="crowdLevels">{t('analytics.crowdLevels', 'Crowd Levels')}</option>
            <option value="busUtilization">{t('analytics.busUtilization', 'Bus Utilization')}</option>
          </select>
        </div>
      </div>

      {timeRange === 'custom' && (
        <div className="date-range-picker">
          <div className="date-field">
            <label>{t('analytics.startDate', 'Start Date')}</label>
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="date-field">
            <label>{t('analytics.endDate', 'End Date')}</label>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyticsFilterControls;