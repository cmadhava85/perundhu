import React from 'react';
import { colors, spacing, borderRadius, shadows } from '../tokens';
import './Card.css';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card visual style */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Clickable card */
  interactive?: boolean;
  /** Selected state */
  isSelected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Children */
  children: React.ReactNode;
}

/**
 * Modern Card Component
 * - Multiple variants for different elevations
 * - Interactive states for clickable cards
 * - Accessible with proper ARIA attributes
 * - Responsive padding options
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      isSelected = false,
      disabled = false,
      children,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles: React.CSSProperties = {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      transition: 'all 250ms ease',
      position: 'relative',
      overflow: 'hidden',
    };

    // Padding styles
    const paddingMap: Record<CardPadding, string> = {
      none: '0',
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    };

    // Variant styles
    const variantStylesMap: Record<CardVariant, React.CSSProperties> = {
      default: {
        boxShadow: shadows.base,
        border: 'none',
      },
      elevated: {
        boxShadow: shadows.lg,
        border: 'none',
      },
      outlined: {
        boxShadow: 'none',
        border: `1px solid ${colors.border.default}`,
      },
      filled: {
        boxShadow: 'none',
        backgroundColor: colors.background.secondary,
        border: 'none',
      },
    };

    // Interactive styles
    const interactiveStyles: React.CSSProperties = interactive
      ? {
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }
      : {};

    // Selected styles
    const selectedStyles: React.CSSProperties = isSelected
      ? {
          borderColor: colors.primary[500],
          borderWidth: '2px',
          borderStyle: 'solid',
          boxShadow: `0 0 0 4px ${colors.primary[50]}`,
        }
      : {};

    // Disabled styles
    const disabledStyles: React.CSSProperties = disabled
      ? {
          opacity: 0.5,
          pointerEvents: 'none',
        }
      : {};

    const combinedStyles = {
      ...baseStyles,
      ...variantStylesMap[variant],
      ...interactiveStyles,
      ...selectedStyles,
      ...disabledStyles,
      padding: paddingMap[padding],
    };

    return (
      <div
        ref={ref}
        className={`ds-card ds-card-${variant} ${interactive ? 'ds-card-interactive' : ''} ${
          isSelected ? 'ds-card-selected' : ''
        } ${className}`}
        style={combinedStyles}
        onClick={!disabled && interactive ? onClick : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !disabled ? 0 : undefined}
        aria-disabled={disabled}
        aria-pressed={interactive && isSelected ? true : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
