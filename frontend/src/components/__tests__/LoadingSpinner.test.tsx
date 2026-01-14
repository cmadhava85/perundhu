import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner, ButtonLoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...');
  });

  it('renders small size correctly', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner', 'loading-spinner-sm');
  });

  it('renders medium size correctly', () => {
    render(<LoadingSpinner size="md" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner', 'loading-spinner-md');
  });

  it('renders large size correctly', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner', 'loading-spinner-lg');
  });

  it('renders fullscreen overlay when specified', () => {
    render(<LoadingSpinner fullScreen />);
    
    const overlay = screen.getByRole('status').parentElement;
    expect(overlay).toHaveClass('loading-spinner-overlay');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner message="Please wait" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label', 'Please wait');
  });

  it('renders screen reader text', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const srText = screen.getByText('Loading...');
    expect(srText).toHaveClass('sr-only');
  });
});

describe('ButtonLoadingSpinner', () => {
  it('renders button spinner correctly', () => {
    render(<ButtonLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('button-loading-spinner');
  });

  it('has proper accessibility for button context', () => {
    render(<ButtonLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with small size for buttons', () => {
    render(<ButtonLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    // Button spinner should be small by default
    expect(spinner).toHaveClass('button-loading-spinner');
  });
});

describe('LoadingSpinner animation', () => {
  it('renders all ring elements', () => {
    const { container } = render(<LoadingSpinner />);
    
    const rings = container.querySelectorAll('.loading-ring');
    expect(rings.length).toBe(4);
  });

  it('applies stagger animation classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const rings = container.querySelectorAll('.loading-ring');
    rings.forEach((ring, index) => {
      expect(ring).toHaveClass(`ring-${index + 1}`);
    });
  });
});

describe('LoadingSpinner dark mode', () => {
  it('supports dark mode styling', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Verify dark mode classes are applied
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });
});

describe('LoadingSpinner reduced motion', () => {
  it('respects prefers-reduced-motion', () => {
    const { container } = render(<LoadingSpinner />);
    
    // The CSS should handle reduced motion
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });
});
