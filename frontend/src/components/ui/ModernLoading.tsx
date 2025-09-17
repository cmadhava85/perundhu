import React from 'react';
import { Loader2, Bus, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModernLoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bus' | 'skeleton';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const ModernLoading: React.FC<ModernLoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className,
  fullScreen = false
}) => {
  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-4',
    {
      'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm': fullScreen,
      'p-8': fullScreen,
    },
    className
  );

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const renderSpinner = () => (
    <Loader2 className={cn(
      sizeClasses[size],
      'animate-spin text-primary-500'
    )} />
  );

  const renderDots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-primary-500',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-5 h-5',
            'animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={cn(
      'rounded-full bg-primary-500/30 animate-pulse-slow',
      size === 'sm' && 'w-8 h-8',
      size === 'md' && 'w-12 h-12',
      size === 'lg' && 'w-16 h-16',
      size === 'xl' && 'w-20 h-20',
      'relative'
    )}>
      <div className={cn(
        'absolute inset-2 rounded-full bg-primary-500 animate-pulse',
        'opacity-80'
      )} />
    </div>
  );

  const renderBus = () => (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Bus className={cn(
          sizeClasses[size],
          'text-primary-500 animate-bounce-soft'
        )} />
        <div className="flex gap-1">
          <MapPin className={cn(
            'w-2 h-2 text-gray-400 animate-pulse',
            'opacity-100'
          )} style={{ animationDelay: '0s' }} />
          <MapPin className={cn(
            'w-2 h-2 text-gray-400 animate-pulse',
            'opacity-75'
          )} style={{ animationDelay: '0.2s' }} />
          <MapPin className={cn(
            'w-2 h-2 text-gray-400 animate-pulse',
            'opacity-50'
          )} style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="w-full max-w-md space-y-4 animate-pulse">
      {/* Card skeleton */}
      <div className="bg-gray-200 rounded-2xl p-6 space-y-4">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-300 rounded-lg w-1/2" />
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-10 bg-gray-300 rounded-xl" />
          <div className="h-10 bg-gray-300 rounded-xl" />
        </div>
        
        {/* Button skeleton */}
        <div className="h-12 bg-gray-300 rounded-xl w-full" />
      </div>
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'bus':
        return renderBus();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClasses}>
      {variant !== 'skeleton' && renderLoading()}
      {variant === 'skeleton' && renderSkeleton()}
      
      {text && variant !== 'skeleton' && (
        <p className={cn(
          'text-gray-600 font-medium text-center',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton components for specific use cases
export const SearchSkeleton: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto animate-pulse">
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 rounded-lg w-2/3 mx-auto" />
        <div className="h-4 bg-gray-200 rounded-lg w-3/4 mx-auto" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
        
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
        
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-12" />
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
      
      {/* Button */}
      <div className="h-14 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

export const ResultsSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-24" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ModernLoading;