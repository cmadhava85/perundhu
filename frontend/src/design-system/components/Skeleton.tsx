import React from 'react';
import { colors, borderRadius, spacing } from '../tokens';
import './Skeleton.css';

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Border radius */
  radius?: 'sm' | 'md' | 'lg' | 'full';
  /** Variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Custom class name */
  className?: string;
}

/**
 * Skeleton Loader Component
 * - Shows loading placeholder
 * - Multiple variants (text, circular, rectangular)
 * - Smooth shimmer animation
 * - Improves perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius = 'md',
  variant = 'rectangular',
  animation = 'wave',
  className = '',
}) => {
  const radiusMap = {
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    full: borderRadius.full,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      width: width || '100%',
      height: height || '1em',
      borderRadius: radiusMap[radius],
    },
    circular: {
      width: width || '40px',
      height: height || width || '40px',
      borderRadius: borderRadius.full,
    },
    rectangular: {
      width: width || '100%',
      height: height || '100px',
      borderRadius: radiusMap[radius],
    },
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: colors.neutral[200],
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden',
    ...variantStyles[variant],
  };

  return (
    <span
      className={`ds-skeleton ds-skeleton-${variant} ds-skeleton-${animation} ${className}`}
      style={baseStyles}
      aria-busy="true"
      aria-label="Loading..."
    >
      {animation === 'wave' && <span className="ds-skeleton-wave" />}
    </span>
  );
};

/**
 * Skeleton Group - For multiple skeletons with consistent spacing
 */
export const SkeletonGroup: React.FC<{
  children: React.ReactNode;
  spacing?: keyof typeof spacing;
  direction?: 'vertical' | 'horizontal';
}> = ({ children, spacing: gap = 4, direction = 'vertical' }) => {
  return (
    <div
      className="ds-skeleton-group"
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap: spacing[gap],
      }}
    >
      {children}
    </div>
  );
};

/**
 * Bus Card Skeleton - Specific skeleton for bus cards
 */
export const BusCardSkeleton: React.FC = () => {
  return (
    <div
      className="ds-bus-card-skeleton"
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <SkeletonGroup spacing={4}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonGroup spacing={2}>
            <Skeleton width="120px" height="24px" />
            <Skeleton width="80px" height="16px" />
          </SkeletonGroup>
          <Skeleton width="60px" height="32px" radius="lg" />
        </div>

        {/* Timing bar */}
        <Skeleton width="100%" height="48px" radius="lg" />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="100px" height="16px" />
          <Skeleton width="80px" height="32px" radius="lg" />
        </div>
      </SkeletonGroup>
    </div>
  );
};

export default Skeleton;
