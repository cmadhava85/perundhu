import { render, screen } from '../../../test-utils';
import '@testing-library/jest-dom';
import CustomTooltip from '../../../components/analytics/CustomTooltip';

describe('CustomTooltip Component', () => {
  const mockPayload = [
    {
      name: 'On Time',
      value: 85,
      color: '#82ca9d'
    },
    {
      name: 'Delayed',
      value: 15,
      color: '#ff8884'
    }
  ];

  it('renders with time data correctly', () => {
    const mockProps = {
      active: true,
      payload: mockPayload,
      label: '12:00',
      dataType: 'crowdLevels' as const,
    };

    render(<CustomTooltip {...mockProps} />);
    
    // Test that the label is displayed directly
    expect(screen.getByText('12:00')).toBeInTheDocument();
    
    // Should show each data point
    expect(screen.getByText('On Time: 85')).toBeInTheDocument();
    expect(screen.getByText('Delayed: 15')).toBeInTheDocument();
  });

  it('renders with date data correctly', () => {
    const mockProps = {
      active: true,
      payload: mockPayload,
      label: '2025-06-01',
      dataType: 'punctuality' as const,
    };

    render(<CustomTooltip {...mockProps} />);
    
    // Test that the label is displayed directly
    expect(screen.getByText('2025-06-01')).toBeInTheDocument();
    
    // Should show each data point
    expect(screen.getByText('On Time: 85')).toBeInTheDocument();
    expect(screen.getByText('Delayed: 15')).toBeInTheDocument();
  });

  it('returns null when not active', () => {
    const mockProps = {
      active: false,
      payload: mockPayload,
      label: '12:00',
      dataType: 'crowdLevels' as const,
    };

    const { container } = render(<CustomTooltip {...mockProps} />);
    
    // Should render nothing when tooltip is not active
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when payload is not available', () => {
    const mockProps = {
      active: true,
      payload: undefined,
      label: '12:00',
      dataType: 'crowdLevels' as const,
    };

    const { container } = render(<CustomTooltip {...mockProps} />);
    
    // Should render nothing when payload is undefined
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when payload is empty', () => {
    const mockProps = {
      active: true,
      payload: [],
      label: '12:00',
      dataType: 'crowdLevels' as const,
    };

    const { container } = render(<CustomTooltip {...mockProps} />);
    
    // Should render nothing when payload is empty
    expect(container).toBeEmptyDOMElement();
  });
});