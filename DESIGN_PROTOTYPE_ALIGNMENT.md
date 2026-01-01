# Design Prototype Alignment Guide

## Overview
This document provides a comprehensive alignment between design prototypes and React components to ensure the entire frontend matches the design specifications from the `design-prototype/` folder.

## Design System Specifications

### Color Palette
- **Primary**: `#14B8A6` (Teal) - Used for headers, active states
- **Primary Dark**: `#0D9488` (Dark Teal) - Gradient end points
- **Success**: `#10B981` (Green) - Success states, verification badges
- **Info**: `#3B82F6` (Blue) - GPS buttons, information
- **Warning**: `#F59E0B` (Amber) - Warning states
- **Error**: `#EF4444` (Red) - Error states, urgent badges

### Background
- **Body**: Animated blue gradient
  ```css
  background: linear-gradient(-45deg, #E0F2FE, #BAE6FD, #7DD3FC, #38BDF8);
  animation: gradientShift 15s ease infinite;
  ```

### Typography
- **Font Family**: SF Pro Display, System UI, -apple-system, BlinkMacSystemFont
- **Mobile**: 14-16px base
- **Desktop**: 16-18px base
- **Headings**: Bold/700, letter-spacing: -0.5px

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Border Radius
- **Small**: 12px
- **Medium**: 16px
- **Large**: 20-24px
- **Pill**: 999px

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px - 1280px
- **Large Desktop**: > 1280px

---

## Component Alignment Requirements

### 1. Header Component
**Prototype**: `design-prototype/components/header.html`
**React Component**: `frontend/src/components/Header.tsx`

#### Current Implementation ✅ (Already Updated)
- ✅ Teal gradient background: `#14B8A6 → #0D9488`
- ✅ White text on teal
- ✅ Sticky positioning
- ✅ Glassmorphism buttons
- ✅ Update badge with pulse animation
- ✅ Language switcher

#### Required Features
- [x] Sticky header with teal gradient
- [x] Brand logo with white background
- [x] Brand name and tagline in white
- [x] Update notification button with red badge
- [x] Language switcher with glassmorphism
- [x] Responsive: flex-wrap on mobile
- [x] Box-shadow with teal tint

---

### 2. Search Form Component
**Prototype**: `design-prototype/components/search-form.html`
**React Component**: `frontend/src/components/TransitSearchForm.tsx`

#### Current Implementation ⏳ (Partially Complete)
- ✅ Teal gradient header section
- ✅ White text on teal header
- ✅ Input fields with border-radius 16px
- ✅ GPS button with blue gradient
- ✅ Swap button with gray gradient
- ✅ Green verified badges
- ⚠️ Suggestions dropdown needs refinement
- ⚠️ Recent searches styling needs update

#### Required Features
- [x] Card with white background, 24px border-radius
- [x] Header: Teal gradient `#14B8A6 → #0D9488`
- [x] Form title and subtitle in white
- [x] Input labels with verified badges (green gradient)
- [x] GPS button: Blue gradient `#3B82F6 → #2563EB`
- [x] Input fields: 16px padding, 16px border-radius
- [x] Focus state: Teal border with glow
- [x] Swap button: Gray gradient, rotates 180° on click
- [ ] Suggestions dropdown: Refined hover states
- [ ] Recent searches: Proper animation and styling

---

### 3. Bus Card Component
**Prototype**: `design-prototype/components/bus-card.html`
**React Component**: `frontend/src/components/BusCard.tsx` (or similar)

#### Current Implementation ❌ (Needs Major Update)
- ❌ Card styling doesn't match prototype
- ❌ Missing highlight badges
- ❌ Journey timeline visualization missing
- ❌ Progress bar animation missing
- ❌ Time badges styling incorrect

#### Required Features
- [ ] White card with 20px border-radius
- [ ] Hover: translateY(-4px) + teal border
- [ ] **Highlight Row**: Green gradient background
  - Next bus badge: Green gradient `#10B981 → #059669`
  - Fastest bus badge: Blue gradient `#3B82F6 → #2563EB`
- [ ] **Bus Info Row**:
  - Bus number: Large bold text (1.25-1.5rem)
  - Bus type badges: AC (blue), Express (orange)
  - Rating: Yellow gradient background
  - Time badge: Red gradient for urgent, pulse animation
