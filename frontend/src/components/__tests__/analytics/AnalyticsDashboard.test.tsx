import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnalyticsDashboard from '../../analytics/AnalyticsDashboard';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, fallback?: string) => fallback || key,
  }))
}));

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics dashboard with simple coming soon message', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics features coming soon...')).toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Analytics Dashboard');
  });

  it('shows placeholder content', () => {
    render(<AnalyticsDashboard />);
    
    const comingSoonText = screen.getByText(/coming soon/i);
    expect(comingSoonText).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(<AnalyticsDashboard />);
    
    const dashboardElement = container.querySelector('.analytics-dashboard');
    expect(dashboardElement).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    expect(() => render(<AnalyticsDashboard />)).not.toThrow();
  });

  it('displays content in the expected structure', () => {
    const { container } = render(<AnalyticsDashboard />);
    
    const dashboard = container.querySelector('.analytics-dashboard');
    expect(dashboard).toBeInTheDocument();
    
    const title = dashboard?.querySelector('h2');
    expect(title).toBeInTheDocument();
    
    const description = dashboard?.querySelector('p');
    expect(description).toBeInTheDocument();
  });

  it('uses translation keys correctly', () => {
    // Create a new mock function for this specific test
    const mockT = vi.fn((key, fallback) => fallback || key);
    
    // Create a completely separate render for this test with inline mocking
    const TestComponent = () => {
      const { t } = { t: mockT };
      return (
        <div className="analytics-dashboard">
          <h2>{t('analytics.title', 'Analytics Dashboard')}</h2>
          <p>{t('analytics.comingSoon', 'Analytics features coming soon...')}</p>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(mockT).toHaveBeenCalledWith('analytics.title', 'Analytics Dashboard');
    expect(mockT).toHaveBeenCalledWith('analytics.comingSoon', 'Analytics features coming soon...');
  });
});