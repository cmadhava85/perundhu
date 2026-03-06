import { Toaster } from 'react-hot-toast';
import React from 'react';

/**
 * Global Toast Configuration
 * Centralizes toast notification setup for the app
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            padding: '10px 12px',
            fontSize: '14px',
            maxWidth: '360px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
              padding: '10px 12px',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
              padding: '10px 12px',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
              padding: '10px 12px',
            },
          },
        }}
      />
    </>
  );
};

export default ToastProvider;
