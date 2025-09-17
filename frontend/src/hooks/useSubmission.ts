import { useState, useCallback } from 'react';

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface UseSubmissionOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useSubmission = <T = any>(options: UseSubmissionOptions = {}) => {
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<T | null>(null);

  const submit = useCallback(async (
    submitFunction: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: Error }> => {
    setStatus('submitting');
    setMessage('');
    
    try {
      const result = await submitFunction();
      setStatus('success');
      setResult(result);
      setMessage(options.successMessage || 'Operation completed successfully');
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return { success: true, result };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      setStatus('error');
      setMessage(options.errorMessage || err.message);
      
      if (options.onError) {
        options.onError(err);
      }
      
      return { success: false, error: err };
    }
  }, [options]);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setResult(null);
  }, []);

  return {
    status,
    message,
    result,
    submit,
    reset,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle'
  };
};