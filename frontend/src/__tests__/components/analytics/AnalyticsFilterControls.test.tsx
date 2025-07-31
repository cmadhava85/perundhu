import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsFilterControls from '../../../components/analytics/AnalyticsFilterControls';

// Mock i18n
jest.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key as-is for testing
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

describe('AnalyticsFilterControls Component', () => {
  const mockOnTimeRangeChange = jest.fn();
  const mockOnDataTypeChange = jest.fn();
  const mockOnStartDateChange = jest.fn();
  const mockOnEndDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default values', () => {
    render(
      <AnalyticsFilterControls
        timeRange="week"
        dataType="punctuality"
        customStartDate="2025-05-01"
        customEndDate="2025-06-01"
        onTimeRangeChange={mockOnTimeRangeChange}
        onDataTypeChange={mockOnDataTypeChange}
        onStartDateChange={mockOnStartDateChange}
        onEndDateChange={mockOnEndDateChange}
      />
    );

    // Check filter section headers (now checking for i18n keys)
    expect(screen.getByText('analytics.timeRange')).toBeInTheDocument();
    expect(screen.getByText('analytics.dataType')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when time range is changed', () => {
    const { container } = render(
      <AnalyticsFilterControls
        timeRange="week"
        dataType="punctuality"
        customStartDate="2025-05-01"
        customEndDate="2025-06-01"
        onTimeRangeChange={mockOnTimeRangeChange}
        onDataTypeChange={mockOnDataTypeChange}
        onStartDateChange={mockOnStartDateChange}
        onEndDateChange={mockOnEndDateChange}
      />
    );

    // Find the first select (time range) by its position in the DOM
    const timeRangeSelect = container.querySelectorAll('select')[0];
    fireEvent.change(timeRangeSelect, { target: { value: 'month' } });

    // Verify onTimeRangeChange was called with updated value
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('month');
  });

  it('calls onDataTypeChange when data type is changed', () => {
    const { container } = render(
      <AnalyticsFilterControls
        timeRange="week"
        dataType="punctuality"
        customStartDate="2025-05-01"
        customEndDate="2025-06-01"
        onTimeRangeChange={mockOnTimeRangeChange}
        onDataTypeChange={mockOnDataTypeChange}
        onStartDateChange={mockOnStartDateChange}
        onEndDateChange={mockOnEndDateChange}
      />
    );

    // Find the second select (data type) by its position in the DOM
    const dataTypeSelect = container.querySelectorAll('select')[1];
    fireEvent.change(dataTypeSelect, { target: { value: 'crowdLevels' } });

    // Verify onDataTypeChange was called with updated value
    expect(mockOnDataTypeChange).toHaveBeenCalledWith('crowdLevels');
  });

  it('shows date range inputs when custom time range is selected', () => {
    render(
      <AnalyticsFilterControls
        timeRange="custom"
        dataType="punctuality"
        customStartDate="2025-05-01"
        customEndDate="2025-06-01"
        onTimeRangeChange={mockOnTimeRangeChange}
        onDataTypeChange={mockOnDataTypeChange}
        onStartDateChange={mockOnStartDateChange}
        onEndDateChange={mockOnEndDateChange}
      />
    );

    // Date inputs should be visible when custom range is selected (now checking for date-field class)
    expect(screen.getByText('analytics.startDate')).toBeInTheDocument();
    expect(screen.getByText('analytics.endDate')).toBeInTheDocument();
  });

  it('calls onStartDateChange when start date is changed', () => {
    const { container } = render(
      <AnalyticsFilterControls
        timeRange="custom"
        dataType="punctuality"
        customStartDate="2025-05-01"
        customEndDate="2025-06-01"
        onTimeRangeChange={mockOnTimeRangeChange}
        onDataTypeChange={mockOnDataTypeChange}
        onStartDateChange={mockOnStartDateChange}
        onEndDateChange={mockOnEndDateChange}
      />
    );

    // Find the first input (start date) by type
    const startDateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = startDateInputs[0];
    fireEvent.change(startDateInput, { target: { value: '2025-05-15' } });

    // Verify onStartDateChange was called with updated value
    expect(mockOnStartDateChange).toHaveBeenCalledWith('2025-05-15');
  });
});