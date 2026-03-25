import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './SuccessBanner.css';

export type BannerType = 'success' | 'error' | 'warning' | 'info';

interface SuccessBannerProps {
  message: string;
  type?: BannerType;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onDismiss?: () => void;
  onUndo?: () => void;
  undoText?: string;
}

/**
 * Success/Error Banner with optional undo functionality
 * Sticky at the top of the viewport for visibility
 */
const SuccessBanner: React.FC<SuccessBannerProps> = ({
  message,
  type = 'success',
  duration = 5000,
  onDismiss,
  onUndo,
  undoText = 'Undo'
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Match animation duration
  }, [onDismiss]);

  const handleUndo = useCallback(() => {
    onUndo?.();
    handleDismiss();
  }, [onUndo, handleDismiss]);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [duration, handleDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="banner-icon" />;
      case 'error':
        return <XCircle className="banner-icon" />;
      case 'warning':
        return <AlertTriangle className="banner-icon" />;
      case 'info':
        return <Info className="banner-icon" />;
    }
  };

  if (!visible) return null;

  return (
    <div className={`success-banner banner-${type} ${visible ? 'visible' : ''}`}>
      <div className="banner-content">
        {getIcon()}
        <span className="banner-message">{message}</span>
      </div>

      <div className="banner-actions">
        {onUndo && (
          <button className="banner-undo-btn" onClick={handleUndo}>
            {undoText}
          </button>
        )}
        {onDismiss && (
          <button className="banner-dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">
            <X size={18} />
          </button>
        )}
      </div>

      {duration > 0 && (
        <div className="banner-progress">
          <div 
            className="banner-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SuccessBanner;
