# Design Reference - CSS Values & Specifications

## Color Palette

### Primary Colors
```css
--primary-blue: #0EA5E9;
--primary-cyan: #06B6D4;
--success-green: #10B981;
--success-dark: #059669;
```

### Text Colors
```css
--text-primary: #111827;
--text-secondary: #374151;
--text-tertiary: #6B7280;
--text-light: #9CA3AF;
--text-disabled: #D1D5DB;
```

### Border & Background Colors
```css
--border-light: rgba(255, 255, 255, 0.3);
--border-lighter: rgba(255, 255, 255, 0.2);
--border-blue: rgba(14, 165, 233, 0.3);
--bg-white: rgba(255, 255, 255, 0.95);
--bg-light: rgba(255, 255, 255, 0.7);
--bg-lighter: rgba(255, 255, 255, 0.5);
```

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Scale
| Use Case | Size | Weight |
|----------|------|--------|
| Card Labels | 15px | 600 |
| Section Titles | 15px | 700 |
| Input Labels | 14px | 600 |
| Body Text | 15px | 400 |
| Hints | 12px | 400 |
| Emphasis | 13px | 600 |

---

## Spacing

### Padding Scale
```css
Minimal:    8px / 12px
Small:      16px
Standard:   20px / 24px
Large:      28px / 32px
Extra:      40px
```

### Gap Scale
```css
Compact:    10px
Small:      12px
Standard:   16px
Large:      20px
Extra:      24px
```

### Margin Scale
```css
Small:      8px
Standard:   12px / 16px
Large:      20px / 24px
Extra:      32px
```

---

## Border Radius

```css
.small-radius:    4px / 8px
.default-radius:  12px / 16px
.large-radius:    20px / 24px
.pill-radius:     2rem (32px+)
```

### Component-Specific
```css
.method-chip:      16px
.form-container:   24px
.input-field:      16px
.button:           16px
.card:             24px
```

---

## Shadow System

### Level 1 (Subtle)
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

### Level 2 (Standard)
```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
```

### Level 3 (Prominent)
```css
box-shadow: 0 12px 32px rgba(14, 165, 233, 0.35);
```

### Level 4 (Elevated)
```css
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
```

### Level 5 (Floating)
```css
box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
```

---

## Gradients

### Blue Gradient (Primary)
```css
background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
```

### Green Gradient (Success)
```css
background: linear-gradient(135deg, #10B981 0%, #059669 100%);
```

### Glass Morphism
```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
backdrop-filter: blur(10px);
```

### Shimmer Effect
```css
background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
```

### Subtle Gradient
```css
background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.15));
```

---

## Transitions & Animations

### Standard Easing
```css
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Quick Easing
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Property-Specific
```css
/* Colors */
transition: color 0.3s ease;

/* Transforms */
transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* Shadows */
transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* Opacity */
transition: opacity 0.3s ease;
```

### Shimmer Animation
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

animation: shimmer 0.5s infinite;
```

---

## Interactive States

### Button States
```css
/* Default */
background: rgba(255, 255, 255, 0.7);
border: 2px solid rgba(14, 165, 233, 0.3);
transform: scale(1);

/* Hover */
background: linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(6, 182, 212, 0.25));
border-color: #0EA5E9;
transform: translateY(-8px) scale(1.05);
box-shadow: 0 12px 32px rgba(14, 165, 233, 0.35);

/* Active/Focus */
background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
box-shadow: 0 12px 32px rgba(14, 165, 233, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
color: white;

/* Disabled */
background: #D1D5DB;
color: #9CA3AF;
cursor: not-allowed;
opacity: 0.6;
```

### Input States
```css
/* Default */
border: 2px solid rgba(255, 255, 255, 0.3);
background: rgba(255, 255, 255, 0.5);

/* Hover */
background: rgba(255, 255, 255, 0.7);
border-color: #BFDBFE;

/* Focus */
border-color: #0EA5E9;
background: white;
box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2),
            0 8px 24px rgba(14, 165, 233, 0.15);
transform: translateY(-2px);
```

---

## Component-Specific Values

