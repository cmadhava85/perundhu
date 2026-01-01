# Perundhu Design System

A modern, accessible, and mobile-first design system for the Perundhu transit app.

## 🎨 Features

- **TypeScript-first**: Full type safety for all tokens and components
- **Accessible**: WCAG AA compliant, keyboard navigable, screen reader friendly
- **Mobile-optimized**: 44×44px minimum touch targets, responsive sizing
- **Dark mode ready**: All components support dark mode
- **Performance**: Optimized animations, lazy loading support
- **Modern patterns**: Skeleton screens, micro-interactions, bottom sheets

---

## 📦 Structure

```
design-system/
├── tokens/          # Design tokens (colors, typography, spacing, motion)
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── motion.ts
│   └── index.ts
├── components/      # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Skeleton.tsx
│   └── index.ts
└── index.ts         # Main export
```

---

## 🚀 Usage

### Import Tokens

```tsx
import { colors, spacing, typography } from '@/design-system/tokens';

const styles = {
  color: colors.primary[500],
  padding: spacing[4],
  fontSize: typography.fontSize.base,
};
```

### Use Components

```tsx
import { Button, Card, Skeleton } from '@/design-system';

// Primary button
<Button variant="primary" size="lg">
  Find Buses
</Button>

// Card with content
<Card variant="elevated" padding="md">
  <h3>Bus Information</h3>
  <p>Details here...</p>
</Card>

// Loading skeleton
<Skeleton width="100%" height="48px" animation="wave" />
```

---

## 🎨 Design Tokens

### Colors

```tsx
// Primary colors (Teal/Cyan theme)
colors.primary[500]   // #14B8A6 - Main brand color
colors.secondary[500] // #0EA5E9 - Active states

// Status colors
colors.success[500]   // #10B981 - On-time
colors.warning[500]   // #F59E0B - Delayed
colors.error[500]     // #EF4444 - Cancelled

// Gradients
gradients.primary     // Teal gradient
gradients.secondary   // Cyan gradient
```

### Typography

```tsx
// Font sizes
typography.fontSize.xs    // 12px
typography.fontSize.base  // 16px
typography.fontSize['2xl'] // 24px

// Text styles (composite tokens)
textStyles.h1         // Heading 1
textStyles.body       // Body text
textStyles.label      // Labels
```

### Spacing

```tsx
// Base spacing (4px increments)
spacing[1]  // 4px
spacing[4]  // 16px
spacing[8]  // 32px

// Component spacing
componentSpacing.touchTarget.md  // 44px (minimum)
componentSpacing.card.padding.md // 24px
```

### Motion

```tsx
// Durations
duration.fast  // 200ms
duration.base  // 300ms

// Easings
easing.standard    // cubic-bezier(0.4, 0.0, 0.2, 1)
easing.emphasized  // For important transitions

// Transitions
transitions.all  // All properties
transitions.transform  // Transform only
```

---

## 🧩 Components

### Button

Multiple variants for different contexts:

```tsx
// Primary action
<Button variant="primary" size="lg" startIcon="🔍">
  Find Buses
</Button>

// Secondary action
<Button variant="secondary">
  Share Route
</Button>

// Outline button
<Button variant="outline">
  Filters
</Button>

// Ghost button (minimal)
<Button variant="ghost">
  Cancel
</Button>

// Danger action
<Button variant="danger">
  Delete
</Button>

// Loading state
<Button isLoading>
  Searching...
</Button>

// Full width
<Button fullWidth>
  Continue
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' (40px) | 'md' (44px) | 'lg' (56px)
- `isLoading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean
- `startIcon`: ReactNode
- `endIcon`: ReactNode

---

### Card

Container component with multiple variants:

