import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header Component', () => {
  test('renders header with title', () => {
    render(<Header />);
    
    const headerElement = screen.getByRole('heading', { name: /tamil nadu bus schedule/i });
    expect(headerElement).toBeInTheDocument();
  });
});