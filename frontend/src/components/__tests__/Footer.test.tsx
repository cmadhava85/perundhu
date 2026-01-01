import { render, screen } from '../../test-utils';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders footer with copyright text', () => {
    render(<Footer />);
    
    // Check if footer is rendered with i18n keys (since t() returns the key in tests)
    const footerElement = screen.getByText(/footer\.title/i);
    expect(footerElement).toBeInTheDocument();
    
    // Check for other key elements that should be present
    expect(screen.getByText(/footer\.allRightsReserved/i)).toBeInTheDocument();
  });
});