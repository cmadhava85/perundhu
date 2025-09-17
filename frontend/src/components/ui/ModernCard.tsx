import React from 'react';
import { cn } from '../../utils/cn';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  animated?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  animated = false,
}) => {
  const cardClasses = cn(
    // Base styles
    'rounded-2xl transition-all duration-300 ease-out',
    
    // Animation
    {
      'animate-fade-in': animated,
    },
    
    // Variant styles
    {
      // Default
      'bg-white border border-gray-200 shadow-soft': variant === 'default',
      
      // Glass
      'bg-white/20 backdrop-blur-lg border border-white/30 shadow-medium': variant === 'glass',
      
      // Gradient
      'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 shadow-strong': variant === 'gradient',
      
      // Elevated
      'bg-white border border-gray-100 shadow-strong': variant === 'elevated',
    },
    
    // Padding
    {
      'p-0': padding === 'none',
      'p-3': padding === 'sm',
      'p-4 md:p-6': padding === 'md',
      'p-6 md:p-8': padding === 'lg',
      'p-8 md:p-10': padding === 'xl',
    },
    
    // Hover effects
    {
      'hover:shadow-medium hover:-translate-y-1 cursor-pointer': hover && variant === 'default',
      'hover:bg-white/30 hover:shadow-strong cursor-pointer': hover && variant === 'glass',
      'hover:shadow-glow hover:-translate-y-1 cursor-pointer': hover && (variant === 'gradient' || variant === 'elevated'),
    },
    
    className
  );

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

export default ModernCard;