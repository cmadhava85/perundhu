import React from 'react';
import { colors, gradients, spacing, borderRadius, shadows, textStyles, transitions, typography } from '../tokens';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'default' | 'icon-only';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button shape (default or icon-only) */
  shape?: ButtonShape;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before text */
  startIcon?: React.ReactNode;
  /** Icon after text */
  endIcon?: React.ReactNode;
  /** Children */
  children?: React.ReactNode;
}

/**
 * Modern Button Component
 * - Multiple variants for different contexts
 * - Accessible with ARIA labels
 * - Touch-optimized sizes (44px+ touch targets)
 * - Loading states with spinner
 * - Icon support
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'default',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      startIcon,
      endIcon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isIconOnly = shape === 'icon-only' || (!children && (startIcon || endIcon));
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      border: 'none',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      fontWeight: textStyles.labelLarge.fontWeight,
      transition: transitions.all,
      position: 'relative',
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
      fontFamily: typography.fontFamily.primary,
    };

    // Size-specific styles
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        height: '40px',
        minHeight: '40px',
        padding: isIconOnly ? '0' : `0 ${spacing[4]}`,
        width: isIconOnly ? '40px' : 'auto',
        fontSize: textStyles.labelSmall.fontSize,
        borderRadius: borderRadius.md,
      },
      md: {
        height: '44px',
        minHeight: '44px',
        padding: isIconOnly ? '0' : `0 ${spacing[6]}`,
        width: isIconOnly ? '44px' : 'auto',
        fontSize: textStyles.label.fontSize,
        borderRadius: borderRadius.lg,
      },
      lg: {
        height: '56px',
        minHeight: '56px',
        padding: isIconOnly ? '0' : `0 ${spacing[8]}`,
        width: isIconOnly ? '56px' : 'auto',
        fontSize: textStyles.labelLarge.fontSize,
        borderRadius: borderRadius.xl,
      },
      xl: {
        height: '64px',
        minHeight: '64px',
        padding: isIconOnly ? '0' : `0 ${spacing[10]}`,
        width: isIconOnly ? '64px' : 'auto',
        fontSize: '18px',
        fontWeight: 700,
        borderRadius: borderRadius['2xl'],
      },
    };

    // Variant-specific styles
    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        background: gradients.primary,
        color: colors.text.inverse,
        boxShadow: shadows.primary,
      },
      secondary: {
        background: gradients.secondary,
        color: colors.text.inverse,
        boxShadow: shadows.secondary,
      },
      outline: {
        background: 'transparent',
        color: colors.primary[600],
        border: `2px solid ${colors.primary[500]}`,
      },
      ghost: {
        background: 'transparent',
        color: colors.primary[600],
      },
      danger: {
        background: gradients.error,
        color: colors.text.inverse,
        boxShadow: shadows.error,
      },
    };

    const combinedStyles = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`ds-button ds-button-${variant} ds-button-${size} ${className}`}
        style={combinedStyles}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <span className="ds-button-spinner" aria-label="Loading">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-spin"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="8"
                opacity="0.3"
              />
            </svg>
          </span>
        )}
        
        {!isLoading && startIcon && (
          <span className="ds-button-icon ds-button-start-icon">{startIcon}</span>
        )}
        
        {children && <span className="ds-button-text">{children}</span>}
        
        {!isLoading && endIcon && (
          <span className="ds-button-icon ds-button-end-icon">{endIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
