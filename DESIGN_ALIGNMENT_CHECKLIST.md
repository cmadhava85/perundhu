# Design Prototype to Frontend Component Alignment Checklist

## Overview
This document helps ensure all frontend components match the design prototypes exactly.

---

## Component Mapping

### 1. Header Component
- **Prototype**: `design-prototype/components/header.html`
- **Frontend**: `frontend/src/components/Header.tsx`
- **Styles**: `frontend/src/styles/Header.css`

**Key Design Elements:**
- [ ] Purple gradient background: `#7C3AED → #6D28D9` ✅ (Updated)
- [ ] Brand logo with bus icon 🚌
- [ ] Brand name "பேருந்து" (Perundhu)
- [ ] Center title "Tamil Nadu Bus Schedule"
- [ ] What's New button with badge (✨)
- [ ] Language switcher (🌐 தமிழ்)
- [ ] Responsive layout (mobile/tablet/desktop)

---

### 2. Search Form Component
- **Prototype**: `design-prototype/components/search-form.html`
- **Frontend**: `frontend/src/components/TransitSearchForm.tsx`
- **Styles**: `frontend/src/styles/search-form.css`

**Key Design Elements:**
- [ ] Purple gradient header: `#7C3AED → #6D28D9` ✅ (Updated)
- [ ] Header title: "🔍 Plan Your Journey"
- [ ] Subtitle: "Find the best buses for your route"
- [ ] From location with green circle (🟢)
- [ ] To location with red circle (🔴)
- [ ] Verified badge (✓ Verified) - green gradient ✅ (Updated - gap reduced)
- [ ] Swap button (⇅)
- [ ] Find Buses button - teal gradient
- [ ] Input fields with glassmorphism effect

---

### 3. Tab Navigation
- **Prototype**: `design-prototype/pages/home-with-tabs.html`
- **Frontend**: `frontend/src/components/MainTabNavigation.tsx`
- **Styles**: `frontend/src/styles/Header.css` (main-tab-navigation section)

**Key Design Elements:**
- [ ] Transparent white background with blur ✅ (Updated)
- [ ] Rounded corners (24px)
- [ ] Two tabs: "🔍 Search Buses" and "🤝 Contribute" ✅ (Updated)
- [ ] Active tab: Cyan/sky blue gradient `#0EA5E9 → #06B6D4` ✅ (Updated)
- [ ] Inactive tab: Transparent with white text
- [ ] Hover effects

---

### 4. Bus Card Component
- **Prototype**: `design-prototype/components/bus-card.html`
- **Frontend**: `frontend/src/components/bus-list/BusItem.tsx`
- **Styles**: `frontend/src/styles/bus-card.css`

**Key Design Elements:**
- [ ] White card with rounded corners
- [ ] Bus number badge (red gradient)
- [ ] Timing display (departure → arrival)
- [ ] Journey line with bus icon
- [ ] Stops count (green text)
- [ ] Action buttons layout: ✅ (Updated)
  - [ ] Left side (vertical): Add Stops, Report Issue, Share
  - [ ] Right side: View Details (larger button)
- [ ] Expandable stops list
- [ ] Hover effects with shadow

---

### 5. Bus List Filters
- **Prototype**: `design-prototype/pages/search-results.html`
- **Frontend**: `frontend/src/components/bus-list/BusListFilters.tsx`
- **Styles**: `frontend/src/styles/bus-card.css`

**Key Design Elements:**
- [ ] White card with glassmorphism
- [ ] Sort by: Fastest, Cheapest, Earliest, Latest ✅ (Updated - proper wrapping)
- [ ] Operator filter: All, Government, Private ✅ (Updated - proper wrapping)
- [ ] Active filter: Teal gradient
- [ ] Proper spacing and wrapping ✅ (Updated)

---

### 6. Contribution Form
- **Prototype**: `design-prototype/components/contribution-form.html`
- **Frontend**: `frontend/src/components/contribution/ReportIssue.tsx`
- **Styles**: `frontend/src/components/contribution/ReportIssue.css`

**Key Design Elements:**
- [ ] Red gradient header: `#EF4444 → #DC2626` ✅ (Updated)
- [ ] Issue type cards with icons
- [ ] Form fields with 2px borders
- [ ] Submit button with red gradient ✅ (Updated)
- [ ] Success state with green gradient
- [ ] Error messages with light red background

