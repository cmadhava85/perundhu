import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import RouteSearch from '../RouteSearch';

describe('RouteSearch Component', () => {
  const mockSetSearchQuery = vi.fn();
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input field', () => {
      render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      expect(screen.getByPlaceholderText('Search routes...')).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should display search input with provided value', () => {
      render(
        <RouteSearch
          searchQuery="Chennai to Bangalore"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const input = screen.getByPlaceholderText('Search routes...');
      expect(input).toHaveValue('Chennai to Bangalore');
    });
  });

  describe('User Input', () => {
    it('should call setSearchQuery when input changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const input = screen.getByPlaceholderText('Search routes...');
      await user.type(input, 'test query');

      // Verify that setSearchQuery was called with characters
      expect(mockSetSearchQuery).toHaveBeenCalled();
      // Should be called 10 times (one for each character in 'test query')
      expect(mockSetSearchQuery).toHaveBeenCalledTimes(10);
    });

    it('should update input value as user types', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const input = screen.getByPlaceholderText('Search routes...');
      await user.type(input, 'test');

      // Simulate parent updating the searchQuery prop
      rerender(
        <RouteSearch
          searchQuery="test"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      expect(input).toHaveValue('test');
    });
  });

  describe('Form Submission', () => {
    it('should call onSearch when form is submitted', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery="test route"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnSearch).toHaveBeenCalledWith('test route');
    });

    it('should call onSearch on Enter key press', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery="test route"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const input = screen.getByPlaceholderText('Search routes...');
      await user.type(input, '{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith('test route');
    });

    it('should not call onSearch when query is empty', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      await user.click(button);
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should not call onSearch when query is only whitespace', async () => {
      const _user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery="   "
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should disable button while searching', () => {
      render(
        <RouteSearch
          searchQuery="test route"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show searching text while searching', () => {
      render(
        <RouteSearch
          searchQuery="test route"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={true}
        />
      );

      expect(screen.getByText(/Searching/i)).toBeInTheDocument();
    });

    it('should show normal search text when not searching', () => {
      render(
        <RouteSearch
          searchQuery="test route"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent(/^.*Search$/);
    });
  });

  describe('Form Element', () => {
    it('should have proper form structure', () => {
      render(
        <RouteSearch
          searchQuery=""
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const form = screen.getByPlaceholderText('Search routes...').closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should prevent default form submission', async () => {
      const _user = userEvent.setup({ delay: null });
      render(
        <RouteSearch
          searchQuery="test"
          setSearchQuery={mockSetSearchQuery}
          onSearch={mockOnSearch}
          isSearching={false}
        />
      );

      const form = screen.getByPlaceholderText('Search routes...').closest('form');
      const submitEvent = new SubmitEvent('submit', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form?.dispatchEvent(submitEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
