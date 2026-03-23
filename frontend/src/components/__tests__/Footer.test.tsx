import { render, screen } from '../../test-utils';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders footer with copyright text', () => {
    render(<Footer />);
    
    // Check if footer is rendered with the actual default text (i18n returns fallback values in tests)
    // Use a more specific query to avoid multiple matches
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
    
    // The footer should contain the year
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });
});