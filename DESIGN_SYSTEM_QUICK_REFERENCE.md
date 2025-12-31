# 🎨 Modern Design System - Quick Reference Guide

## Color System

### Primary Colors
```css
Primary Cyan: #0EA5E9 (use for main CTAs, highlights)
Primary Dark: #06B6D4 (use for hover/active states)
```

### Secondary Colors
```css
Secondary Green: #10B981 (use for success, positive states)
Secondary Dark: #059669 (use for hover/active green states)
```

### Usage in Components
```jsx
// Tailwind classes
<button className="bg-primary-500 hover:bg-primary-600">Primary</button>
<button className="bg-secondary-500 hover:bg-secondary-600">Secondary</button>

// Or CSS
<button style={{background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)'}}>
  Gradient Button
</button>
```

---

## Glassmorphism Effects

### Basic Glass Container
```jsx
<div className="glass rounded-2xl p-6">
  Glassmorphic content
</div>
```

### Glass Card (with shadows and hover)
```jsx
<div className="glass-card">
  <h3>Card Title</h3>
  <p>Automatically includes blur, shadow, hover lift effect</p>
</div>
```

### Glass Input
```jsx
<input className="glass-input" type="text" placeholder="Enter text..." />
```

### Sizes
- `.glass-sm` - Light glass (blur 10px)
- `.glass` - Medium glass (blur 20px) ← Most common
- `.glass-lg` - Heavy glass (blur 30px)

---

## Animated Backgrounds

### Cyan Gradient Animation (15 seconds)
```jsx
<div className="gradient-bg min-h-screen">
  {/* Automatically animated cyan gradient background */}
</div>
```

### Green Gradient Animation
```jsx
<div className="gradient-bg-green p-8">
  {/* Animated green gradient */}
</div>
```

### With Floating Particles
```jsx
<div className="gradient-bg floating-particles">
  {/* Gradient + floating particle effects */}
</div>
```

---

## Button Styles

### Gradient Primary Button
```jsx
<button className="bg-gradient-to-r from-primary-500 to-primary-600 
                   text-white px-6 py-3 rounded-lg 
                   shadow-glass hover:shadow-glass-lg 
                   hover:-translate-y-1 transition-all">
  Primary Button
</button>
```

### Gradient Secondary Button
```jsx
<button className="bg-gradient-to-r from-secondary-500 to-secondary-600 
                   text-white px-6 py-3 rounded-lg 
                   shadow-glass hover:shadow-glass-lg 
                   hover:-translate-y-1 transition-all">
  Secondary Button
</button>
```

### Glass Button
```jsx
<button className="glass text-primary-600 font-semibold 
                   hover:bg-primary-100 transition-colors">
  Glass Button
</button>
```

---

## Card Components

### Standard Card
```jsx
<div className="glass-card">
  <h2 className="text-lg font-semibold">Card Title</h2>
  <p>Card content goes here</p>
</div>
```

### Transit Bus Card (Auto-styled)
```jsx
<div className="transit-bus-card">
  {/* Includes: shimmer, hover lift, gradient badges */}
</div>
```

### Highlighted Card
```jsx
<div className="glass-card glow-primary">
  {/* Card with glow effect */}
</div>
```

---

## Typography

### Gradient Text
```jsx
<h1 className="gradient-text-primary">
  Cyan Gradient Text
</h1>

<h2 className="gradient-text-secondary">
  Green Gradient Text
</h2>
```

### Using CSS Variables
```css
color: var(--primary-color); /* #0EA5E9 */
color: var(--secondary-color); /* #10B981 */
```

---

## Shadows

### Standard Shadows
```css
box-shadow: var(--shadow-sm);   /* Subtle */
box-shadow: var(--shadow-md);   /* Normal */
box-shadow: var(--shadow-lg);   /* Prominent */
box-shadow: var(--shadow-xl);   /* Heavy */
```

### Glassmorphism Shadows
```css
box-shadow: var(--shadow-glass);    /* Standard glass */
box-shadow: var(--shadow-glass-lg); /* Large glass */
```

### Glow Effects
```css
box-shadow: var(--shadow-glow);    /* Cyan glow */
box-shadow: var(--shadow-glow-lg); /* Large cyan glow */
```

### Tailwind Classes
```jsx
<div className="shadow-glass">Standard glass shadow</div>
<div className="shadow-glass-lg">Large glass shadow</div>
<div className="shadow-glow">Cyan glow</div>
<div className="shadow-glow-lg">Large cyan glow</div>
```

