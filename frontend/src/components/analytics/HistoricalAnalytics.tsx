import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeRange, DataType } from './types';
import PunctualityChart from './PunctualityChart';
import AnalyticsFilterControls from './AnalyticsFilterControls';
import NoDataDisplay from './NoDataDisplay';

// Static mock data component
const HistoricalAnalytics = () => {
  const { t } = useTranslation();
  // Using state without accessing the values (just to keep state properly for demo)
  const [timeRange] = useState<TimeRange>('week');
  const [dataType] = useState<DataType>('punctuality');
  const [customStartDate] = useState<string>('');
  const [customEndDate] = useState<string>('');

  // Just for display purposes in test/development environment
  return (
    <div className="analytics-container">
      <h2>{t('analytics.title', 'Historical Analytics')}</h2>
      
      <AnalyticsFilterControls
        timeRange={timeRange}
        dataType={dataType}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onTimeRangeChange={() => {}}
        onDataTypeChange={() => {}}
        onStartDateChange={() => {}}
        onEndDateChange={() => {}}
      />

      <NoDataDisplay
        timeRange={timeRange}
        dataType={dataType}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onTimeRangeChange={() => {}}
        onDataTypeChange={() => {}}
        onStartDateChange={() => {}}
        onEndDateChange={() => {}}
      />
      
      {/* Charts would render here based on dataType */}
      {dataType === 'punctuality' && (
        <PunctualityChart 
          data={{
            data: [],
            pieData: [],
            summary: { title: '', description: '', dataPoints: 0 },
            bestDays: [],
            worstDays: []
          }} 
          formatDate={(d) => d}
          formatTime={(t) => t}
        />
      )}
    </div>
  );
};

export default HistoricalAnalytics;