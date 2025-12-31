# Perundhu Design Prototype System

## 📋 Overview
This folder contains standalone HTML prototypes of all major UI components with **responsive design** for desktop and mobile, rich UI elements, and sample data.

## 🎯 Purpose
- **Prototype**: Design and iterate on UI without affecting production code
- **Figma Integration**: Import these HTML files into Figma for visual design
- **Design Review**: Share with stakeholders for feedback
- **Mobile-First**: All components are responsive and optimized for both mobile and desktop

## 📁 Structure
```
design-prototype/
├── components/          # Individual component prototypes
│   ├── header.html
│   ├── bus-card.html
│   ├── search-form.html
│   └── ...
├── pages/              # Full page layouts
│   ├── home.html
│   ├── search-results.html
│   └── ...
├── assets/             # Design tokens, colors, icons
│   └── design-tokens.css
└── README.md
```

## 🚀 How to Use

### 1. **View Prototypes Locally**
Simply open any `.html` file in your browser:
```bash
open design-prototype/components/bus-card.html
```

### 2. **Import to Figma**
**Method A: HTML Import (Figma Plugin)**
1. Install "HTML to Figma" plugin in Figma
2. Copy the HTML code from any prototype file
3. Paste into the plugin
4. Adjust as needed

**Method B: Visual Reference**
1. Open HTML file in browser
2. Take screenshots at different viewport sizes
3. Use as reference in Figma
4. Use Figma's "Figma to Code" extension in VS Code to sync back

**Method C: Direct Design**
1. Use these prototypes as specification
2. Create designs in Figma from scratch
3. Export as React components using Figma extension

### 3. **Test Responsive Design**
Open in browser and resize window, or use browser DevTools:
- **Mobile**: 375px - 428px width
- **Tablet**: 768px - 1024px width
- **Desktop**: 1280px+ width

### 4. **Update React Components**
After finalizing designs in Figma:
1. Export design tokens (colors, spacing, typography)
2. Update `frontend/src/styles/` CSS files
3. Modify React components to match new design
4. Use Figma extension to generate component code

## 🎨 Design System Features

### Colors
- **Primary**: #6366F1 (Indigo)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)
- **Warning**: #F59E0B (Amber)

### Typography
- **Display**: SF Pro Display / System UI
- **Body**: Inter / System UI
- Mobile: 14-16px base
- Desktop: 16-18px base

### Spacing Scale
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

### Responsive Breakpoints
```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## 🔄 Workflow

1. **Design Phase**
   - Modify HTML prototypes
   - Import to Figma
   - Create high-fidelity designs
   - Get stakeholder approval

2. **Development Phase**
   - Export design tokens from Figma
   - Update CSS variables
   - Implement in React components
   - Test responsive behavior

3. **Iteration**
   - Update prototypes based on feedback
   - Re-import to Figma
   - Refine designs
   - Update code

## 📱 Mobile-First Principles
All components follow mobile-first design:
- ✅ Touch-friendly targets (min 44px)
- ✅ Readable text (min 16px)
- ✅ Compact layouts for small screens
- ✅ Progressive enhancement for larger screens
- ✅ Fast loading and performance
- ✅ Gesture-friendly interactions

## 🎯 Next Steps
1. Review prototype components
2. Import to Figma and create designs
3. Share with team for feedback
4. Export final designs to React

## 🔗 Useful Extensions
- **Figma for VS Code**: View and inspect designs in editor
- **Figma to React**: Convert designs to React code
- **HTML to Figma**: Import HTML prototypes

---
Created: December 27, 2025
