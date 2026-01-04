import { render, screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { FormTextArea } from "../FormTextArea";

describe('FormTextArea Component', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      render(
        <FormTextArea
          id="test-textarea"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(
        <FormTextArea
          id="test-textarea"
          label="Description"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <FormTextArea
          id="test-textarea"
          placeholder="Enter description"
          value=""
          onChange={() => {}}
        />
      );
      
      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(
        <FormTextArea
          id="test-textarea"
          value=""
          onChange={onChange}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      
      expect(onChange).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <FormTextArea
          id="test-textarea"
          disabled={true}
          value=""
          onChange={() => {}}
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.disabled).toBe(true);
    });
  });

  describe('Error States', () => {
    it('should display error message when provided', () => {
      render(
        <FormTextArea
          id="test-textarea"
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
        <FormTextArea
          id="test-textarea"
          hint="Describe your issue"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('Describe your issue')).toBeInTheDocument();
    });

    it('should have aria-invalid when error is true', () => {
      render(
        <FormTextArea
          id="test-textarea"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby for error message', () => {
      render(
        <FormTextArea
          id="test-textarea"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-error');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FormTextArea
          id="test-textarea"
          className="custom-class"
          value=""
          onChange={() => {}}
        />
      );
      
      const wrapper = container.querySelector('.form-textarea-wrapper');
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should apply error class when error is true', () => {
      const { container } = render(
        <FormTextArea
          id="test-textarea"
          error={true}
          errorMessage="Error"
          value=""
          onChange={() => {}}
        />
      );
      
      const wrapper = container.querySelector('.form-textarea-wrapper');
      expect(wrapper).toHaveClass('error');
    });
  });

  describe('Required Field', () => {
    it('should show required indicator', () => {
      render(
        <FormTextArea
          id="test-textarea"
          label="Description"
          required={true}
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should set required attribute on textarea', () => {
      render(
        <FormTextArea
          id="test-textarea"
          required={true}
          value=""
          onChange={() => {}}
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.required).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper id and name attributes', () => {
      render(
        <FormTextArea
          id="my-textarea"
          name="my-name"
          value=""
          onChange={() => {}}
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.id).toBe('my-textarea');
      expect(textarea.name).toBe('my-name');
    });

    it('should associate label with textarea', () => {
      render(
        <FormTextArea
          id="test-textarea"
          label="Test Label"
          value=""
          onChange={() => {}}
        />
      );
      
      const label = screen.getByText('Test Label').closest('label');
      expect(label).toHaveAttribute('for', 'test-textarea');
    });

    it('should have aria-describedby for hint', () => {
      render(
        <FormTextArea
          id="test-textarea"
          hint="Enter a description"
          value=""
          onChange={() => {}}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-hint');
    });
  });
});