- [ ] **Journey Layout**:
  - Gray gradient background: `#F9FAFB → #F3F4F6`
  - Cities row: Start and end city names
  - Progress bar: Green to blue gradient with shimmer
  - Animated bus icon moving left to right
  - Progress dots: Green (start), Red (end)
- [ ] **Time Row**: Departure and arrival times
- [ ] **Footer**: Duration, stops count, crowding level
- [ ] **Expandable stops list**: Click to show all stops

---

### 4. Search Results Page
**Prototype**: `design-prototype/pages/search-results.html`
**React Component**: `frontend/src/components/SearchResults.tsx`

#### Current Implementation ⏳ (Partially Complete)
- ✅ Sticky header with blur backdrop
- ✅ Search actions row
- ⚠️ Filter bar needs glassmorphism effect
- ❌ Bus cards not matching prototype
- ❌ View toggle missing
- ❌ Stops list expansion not styled correctly

#### Required Features
- [x] **Sticky Header**: White with blur backdrop
  - Back button: Teal background on hover
  - Search summary: Route display
  - Search details
- [ ] **Filter Bar**: 
  - White glassmorphism card with blur
  - Filter chips: Inactive (white), Active (teal gradient)
  - Horizontal scroll on mobile
  - Touch-friendly 44px min-height
- [ ] **Results Header**:
  - Results count
  - View toggle (Grid/List)
- [ ] **Bus Grid**:
  - Proper gap spacing (20px)
  - Cards matching bus-card.html prototype
  - Expandable stops list
  - Smooth animations
- [ ] **Empty State**: Illustration and message
- [ ] **Loading State**: Skeleton cards with shimmer

---

### 5. Contribution Form
**Prototype**: `design-prototype/components/contribution-form.html`
**React Component**: `frontend/src/components/ImageContributionUpload.tsx`, `VoiceContribution.tsx`

#### Current Implementation ❌ (Needs Major Update)
- ❌ Form header not matching green gradient
- ❌ Contribution type cards missing
- ❌ Upload area styling incorrect
- ❌ Voice recorder button styling wrong

#### Required Features
- [ ] **Card**: White background, 24px border-radius
- [ ] **Header**: Green gradient `#10B981 → #059669`
  - Title and subtitle in white
  - Icon display
- [ ] **Contribution Types**:
  - Grid layout (auto-fit, min 140px)
  - Type cards: Gray gradient background
  - Active state: Blue gradient background
  - Icons: 36px size
  - Hover: translateY(-4px)
- [ ] **Form Sections**:
  - Section titles with icons
  - Input labels with required indicator
  - Input fields: 14px padding, 12px border-radius
  - Focus: Green border with glow
- [ ] **Image Upload**:
  - Dashed border area
  - Upload icon and text
  - Image preview with remove button
- [ ] **Voice Recorder**:
  - Yellow gradient background
  - Red circular button (80px)
  - Pulse animation when recording
  - Waveform visualization (optional)
- [ ] **Submit Button**: Green gradient, full width

---

### 6. Tab Navigation
**Prototype**: `design-prototype/pages/home.html` (Tab section)
**React Component**: `frontend/src/components/FeatureTabs.tsx` or `MainTabNavigation.tsx`

#### Current Implementation ⏳ (Needs Refinement)
- ⚠️ Tab styling needs glassmorphism
- ⚠️ Active tab should use teal gradient
- ❌ Tab transitions not smooth enough

#### Required Features
- [ ] **Container**: White glassmorphism with blur
  - `backdrop-filter: blur(20px)`
  - Border-radius: 24px
  - Border: 1px solid rgba(255,255,255,0.2)
- [ ] **Tabs Row**:
  - Flex layout with gap
  - Background: rgba(255,255,255,0.1)
  - Padding: 8px
- [ ] **Individual Tab**:
  - Inactive: Transparent, white text 70% opacity
  - Hover: White 20% background, full opacity
  - Active: Teal gradient `#14B8A6 → #0D9488`
  - Active shadow: Multiple layers with teal tint
  - Transform: scale(1.02) when active
  - Icon + label layout
  - Min-height: 56px
