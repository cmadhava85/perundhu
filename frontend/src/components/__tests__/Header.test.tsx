import { render, screen } from '../../test-utils';
import Header from '../Header';

describe('Header Component', () => {
  test('renders header with title', () => {
    render(<Header />);
    
    // Check for the heading element that contains "பேருந்து"
    const headerElement = screen.getByText('பேருந்து');
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveClass('brand-name');
  });
});