### Method Chip Card
```css
.method-chip {
  /* Layout */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  /* Sizing */
  padding: 24px;
  min-height: 140px;
  border-radius: 16px;
  
  /* Styling */
  border: 2px solid rgba(14, 165, 233, 0.3);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(10px);
  
  /* Effects */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

/* Desktop */
@media (min-width: 768px) {
  .method-chip {
    padding: 28px;
    min-height: 160px;
  }
  .chip-icon {
    font-size: 40px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .method-chip {
    padding: 16px;
    min-height: 120px;
  }
  .chip-icon {
    font-size: 32px;
  }
}
```

### Form Container
```css
.unified-route-form {
  /* Sizing */
  max-width: 100%;
  padding: 32px 24px;
  
  /* Styling */
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  
  /* Glass Effect */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* Shadows */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  
  /* Effects */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.unified-route-form:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```

### Submit Button
```css
.submit-btn {
  /* Layout */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  /* Sizing */
  padding: 16px;
  min-height: 52px;
  border-radius: 16px;
  
  /* Styling */
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 700;
  
  /* Effects */
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(16, 185, 129, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.submit-btn:active {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #D1D5DB;
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Input Field
```css
.input-field {
  /* Sizing */
  width: 100%;
  padding: 14px 16px;
  
  /* Styling */
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  
  /* Typography */
  font-size: 15px;
  color: #111827;
  font-family: inherit;
  
  /* Effects */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-field:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: #BFDBFE;
}

.input-field:focus {
  outline: none;
  border-color: #0EA5E9;
  background: white;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2),
              0 8px 24px rgba(14, 165, 233, 0.15);
  transform: translateY(-2px);
}
```

---

## Icon Specifications

### Sizing Scale
```
Mobile:   28px - 32px
Standard: 36px
Desktop:  40px+
```

### Icon Set
```
Image:    📸
Voice:    🎤
Text:     ✍️
Paste:    📋
Verify:   ✅
Success:  ✓
```

### Styling
```css
.chip-icon {
  font-size: 36px;
  line-height: 1;
  display: block;
}

.method-chip.active .chip-icon {
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.5));
}
```

---

## Responsive Breakpoints

```css
/* Extra Small */
@media (max-width: 400px) {
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px;
  icon-size: 28px;
}

/* Small */
@media (max-width: 640px) {
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  icon-size: 32px;
}

/* Medium */
@media (max-width: 768px) {
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px;
  icon-size: 36px;
}

/* Large */
@media (min-width: 768px) {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  padding: 28px;
  icon-size: 40px;
}
```

---

## Z-Index Scale

```css
.sticky-header:    1000
.modal-backdrop:   1010
.modal:            1020
.dropdown:         1030
.tooltip:          1040
.notification:     1050
```

---

## Performance Optimizations

### GPU Acceleration
```css
/* Transforms use GPU */
transform: translate(-8px);
transform: scale(1.05);
will-change: transform;
```

### Smooth Animations
```css
/* Use transitions instead of animations */
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* Avoid layout thrashing */
/* No frequent reflows/repaints */
```

---

## Browser Support

### Modern CSS Features
- ✅ CSS Grid & Flexbox
- ✅ CSS Transforms
- ✅ CSS Transitions
- ✅ CSS Gradients
- ✅ Backdrop Filter (with -webkit- prefix)
- ✅ Box Shadow (multiple)
- ✅ RGB/RGBA colors

### Fallbacks
```css
/* Fallback for backdrop-filter */
@supports not (backdrop-filter: blur(10px)) {
  background: rgba(255, 255, 255, 0.9);
}
```

---

## Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Primary Color | #0EA5E9 | Buttons, links, highlights |
| Secondary Color | #06B6D4 | Gradients, accents |
| Success Color | #10B981 | Positive actions |
| Text Primary | #111827 | Main text |
| Text Secondary | #374151 | Secondary text |
| Border | rgba(255,255,255,0.3) | Frosted borders |
| Shadow | cubic-bezier(0.4,0,0.2,1) | Smooth easing |
| Radius | 16px | Default border radius |
| Padding | 24px | Default spacing |

---

**Last Updated**: December 30, 2025
**Version**: 1.0