- [ ] **Tab Content**:
  - FadeIn animation
  - Display: block when active

---

## Additional Components to Review

### 7. Bottom Navigation
- Check if it matches mobile navigation patterns from prototypes
- Glassmorphism effect
- Active state indicators

### 8. MapComponent
- Ensure map controls match prototype styling
- Info windows with proper styling
- Route visualization

### 9. Modal/Dialog Components
- Border-radius: 20-24px
- Proper backdrop blur
- Smooth animations

---

## Implementation Priority

### Phase 1: Critical Visual Alignment (CURRENT)
1. ✅ Header component - Already matches
2. ✅ Search form header - Already has teal gradient
3. ⏳ Search form inputs - Needs suggestions refinement
4. ❌ Bus card component - **PRIORITY 1**
5. ❌ Search results page - **PRIORITY 2**

### Phase 2: Interactive Components
6. ❌ Contribution forms - **PRIORITY 3**
7. ⏳ Tab navigation - Refinement needed
8. Filter components
9. Modal dialogs

### Phase 3: Enhancement
10. Animations and transitions
11. Loading states
12. Empty states
13. Error states

---

## CSS Architecture

### File Structure
```
frontend/src/styles/
├── prototype-design-system.css  ← NEW: Complete design system
├── transit-design-system.css    ← Existing
├── transit-search-form.css      ← Already updated
├── search-results.css           ← Already created
├── Header.css                   ← Already updated
├── bus-card.css                 ← TO CREATE
├── contribution-form.css        ← TO CREATE
├── tab-navigation.css           ← TO CREATE
└── index.css                    ← Main import file
```

### Import Order in App.css
1. `prototype-design-system.css` - Base design system (NEW)
2. Component-specific CSS files
3. Page-specific CSS files
4. Utility classes

---

## Animation Requirements

### Required Animations
1. **gradientShift**: Background gradient animation (15s)
2. **fadeIn**: Opacity 0→1, translateY (0.4s)
3. **slideUp**: Slide up with opacity (0.5s)
4. **pulse**: Scale animation for badges (2s infinite)
5. **shimmer**: Progress bar shimmer effect
6. **bounce**: Logo bounce animation
7. **bus-move**: Bus icon moving across progress bar

### Timing Functions
- Ease-in-out for smooth animations
- cubic-bezier(0.4, 0, 0.2, 1) for interactive elements

---

## Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Larger touch targets (44px min)
- Bottom modals
- Simplified navigation
- Reduced padding

### Tablet (641px - 1024px)
- Two-column grids where appropriate
- Medium padding
- Balanced content density

### Desktop (> 1024px)
- Multi-column layouts
- Max-width containers (1280px-1400px)
- Hover effects enabled
- Enhanced spacing

---

## Testing Checklist

### Visual Testing
- [ ] Compare side-by-side with prototype HTML files
- [ ] Test all breakpoints: 320px, 375px, 768px, 1024px, 1280px, 1920px
- [ ] Verify all colors match exactly
- [ ] Check typography sizes and weights
- [ ] Validate spacing consistency
- [ ] Test all animations

### Interactive Testing
- [ ] Hover states on all interactive elements
- [ ] Focus states for accessibility
- [ ] Click/tap interactions
- [ ] Form validations
- [ ] Modal open/close
- [ ] Tab switching
- [ ] Filter toggling

### Browser Testing
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Next Steps

1. **Create bus-card.css** - Implement complete bus card styling from prototype
2. **Update BusCard component** - Apply new CSS classes
3. **Refine SearchResults** - Add filter bar glassmorphism and view toggle
4. **Create contribution-form.css** - Full contribution form styling
5. **Update contribution components** - Apply new styles
6. **Test thoroughly** - Side-by-side comparison with prototypes

---

## Notes

- The design system uses TEAL (#14B8A6) as primary color for headers and active states
- Purple (#6366F1) was previously implemented but prototypes show TEAL
- All glassmorphism effects use `backdrop-filter: blur(20px)`
- Mobile-first approach throughout
- Touch-friendly targets (44px minimum)
- Smooth animations with proper timing functions

---

**Last Updated**: Current Session
**Status**: In Progress - Phase 1 Critical Alignment
