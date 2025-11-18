import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface FieldConfig {
  [key: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  validationConfig: FieldConfig
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: string): string | null => {
    const rules = validationConfig[name];
    if (!rules) return null;

    if (rules.required && (!value || value.trim() === '')) {
      return 'This field is required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationConfig]);

  const validateAll = useCallback((): ValidationResult => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    Object.keys(validationConfig).forEach(fieldName => {
      const value = data[fieldName] || '';
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  }, [data, validateField, validationConfig]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  }, [validateField]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const setFieldValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFieldValue,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.values(errors).some(error => error !== '')
  };
};