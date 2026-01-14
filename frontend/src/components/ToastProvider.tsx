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
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            icon: '✅',
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            icon: '❌',
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
            icon: '⏳',
          },
        }}
      />
    </>
  );
};

export default ToastProvider;
