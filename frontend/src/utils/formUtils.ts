import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ApiError } from '../services/api';

/**
 * Configuration for form submission with toast feedback
 */
export interface FormSubmitConfig {
  onLoading?: (toastId: string) => void;
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Utility function for handling form submissions with loading and success/error feedback
 */
export async function handleFormSubmit<T>(
  submitFn: () => Promise<T>,
  config: FormSubmitConfig = {}
): Promise<T | null> {
  const {
    onLoading,
    onSuccess,
    onError,
    successMessage = 'Success!',
    errorMessage = 'Something went wrong. Please try again.',
    showSuccessToast = true,
    showErrorToast = true,
  } = config;

  // Show loading toast
  const loadingToastId = toast.loading('Processing...');
  onLoading?.(loadingToastId);

  try {
    const result = await submitFn();

    // Update loading toast with success
    if (showSuccessToast) {
      toast.success(successMessage, { id: loadingToastId });
    } else {
      toast.dismiss(loadingToastId);
    }

    onSuccess?.(result);
    return result;
  } catch (error) {
    // Update loading toast with error
    const _displayError = error instanceof Error ? error.message : String(error);
    const finalErrorMessage = (error as ApiError)?.userMessage ?? errorMessage;

    if (showErrorToast) {
      toast.error(finalErrorMessage, { id: loadingToastId });
    } else {
      toast.dismiss(loadingToastId);
    }

    onError?.(error);
    return null;
  }
}

/**
 * Hook for form submission with loading state
 */
export function useFormSubmit() {
  return handleFormSubmit;
}

/**
 * Custom hook for managing form submission state
 */
export function useFormState(_initialValues: Record<string, unknown> = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const submitForm = async (
    onSubmit: (values: Record<string, unknown>) => Promise<void>,
    values: Record<string, unknown>
  ) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    errors,
    touched,
    submitForm,
    setErrors,
    setTouched,
  };
}
