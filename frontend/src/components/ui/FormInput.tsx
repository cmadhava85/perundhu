import React from 'react';
import './FormInput.css';

export interface FormInputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'time' | 'date' | 'number';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  hint?: string;
  icon?: string;
  className?: string;
  autoComplete?: string;
}

/**
 * Reusable form input component with consistent styling and validation
 */
export const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  errorMessage,
  hint,
  icon,
  className = '',
  autoComplete,
}) => {
  const inputId = id || name;

  return (
    <div className={`form-input-wrapper ${className} ${error ? 'error' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="form-input-label">
          {icon && <span className="form-input-icon">{icon}</span>}
          {label}
          {required && <span className="form-input-required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name || inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        aria-invalid={error}
        aria-describedby={
          error && errorMessage 
            ? `${inputId}-error` 
            : hint 
            ? `${inputId}-hint` 
            : undefined
        }
      />
      
      {hint && !error && (
        <span id={`${inputId}-hint`} className="form-input-hint">
          {hint}
        </span>
      )}
      
      {error && errorMessage && (
        <span id={`${inputId}-error`} className="form-input-error-message">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default FormInput;