```tsx
// Default card
<Card padding="md">
  <h3>Bus 138A</h3>
  <p>Coimbatore → Chennai</p>
</Card>

// Elevated (more shadow)
<Card variant="elevated">
  Content
</Card>

// Outlined (border, no shadow)
<Card variant="outlined">
  Content
</Card>

// Interactive card
<Card interactive isSelected={selected} onClick={handleClick}>
  Clickable content
</Card>

// No padding
<Card padding="none">
  Full bleed content
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' | 'filled'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `interactive`: boolean - Makes card clickable
- `isSelected`: boolean - Shows selected state
- `disabled`: boolean

---

### Skeleton

Loading placeholders for better perceived performance:

```tsx
// Text skeleton
<Skeleton width="200px" height="1em" variant="text" />

// Circular (for avatars)
<Skeleton width="48px" variant="circular" />

// Rectangular (for images, cards)
<Skeleton width="100%" height="200px" />

// Pulse animation
<Skeleton animation="pulse" />

// Wave animation (default)
<Skeleton animation="wave" />

// Multiple skeletons
<SkeletonGroup spacing={4}>
  <Skeleton width="100%" height="24px" />
  <Skeleton width="80%" height="16px" />
  <Skeleton width="60%" height="16px" />
</SkeletonGroup>

// Bus card skeleton
<BusCardSkeleton />
```

**Props:**
- `width`: string | number
- `height`: string | number
- `variant`: 'text' | 'circular' | 'rectangular'
- `animation`: 'pulse' | 'wave' | 'none'
- `radius`: 'sm' | 'md' | 'lg' | 'full'

---

## ♿ Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: 2px outlines with 4px offset
- **Color Contrast**: Minimum 4.5:1 for normal text
- **Touch Targets**: Minimum 44×44px on mobile
- **ARIA Labels**: Proper labels for screen readers
- **Semantic HTML**: Correct use of HTML elements

---

## 📱 Mobile Optimization

- Touch targets: 44×44px minimum (iOS/Android guidelines)
- Responsive font sizes with `clamp()`
- Safe area insets for notched devices
- Touch feedback animations
- Bottom sheets instead of modals

---

## 🌙 Dark Mode

All tokens include dark mode values:

```tsx
import { darkColors } from '@/design-system/tokens';

// Use CSS variables or check prefers-color-scheme
@media (prefers-color-scheme: dark) {
  background: darkColors.background.primary;
  color: darkColors.text.primary;
}
```

---

## 🎯 Best Practices

### DO ✅

- Use design tokens instead of hardcoded values
- Maintain 44×44px minimum touch targets
- Add loading states for async actions
- Use skeleton screens for better perceived performance
- Test with keyboard navigation
- Test with screen readers
- Support dark mode

### DON'T ❌

- Hardcode colors, spacing, or font sizes
- Create touch targets smaller than 40px
- Show blank screens while loading
- Rely only on color to convey information
- Ignore keyboard users
- Forget ARIA labels on icon buttons

---

## 🔄 Migration Guide

### From Old Styles to Design System

**Before:**
```tsx
<button 
  style={{
    background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
    padding: '16px 24px',
    borderRadius: '16px',
  }}
>
  Click me
</button>
```

**After:**
```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```

---

## 📊 Performance

- **Tree-shakeable**: Only import what you use
- **Optimized animations**: 60fps on mobile
- **Small bundle size**: ~5KB gzipped
- **CSS-in-JS**: Scoped styles, no conflicts

---

## 🛠️ Extending the System

### Add New Color

```ts
// tokens/colors.ts
export const colors = {
  // ... existing colors
  
  // Add new color
  customPurple: {
    500: '#7C3AED',
    600: '#6D28D9',
  },
} as const;
```

### Create New Component

```tsx
// components/NewComponent.tsx
import React from 'react';
import { colors, spacing } from '../tokens';

export const NewComponent: React.FC<Props> = (props) => {
  // Implementation
};
```

---

## 📚 Resources

- [Material Design 3](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

**Version:** 1.0.0  
**Last Updated:** December 29, 2024
