import { render, screen } from '../../test-utils';
import Header from '../Header';

describe('Header Component', () => {
  test('renders header with title', () => {
    render(<Header />);
    
    const headerElement = screen.getByRole('heading', { level: 1 });
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveClass('brand-name');
  });
});