import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders footer with copyright text', () => {
    render(<Footer />);
    
    const footerElement = screen.getByText(/tamil nadu bus scheduler/i);
    expect(footerElement).toBeInTheDocument();
    expect(footerElement.textContent).toContain('footer.allRightsReserved');
  });
});