import React, { useState, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'minimal';
  isLoading?: boolean;
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  size = 'md',
  variant = 'default',
  isLoading = false,
  type = 'text',
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const containerClasses = cn(
    'relative',
    className
  );

  const inputClasses = cn(
    // Base styles
    'w-full rounded-xl border transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
    
    // Size variants
    size === 'sm' && 'px-3 py-2 text-sm',
    size === 'md' && 'px-4 py-3 text-base',
    size === 'lg' && 'px-5 py-4 text-lg',
    
    // Icon padding adjustments
    LeftIcon && size === 'sm' && 'pl-10',
    LeftIcon && size === 'md' && 'pl-11',
    LeftIcon && size === 'lg' && 'pl-12',
    (RightIcon || isPassword) && size === 'sm' && 'pr-10',
    (RightIcon || isPassword) && size === 'md' && 'pr-11',
    (RightIcon || isPassword) && size === 'lg' && 'pr-12',
    
    // Variant styles
    variant === 'default' && !error && 'bg-white border-gray-200 focus:border-primary-500 focus:ring-primary-500/20',
    variant === 'glass' && !error && 'bg-white/20 backdrop-blur-md border-white/30 focus:border-white/50 focus:ring-white/20 placeholder:text-gray-600',
    variant === 'minimal' && !error && 'bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500/20',
    
    // Error state
    error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
    
    // Loading state
    isLoading && size === 'sm' && 'pr-10',
    isLoading && size === 'md' && 'pr-11',
    isLoading && size === 'lg' && 'pr-12'
  );

  const iconClasses = cn(
    'absolute top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200',
    size === 'sm' && 'w-4 h-4',
    size === 'md' && 'w-5 h-5',
    size === 'lg' && 'w-6 h-6',
    isFocused && !error && 'text-primary-500',
    error && 'text-error-500'
  );

  const leftIconClasses = cn(
    iconClasses,
    size === 'sm' && 'left-3',
    size === 'md' && 'left-3',
    size === 'lg' && 'left-4'
  );

  const rightIconClasses = cn(
    iconClasses,
    size === 'sm' && 'right-3',
    size === 'md' && 'right-3',
    size === 'lg' && 'right-4'
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className={leftIconClasses} />
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isLoading && (
          <div className={rightIconClasses}>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
        
        {isPassword && !isLoading && (
          <button
            type="button"
            className={cn(rightIconClasses, 'cursor-pointer hover:text-gray-600')}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        )}
        
        {RightIcon && !isPassword && !isLoading && (
          <RightIcon className={rightIconClasses} />
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="w-4 h-4 text-error-500" />
          <span className="text-sm text-error-500">{error}</span>
        </div>
      )}
      
      {hint && !error && (
        <span className="block text-sm text-gray-500 mt-1">{hint}</span>
      )}
    </div>
  );
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;