import { render, screen, fireEvent } from '../../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusHeader from '../../bus/BusHeader';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('BusHeader', () => {
  const defaultProps = {
    busNumber: 'TN01AB1234',
    busName: 'Express Service',
    isLiveTracking: false,
    onTrackClick: vi.fn(),
    onSaveClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bus number and name', () => {
    render(<BusHeader {...defaultProps} />);
    
    expect(screen.getByText('TN01AB1234')).toBeInTheDocument();
    expect(screen.getByText('Express Service')).toBeInTheDocument();
  });

  it('displays correct status based on tracking state', () => {
    render(<BusHeader {...defaultProps} />);
    expect(screen.getByText('On Time')).toBeInTheDocument();
  });

  it('calls onTrackClick when track button is clicked', () => {
    const onTrackClick = vi.fn();
    render(<BusHeader {...defaultProps} onTrackClick={onTrackClick} />);
    
    const trackButton = screen.getByTitle('Start Live Tracking');
    fireEvent.click(trackButton);
    
    expect(onTrackClick).toHaveBeenCalled();
  });

  it('calls onSaveClick when save button is clicked', () => {
    const onSaveClick = vi.fn();
    render(<BusHeader {...defaultProps} onSaveClick={onSaveClick} />);
    
    const saveButton = screen.getByTitle('Save Route');
    fireEvent.click(saveButton);
    
    expect(onSaveClick).toHaveBeenCalled();
  });

  it('displays live tracking status when tracking is active', () => {
    render(<BusHeader {...defaultProps} isLiveTracking={false} />);
    expect(screen.getByText('On Time')).toBeInTheDocument();
  });

  it('displays live tracking status when tracking is enabled', () => {
    render(<BusHeader {...defaultProps} isLiveTracking={true} />);
    expect(screen.getByText('Live Tracking')).toBeInTheDocument();
  });
});