---

## Animations

### Hover Lift (Translate Y)
```jsx
<div className="lift-on-hover">
  {/* Automatically lifts on hover with shadow boost */}
</div>
```

### Scale on Hover
```jsx
<div className="scale-on-hover">
  {/* Scales up 2% on hover */}
</div>
```

### Shimmer Effect
```jsx
<div className="transit-bus-card">
  {/* Includes shimmer effect automatically */}
</div>
```

### Available Animations (Tailwind)
```jsx
<div className="animate-gradient-shift">15s gradient animation</div>
<div className="animate-float-lg">20s floating animation</div>
<div className="animate-pulse-md">2s pulse animation</div>
<div className="animate-fade-in">Fade in effect</div>
<div className="animate-slide-down">Slide down effect</div>
```

---

## Responsive Design

### Mobile-First Approach
```jsx
// Mobile (default) → Tablet → Desktop
<div className="px-4 md:px-8 lg:px-12">
  {/* Responsive padding */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive text size */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

### Breakpoints
- `xs`: 360px (small phones)
- `sm`: 640px (landscape phones)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops)
- `xl`: 1280px (large desktops)
- `2xl`: 1536px (extra large)

---

## Accessibility

### Dark Mode
```jsx
// Automatically respects prefers-color-scheme: dark
// Components use dark backgrounds and adjusted opacity
```

### High Contrast Mode
```jsx
// Automatically respects prefers-contrast: high
// Borders become thicker, colors more distinct
```

### Reduced Motion
```jsx
// Automatically respects prefers-reduced-motion: reduce
// All animations are disabled
```

### Touch Targets
- Minimum size: 44px height/width
- Recommended: 48px
- Large actions: 56px

---

## Form Elements

### Glass Input Field
```jsx
<input 
  type="text" 
  className="glass-input"
  placeholder="Enter text..."
/>
```

### Focus State
```css
/* Automatically applied with .glass-input */
border-color: #0EA5E9;
box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
background: white;
```

### Form Label
```jsx
<label className="block text-sm font-medium mb-2">
  Label Text
</label>
<input className="glass-input w-full" type="text" />
```

---

## Badge Styles

### Gradient Badges
```jsx
// Primary
<span className="badge-gradient-primary">Primary</span>

// Secondary
<span className="badge-gradient-secondary">Success</span>
```

### Outline Badges
```jsx
// Primary outline
<span className="badge-outline-primary">Info</span>

// Secondary outline
<span className="badge-outline-secondary">Done</span>
```

---

## Common Patterns

### Modal/Dialog
```jsx
<div className="gradient-bg fixed inset-0 flex items-center justify-center">
  <div className="glass-card w-full max-w-md">
    <h2>Modal Title</h2>
    <p>Modal content</p>
    <button className="bg-primary-500 text-white mt-4">Action</button>
  </div>
</div>
```

### Card Grid
```jsx
<div className="gradient-bg p-8 min-h-screen">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Multiple glass-card components */}
  </div>
</div>
```

### Header with Glassmorphism
```jsx
<header className="sticky top-0 z-50 bg-gradient-to-r from-primary-500 to-primary-600 
                   backdrop-blur-lg shadow-glass">
  {/* Header content automatically styled */}
</header>
```

---

## CSS Variables Reference

```css
/* Colors */
--primary-color: #0EA5E9;
--primary-dark: #06B6D4;
--secondary-color: #10B981;
--secondary-dark: #059669;

/* Glassmorphism */
--glass-blur: blur(20px) saturate(180%);
--glass-bg: rgba(255, 255, 255, 0.1);
--glass-border: 1px solid rgba(255, 255, 255, 0.3);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Tips & Best Practices

1. **Always use gradient buttons for primary CTAs** - Creates visual hierarchy
2. **Use glass-card for information containers** - Modern, approachable look
3. **Apply lift-on-hover to interactive elements** - Gives tactile feedback
4. **Keep motion smooth** - 0.3s-0.4s durations feel natural
5. **Test dark mode** - Many components adjust automatically
6. **Mobile first** - Start with single-column layouts
7. **Use color sparingly** - Let the design system do the work
8. **Maintain whitespace** - Don't overcrowd glassmorphic surfaces

---

**Last Updated:** December 30, 2025
**Design System Version:** 1.0
**Status:** ✅ Production Ready
