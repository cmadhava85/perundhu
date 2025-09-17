import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center font-medium rounded-xl',
    'transition-all duration-200 ease-out transform',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'active:scale-95',
    
    // Size variants
    {
      'px-3 py-2 text-sm gap-1.5': size === 'sm',
      'px-4 py-2.5 text-sm gap-2': size === 'md',
      'px-6 py-3 text-base gap-2.5': size === 'lg',
      'px-8 py-4 text-lg gap-3': size === 'xl',
    },
    
    // Variant styles
    {
      // Primary
      'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium hover:shadow-strong hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500': variant === 'primary',
      
      // Secondary
      'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-medium hover:shadow-strong hover:from-secondary-600 hover:to-secondary-700 focus:ring-secondary-500': variant === 'secondary',
      
      // Outline
      'border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-500 shadow-soft': variant === 'outline',
      
      // Ghost
      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
      
      // Gradient
      'bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 text-white shadow-glow hover:shadow-glow-lg focus:ring-primary-500 animate-shimmer bg-[length:200%_100%]': variant === 'gradient',
      
      // Glass
      'bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 hover:bg-white/30 shadow-soft hover:shadow-medium focus:ring-white/50': variant === 'glass',
    },
    
    // Full width
    {
      'w-full': fullWidth,
    },
    
    className
  );

  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <div className={cn('flex items-center gap-inherit', { 'opacity-0': isLoading })}>
        {LeftIcon && <LeftIcon className="w-4 h-4" />}
        {children}
        {RightIcon && <RightIcon className="w-4 h-4" />}
      </div>
    </button>
  );
};

export default ModernButton;