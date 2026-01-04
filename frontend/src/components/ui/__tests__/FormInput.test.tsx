import { render, screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { FormInput } from "../FormInput";

describe('FormInput Component', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      render(
        <FormInput
          id="test-input"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <FormInput
          id="test-input"
          placeholder="Enter text"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(
        <FormInput
          id="test-input"
          label="Test Label"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      render(
        <FormInput
          id="test-input"
          label="Test Label"
          required={true}
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <FormInput
          id="test-input"
          disabled={true}
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('Error States', () => {
    it('should display error message when provided', () => {
      render(
        <FormInput
          id="test-input"
          error={true}
          errorMessage="This field is required"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should show hint text when provided', () => {
      render(
        <FormInput
          id="test-input"
          hint="Enter a valid email"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });

    it('should have aria-invalid when error is true', () => {
      render(
        <FormInput
          id="test-input"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Input Types', () => {
    it('should render text input by default', () => {
      render(
        <FormInput
          id="test-input"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should render email input type', () => {
      render(
        <FormInput
          id="test-input"
          type="email"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FormInput
          id="test-input"
          className="custom-class"
          value=""
          onChange={() => {}}
        />
      );
      
      const wrapper = container.querySelector('.form-input-wrapper');
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should apply error class when error is true', () => {
      const { container } = render(
        <FormInput
          id="test-input"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );
      
      const wrapper = container.querySelector('.form-input-wrapper');
      expect(wrapper).toHaveClass('error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper id and name attributes', () => {
      render(
        <FormInput
          id="my-input"
          name="my-name"
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.id).toBe('my-input');
      expect(input.name).toBe('my-name');
    });

    it('should associate label with input', () => {
      render(
        <FormInput
          id="test-input"
          label="Test Label"
          value=""
          onChange={() => {}}
        />
      );
      
      const label = screen.getByText('Test Label').closest('label');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('should have aria-describedby for error message', () => {
      render(
        <FormInput
          id="test-input"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });

    it('should have aria-describedby for hint', () => {
      render(
        <FormInput
          id="test-input"
          hint="Enter a valid value"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-hint');
    });
  });
});
