import React from 'react';
import '../styles/modern-ria-system.css';

interface RIALayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'surface';
  animation?: 'fade-in' | 'slide-in-left' | 'scale-in' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * RIA Layout Component
 * Provides consistent layout patterns with modern RIA styling
 */
const RIALayout: React.FC<RIALayoutProps> = ({
  children,
  className = '',
  variant = 'surface',
  animation = 'fade-in',
  padding = 'lg',
  gap = 'md'
}) => {
  const baseClasses = 'ria-layout';
  const variantClasses = {
    default: '',
    glass: 'ria-glass',
    surface: 'ria-card'
  };
  
  const animationClasses = {
    'fade-in': 'ria-fade-in',
    'slide-in-left': 'ria-slide-in-left',
    'scale-in': 'ria-scale-in',
    'none': ''
  };
  
  const paddingClasses = {
    none: '',
    sm: 'ria-p-sm',
    md: 'ria-p-md',
    lg: 'ria-p-lg',
    xl: 'ria-p-xl',
    '2xl': 'ria-p-2xl'
  };
  
  const gapClasses = {
    none: '',
    sm: 'ria-gap-sm',
    md: 'ria-gap-md',
    lg: 'ria-gap-lg',
    xl: 'ria-gap-xl'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    animationClasses[animation],
    paddingClasses[padding],
    gapClasses[gap],
    'ria-flex ria-flex-col',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default RIALayout;