---

### 7. Search Results Page
- **Prototype**: `design-prototype/pages/search-results.html`
- **Frontend**: `frontend/src/components/TransitBusList.tsx`
- **Styles**: Multiple CSS files

**Key Design Elements:**
- [ ] Header with back button
- [ ] Search summary
- [ ] Filter bar ✅ (Updated)
- [ ] Bus cards list ✅ (Updated)
- [ ] Results count
- [ ] Loading states
- [ ] Empty states

---

## How to Verify Alignment

### Step 1: Visual Comparison
1. Open prototype HTML file in browser
2. Open corresponding frontend component in dev server
3. Compare side-by-side:
   - Colors (use color picker tool)
   - Spacing (use browser dev tools)
   - Typography (font sizes, weights)
   - Border radius
   - Shadows
   - Animations

### Step 2: Extract Design Tokens
From prototype CSS, extract:
```css
/* Colors */
--purple-gradient: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
--cyan-gradient: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
--teal-gradient: linear-gradient(135deg, #14B8A6, #0D9488);
--red-gradient: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
--green-gradient: linear-gradient(135deg, #10B981, #059669);

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
--spacing-2xl: 32px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;

/* Typography */
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 24px;
```

### Step 3: Run Automated Checks
```bash
# Build frontend
cd frontend && npm run build

# Check for CSS conflicts
grep -r "linear-gradient" src/styles/*.css | grep -v "7C3AED\|0EA5E9\|14B8A6\|EF4444\|10B981"

# Check component imports
grep -r "import.*css" src/components/*.tsx
```

### Step 4: Test Responsiveness
Test at breakpoints:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px

### Step 5: Check Interactions
- [ ] Hover states
- [ ] Click/tap feedback
- [ ] Focus states
- [ ] Loading states
- [ ] Error states
- [ ] Success states
- [ ] Animations (smooth, not janky)

---

## Current Status

### ✅ Completed Alignments
1. Header - Purple gradient applied
2. Search Form Header - Purple gradient applied
3. Tab Navigation - Cyan gradient for active state, simplified labels
4. Bus Card Footer - Vertical button layout fixed
5. Bus List Filters - Proper wrapping and spacing
6. Report Issue Modal - Red gradient theme applied
7. Verified Badge - Closer spacing to labels

### ⚠️ Needs Verification
1. All responsive breakpoints
2. Animation timing and easing
3. Exact color values in all files
4. Typography consistency
5. Shadow depths
6. Border widths

### 🔄 Next Steps
1. Create a shared design tokens CSS file
2. Replace hardcoded values with CSS variables
3. Document all component states
4. Add visual regression testing
5. Create component showcase page

---

## Quick Reference: File Locations

### Design Prototypes
```
design-prototype/
├── components/
│   ├── header.html              → Header.tsx
│   ├── search-form.html         → TransitSearchForm.tsx
│   ├── bus-card.html            → BusItem.tsx
│   └── contribution-form.html   → ReportIssue.tsx
└── pages/
    ├── home-with-tabs.html      → App.tsx (main page)
    └── search-results.html      → TransitBusList.tsx
```

### Frontend Components
```
frontend/src/
├── components/
│   ├── Header.tsx
│   ├── MainTabNavigation.tsx
│   ├── TransitSearchForm.tsx
│   ├── TransitBusList.tsx
│   ├── bus-list/
│   │   ├── BusItem.tsx
│   │   └── BusListFilters.tsx
│   └── contribution/
│       └── ReportIssue.tsx
└── styles/
    ├── Header.css
    ├── search-form.css
    ├── bus-card.css
    └── prototype-design-system.css
```

---

## Tools for Verification

1. **Browser DevTools**: Inspect elements, measure spacing
2. **ColorZilla**: Pick colors from prototypes
3. **PerfectPixel**: Overlay prototype over implementation
4. **Responsively App**: Test multiple screen sizes
5. **Percy/Chromatic**: Visual regression testing

---

## Maintenance

Update this checklist whenever:
- New prototypes are created
- Frontend components are modified
- Design system changes
- New breakpoints are added

Last Updated: December 29, 2025
