/**
 * Design System - Spacing Tokens
 * 4px base unit with 8px grid system
 * Based on Material Design spacing scale
 */

export const spacing = {
  // Base spacing scale (4px increments)
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  7: '1.75rem',  // 28px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  14: '3.5rem',  // 56px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem',   // 256px
} as const;

// Component-specific spacing
export const componentSpacing = {
  // Touch targets (minimum sizes for mobile)
  touchTarget: {
    sm: '40px',   // Small buttons
    md: '44px',   // Standard touch target
    lg: '56px',   // Large touch target (list items)
  },

  // Container padding
  container: {
    mobile: spacing[4],   // 16px
    tablet: spacing[6],   // 24px
    desktop: spacing[8],  // 32px
  },

  // Section spacing
  section: {
    sm: spacing[8],   // 32px
    md: spacing[12],  // 48px
    lg: spacing[16],  // 64px
    xl: spacing[24],  // 96px
  },

  // Card spacing
  card: {
    padding: {
      sm: spacing[4],  // 16px
      md: spacing[6],  // 24px
      lg: spacing[8],  // 32px
    },
    gap: spacing[4],   // 16px between cards
  },

  // Stack spacing (vertical rhythm)
  stack: {
    xs: spacing[1],  // 4px
    sm: spacing[2],  // 8px
    md: spacing[4],  // 16px
    lg: spacing[6],  // 24px
    xl: spacing[8],  // 32px
  },

  // Inline spacing (horizontal rhythm)
  inline: {
    xs: spacing[1],  // 4px
    sm: spacing[2],  // 8px
    md: spacing[3],  // 12px
    lg: spacing[4],  // 16px
    xl: spacing[6],  // 24px
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  base: '0.5rem',   // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',   // Pill shape
} as const;

// Elevation / Shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  // Colored shadows (for buttons, cards)
  primary: '0 4px 12px rgba(20, 184, 166, 0.3)',
  primaryHover: '0 8px 20px rgba(20, 184, 166, 0.4)',
  secondary: '0 4px 12px rgba(14, 165, 233, 0.3)',
  error: '0 4px 12px rgba(239, 68, 68, 0.3)',
} as const;

// Z-index scale (layering)
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
} as const;

export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof shadows;
export type ZIndexToken = keyof typeof zIndex;
