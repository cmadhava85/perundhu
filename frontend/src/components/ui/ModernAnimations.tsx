import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'text-green-500 bg-green-50 border-green-200',
    error: 'text-red-500 bg-red-50 border-red-200',
    warning: 'text-yellow-500 bg-yellow-50 border-yellow-200',
    info: 'text-blue-500 bg-blue-50 border-blue-200',
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 min-w-80 max-w-md',
      'transform transition-all duration-300 ease-out',
      isVisible && !isLeaving && 'translate-x-0 opacity-100',
      !isVisible && 'translate-x-full opacity-0',
      isLeaving && 'translate-x-full opacity-0'
    )}>
      <div className={cn(
        'bg-white rounded-2xl shadow-strong border p-4',
        'backdrop-blur-lg bg-white/95',
        colors[type]
      )}>
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm">
              {title}
            </h4>
            {message && (
              <p className="text-gray-600 text-sm mt-1">
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all ease-linear',
              type === 'success' && 'bg-green-500',
              type === 'error' && 'bg-red-500',
              type === 'warning' && 'bg-yellow-500',
              type === 'info' && 'bg-blue-500'
            )}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Toast Container and Hook
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Floating Action Button with animations
interface FloatingActionButtonProps {
  icon: React.ComponentType<any>;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  label?: string;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  color = 'primary',
  label,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/25',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-secondary-500/25',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25',
    error: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25',
  };

  return (
    <div className={cn('fixed z-40', positionClasses[position])}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'rounded-full shadow-2xl transition-all duration-300',
          'transform hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-offset-2',
          'flex items-center justify-center',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      >
        <Icon className={cn(
          'transition-transform duration-200',
          size === 'sm' && 'w-5 h-5',
          size === 'md' && 'w-6 h-6',
          size === 'lg' && 'w-7 h-7',
          isHovered && 'rotate-12'
        )} />
      </button>
      
      {label && isHovered && (
        <div className={cn(
          'absolute whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg',
          'transform transition-all duration-200',
          'animate-fade-in',
          position.includes('right') ? 'right-full mr-3' : 'left-full ml-3',
          'top-1/2 -translate-y-1/2'
        )}>
          {label}
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45',
            position.includes('right') ? '-right-1' : '-left-1'
          )} />
        </div>
      )}
    </div>
  );
};

// Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(value * easeOutCubic));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

export default Toast;