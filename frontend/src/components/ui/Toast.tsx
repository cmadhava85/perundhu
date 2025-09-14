import React, { useState, useEffect } from 'react';
import '../../styles/mobile-first.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600', 
    info: 'bg-blue-500 border-blue-600',
    warning: 'bg-yellow-500 border-yellow-600'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️', 
    warning: '⚠️'
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in">
      <div 
        className={`
          ${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg border-l-4
          max-w-sm transition-all duration-300 transform
          ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{typeIcons[type]}</span>
          <p className="flex-1 text-sm font-medium">{message}</p>
          <button
            onClick={() => {
              setIsLeaving(true);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;