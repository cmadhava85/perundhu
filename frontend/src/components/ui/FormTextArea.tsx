import React from 'react';
import './FormTextArea.css';

export interface FormTextAreaProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  icon?: string;
  className?: string;
}

/**
 * Reusable textarea component with consistent styling
 */
export const FormTextArea: React.FC<FormTextAreaProps> = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  errorMessage,
  hint,
  rows = 3,
  maxLength,
  icon,
  className = '',
}) => {
  const inputId = id || name;

  return (
    <div className={`form-textarea-wrapper ${className} ${error ? 'error' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="form-textarea-label">
          {icon && <span className="form-textarea-icon">{icon}</span>}
          {label}
          {required && <span className="form-textarea-required">*</span>}
        </label>
      )}
      
      <textarea
        id={inputId}
        name={name || inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`form-textarea ${error ? 'form-textarea-error' : ''}`}
        aria-invalid={error}
        aria-describedby={
          error && errorMessage 
            ? `${inputId}-error` 
            : hint 
            ? `${inputId}-hint` 
            : undefined
        }
      />
      
      {maxLength && (
        <div className="form-textarea-counter">
          {value.length}/{maxLength}
        </div>
      )}
      
      {hint && !error && (
        <span id={`${inputId}-hint`} className="form-textarea-hint">
          {hint}
        </span>
      )}
      
      {error && errorMessage && (
        <span id={`${inputId}-error`} className="form-textarea-error-message">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default FormTextArea;