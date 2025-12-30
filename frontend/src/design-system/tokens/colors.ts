/**
 * Design System - Color Tokens
 * Based on Material Design 3 and iOS Human Interface Guidelines
 * WCAG AA compliant (4.5:1 contrast minimum)
 */

export const colors = {
  // Primary Brand Colors (Teal/Cyan - Transit theme)
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#14B8A6',  // Main brand color
    600: '#0D9488',  // Darker shade
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Secondary Colors (Cyan for active states)
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#0EA5E9',  // Active tab color
    600: '#06B6D4',
    700: '#0284C7',
    800: '#0369A1',
    900: '#075985',
  },

  // Status Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#10B981',  // On-time status
    600: '#059669',
    700: '#047857',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',  // Delayed status
    600: '#D97706',
    700: '#B45309',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',  // Cancelled/Error
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Neutral Colors (Optimized for light & dark mode)
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
    link: '#0EA5E9',
  },

  border: {
    default: '#E5E7EB',
    hover: '#D1D5DB',
    focus: '#14B8A6',
    error: '#EF4444',
  },

  // Interactive States
  interactive: {
    hover: 'rgba(20, 184, 166, 0.08)',
    pressed: 'rgba(20, 184, 166, 0.12)',
    disabled: '#F3F4F6',
  },
} as const;

// Dark Mode Overrides
export const darkColors = {
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
    elevated: '#1F2937',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },

  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
    disabled: '#6B7280',
    link: '#22D3EE',
  },

  border: {
    default: '#374151',
    hover: '#4B5563',
    focus: '#14B8A6',
    error: '#EF4444',
  },
} as const;

// Gradients
export const gradients = {
  primary: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
  secondary: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  shimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
} as const;

export type ColorToken = keyof typeof colors;
