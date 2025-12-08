import '../../styles/AnalyticsComponents.css';
import type { CustomTooltipProps, TooltipPayloadItem } from './types';

/**
 * Custom tooltip component for recharts
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-custom-tooltip">
        <p className="tooltip-label">{`${label}`}</p>
        {payload.map((entry: TooltipPayloadItem, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;