/**
 * Design System - Animation & Transition Tokens
 * Based on Material Design motion principles
 * Optimized for perceived performance
 */

// Duration (in milliseconds)
export const duration = {
  instant: 0,
  fastest: 100,
  faster: 150,
  fast: 200,
  base: 300,
  slow: 400,
  slower: 500,
  slowest: 700,
} as const;

// Easing functions (cubic-bezier)
export const easing = {
  // Standard easing
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  // Emphasized easing (for important transitions)
  emphasized: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  
  // Legacy easing (Material Design 2)
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  
  // Other common easings
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  
  // Spring-like easings
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Predefined transitions
export const transitions = {
  // Common transitions
  fast: `${duration.fast}ms ${easing.standard}`,
  base: `${duration.base}ms ${easing.standard}`,
  slow: `${duration.slow}ms ${easing.standard}`,
  
  // Property-specific transitions
  color: `color ${duration.fast}ms ${easing.standard}`,
  background: `background-color ${duration.fast}ms ${easing.standard}`,
  border: `border-color ${duration.fast}ms ${easing.standard}`,
  opacity: `opacity ${duration.fast}ms ${easing.standard}`,
  transform: `transform ${duration.base}ms ${easing.emphasized}`,
  shadow: `box-shadow ${duration.base}ms ${easing.standard}`,
  
  // All properties
  all: `all ${duration.base}ms ${easing.standard}`,
} as const;

// Animations (keyframes)
export const animations = {
  // Fade animations
  fadeIn: {
    name: 'fadeIn',
    duration: duration.base,
    easing: easing.easeOut,
    keyframes: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  fadeOut: {
    name: 'fadeOut',
    duration: duration.base,
    easing: easing.easeIn,
    keyframes: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
  },
  
  // Slide animations
  slideUp: {
    name: 'slideUp',
    duration: duration.base,
    easing: easing.emphasized,
    keyframes: {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  slideDown: {
    name: 'slideDown',
    duration: duration.base,
    easing: easing.emphasized,
    keyframes: {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  },
  
  // Scale animations
  scaleIn: {
    name: 'scaleIn',
    duration: duration.fast,
    easing: easing.emphasized,
    keyframes: {
      from: { transform: 'scale(0.9)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
  },
  scaleOut: {
    name: 'scaleOut',
    duration: duration.fast,
    easing: easing.emphasized,
    keyframes: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.9)', opacity: 0 },
    },
  },
  
  // Pulse animation (for loading, attention)
  pulse: {
    name: 'pulse',
    duration: duration.slower,
    easing: easing.easeInOut,
    keyframes: {
      '0%, 100%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
    },
  },
  
  // Shimmer animation (for skeleton screens)
  shimmer: {
    name: 'shimmer',
    duration: 2000,
    easing: 'linear',
    keyframes: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  },
  
  // Spin animation (for loading spinners)
  spin: {
    name: 'spin',
    duration: duration.slowest,
    easing: 'linear',
    keyframes: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },
  
  // Bounce animation (for success states)
  bounce: {
    name: 'bounce',
    duration: duration.slowest,
    easing: easing.bounce,
    keyframes: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-8px)' },
    },
  },
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type TransitionToken = keyof typeof transitions;
export type AnimationToken = keyof typeof animations;
