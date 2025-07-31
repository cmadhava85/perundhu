// Mock chart components for testing
export const PunctualityChart = () => (
  <div data-testid="punctuality-chart">Punctuality Chart</div>
);

export const CrowdLevelChart = () => (
  <div data-testid="crowd-level-chart">Crowd Level Chart</div>
);

export const BusUtilizationChart = () => (
  <div data-testid="bus-utilization-chart">Bus Utilization Chart</div>
);

// Mock any other chart components that might be used
export const AnalyticsSummaryCard = ({ title, children }: { title: string, children: any }) => (
  <div data-testid="analytics-summary-card">
    <h3>{title}</h3>
    {children}
  </div>
);