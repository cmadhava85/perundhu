# Figma Integration Guide for Perundhu Design Prototypes

## 🎯 Complete Workflow: HTML Prototypes → Figma → React Components

This guide shows you how to use the HTML prototypes with Figma to create high-fidelity designs and integrate them back into your React application.

---

## 📋 Table of Contents
1. [Importing HTML to Figma](#importing-html-to-figma)
2. [Using Figma for VS Code Extension](#using-figma-for-vs-code)
3. [Design Workflow](#design-workflow)
4. [Exporting from Figma](#exporting-from-figma)
5. [Updating React Components](#updating-react-components)
6. [Tips & Best Practices](#tips--best-practices)

---

## 1. Importing HTML to Figma

### Method A: HTML to Figma Plugin (Recommended)

**Install the Plugin:**
1. Open Figma
2. Go to **Plugins** → **Browse plugins in Community**
3. Search for "**HTML to Figma**" by BuilderIO
4. Click **Install**

**Import Your Prototypes:**
1. Open your HTML prototype file (e.g., `components/bus-card.html`)
2. Copy the entire HTML code
3. In Figma: **Plugins** → **HTML to Figma**
4. Paste the HTML code
5. Click **Import**
6. Figma will create frames with the design

**Pros:**
- ✅ Preserves layout structure
- ✅ Converts CSS styles to Figma styles
- ✅ Fast and accurate

**Cons:**
- ⚠️ May need manual adjustments
- ⚠️ Some animations won't transfer

### Method B: Screenshot + Design Recreation

**Capture the Design:**
1. Open HTML prototype in browser
2. Test at different screen sizes:
   - Mobile: 375px width
   - Tablet: 768px width
   - Desktop: 1280px width
3. Take screenshots using browser DevTools (Cmd+Shift+P → "Capture screenshot")

**Recreate in Figma:**
1. Create a new Figma file
2. Import screenshots as reference
3. Use Figma's design tools to recreate
4. Use Auto Layout for responsive behavior

**Pros:**
- ✅ Full creative control
- ✅ Pixel-perfect designs
- ✅ Better understanding of structure

**Cons:**
- ⏱️ Time-consuming
- 🎨 Requires design skills

### Method C: Direct Visual Reference

Simply open the HTML files in a browser alongside Figma and use them as a visual guide.

---

## 2. Using Figma for VS Code Extension

The **Figma for VS Code** extension is already installed in your workspace. Here's how to use it:

### Opening Figma Designs in VS Code

1. **Sign in to Figma:**
   ```
   Cmd+Shift+P → "Figma: Sign in"
   ```

2. **Open a Figma file:**
   ```
   Cmd+Shift+P → "Figma: Open File"
   ```
   - Browse your recent files
   - Or paste a Figma file URL

3. **View in Split Screen:**
   - Keep your React code on one side
   - Figma design on the other side
   - Easy to compare and implement

### Inspecting Design Properties

1. **Click any element** in the Figma panel
2. View properties in the sidebar:
   - Dimensions (width, height)
   - Colors (HEX, RGB)
   - Spacing (margins, padding)
   - Typography (font, size, weight)
   - Border radius, shadows, etc.

3. **Copy CSS:**
   - Right-click on element
   - Select "Copy CSS"
   - Paste directly into your React component

### Getting Code Suggestions

The Figma extension can suggest code for your designs:

1. Select a component in Figma
2. Click "Code" tab in the panel
3. Choose your framework:
   - React
   - React Native
   - CSS
   - Tailwind CSS
4. Copy the generated code

---

## 3. Design Workflow

### Step 1: Start with HTML Prototypes

Use the provided prototypes as your foundation:
- `components/bus-card.html` - Bus card component
- `components/search-form.html` - Search form
- `components/header.html` - App header
- `pages/home.html` - Complete page layout

### Step 2: Import to Figma

Choose your preferred import method (see section 1)

### Step 3: Enhance the Design

Now you have creative freedom in Figma:

**Visual Enhancements:**
- [ ] Adjust colors and gradients
- [ ] Refine typography and spacing
- [ ] Add custom icons and illustrations
- [ ] Create micro-interactions and animations
- [ ] Design hover/active states
- [ ] Add dark mode variants

**Create Components:**
- [ ] Convert repeated elements to Figma components
- [ ] Create component variants (sizes, states)
- [ ] Set up Auto Layout for responsiveness
- [ ] Define component properties

**Design System:**
- [ ] Extract colors to Figma styles
- [ ] Create text styles
- [ ] Define spacing tokens
- [ ] Set up grid system

### Step 4: Create Responsive Variants

Create frames for different breakpoints:

```
Mobile:   375px × Dynamic height
Tablet:   768px × Dynamic height
Desktop: 1280px × Dynamic height
```

Use **Constraints** and **Auto Layout** for responsive behavior.

### Step 5: Prototype Interactions

Add interactions for user testing:
- Click events
- Hover effects
- Page transitions
- Form submissions
- Modal popups

---

## 4. Exporting from Figma

### Export Design Tokens

**Colors:**
1. Select all color styles
2. Use **Figma Tokens** plugin
3. Export as CSS variables
4. Update `frontend/src/styles/` files

**Typography:**
1. Document font families, sizes, weights
2. Export as CSS classes
3. Update your design system

**Spacing:**
1. Note margin/padding values
2. Create spacing scale
3. Use CSS custom properties

### Export Assets

**Icons & Images:**
1. Select assets in Figma
2. **Export** → Choose format:
   - SVG for icons
   - PNG for images
   - WebP for photos
3. Save to `frontend/src/assets/`

### Generate Component Code

**Using Figma for VS Code:**
1. Select component in Figma
2. View "Code" panel
3. Choose "React" or "Tailwind CSS"
4. Copy generated code

**Using Frontier Extension** (already installed):
1. Select component
2. **Plugins** → **Frontier**
3. Choose your tech stack:
   - React + TypeScript
   - Tailwind CSS
   - Material-UI
4. Generate code
5. Copy to your React component

**Using CopyCat Extension** (already installed):
1. Select Figma layer
2. **Plugins** → **CopyCat**
3. Convert to React code
4. Includes CSS styles

---

## 5. Updating React Components

### Apply Design Changes

**Step 1: Update Styles**

```bash
# Navigate to your component
cd frontend/src/components/
```

Update CSS in corresponding style file or inline styles:

```tsx
// Example: TransitBusCard.tsx
const styles = {
  card: {
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    // ... other styles from Figma
  }
};
```

**Step 2: Update Layout**

Match the HTML structure from your prototype:

```tsx
<div className="bus-card">
  <div className="card-header">{/* ... */}</div>
  <div className="journey-layout">{/* ... */}</div>
  <div className="status-bar">{/* ... */}</div>
</div>
```

**Step 3: Apply Responsive Styles**

Add media queries from prototypes:

```css
@media (min-width: 768px) {
  .bus-card {
    padding: 32px;
  }
}

@media (min-width: 1024px) {
  .bus-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**Step 4: Test Responsiveness**

```bash
npm run dev
```

Test at different viewport sizes:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px+

### Update Design Tokens

Update your global CSS variables:

```css
/* frontend/src/styles/variables.css */
:root {
  /* Colors from Figma */
  --color-primary: #6366F1;
  --color-secondary: #10B981;
  
  /* Spacing from Figma */
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  
  /* Typography from Figma */
  --font-base: 16px;
  --font-lg: 18px;
  
  /* Shadows from Figma */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## 6. Tips & Best Practices

### Design in Figma

**✅ DO:**
- Use Auto Layout for responsive components
- Create reusable component library
- Name layers clearly (matches React component names)
- Document design decisions
- Test on real devices
- Share prototypes for feedback

**❌ DON'T:**
- Over-design without considering technical constraints
- Use non-web-safe fonts
- Create designs that aren't responsive
- Forget to check accessibility (contrast, text size)

### Exporting to Code

**✅ DO:**
- Review generated code before using
- Refactor for readability
- Use semantic HTML
- Maintain consistent naming conventions
- Test cross-browser compatibility

**❌ DON'T:**
- Copy code blindly without understanding
- Use fixed pixel widths (use responsive units)
- Ignore accessibility attributes
- Forget to optimize images

### Responsive Design

**Mobile-First Approach:**
1. Design for mobile first (375px)
2. Scale up to tablet (768px)
3. Enhance for desktop (1280px+)

**Touch Targets:**
- Minimum 44px × 44px
- Comfortable: 48px × 48px
- Buttons and links should be easy to tap

**Performance:**
- Optimize images (WebP format)
- Use CSS for simple animations
- Lazy load images
- Minimize bundle size

---

## 🚀 Quick Start Checklist

- [ ] Open HTML prototype in browser
- [ ] Import to Figma using preferred method
- [ ] Enhance design with Figma tools
- [ ] Create responsive variants (mobile, tablet, desktop)
- [ ] Add interactions and prototype
- [ ] Share with team for feedback
- [ ] Export design tokens and assets
- [ ] Generate component code using Figma extensions
- [ ] Update React components
- [ ] Test responsiveness
- [ ] Deploy and iterate

---

## 🛠️ Recommended Figma Plugins

Already installed in your VS Code:
- ✅ **Figma for VS Code** - View designs in editor
- ✅ **Frontier** - Figma to React converter
- ✅ **CopyCat** - Figma to React converter

Additional Figma plugins to install:
- 📦 **Figma Tokens** - Export design tokens
- 🎨 **Stark** - Accessibility checker
- 📐 **Autoflow** - Create user flows
- 🖼️ **Unsplash** - Free stock images
- ⚡ **Iconify** - Icon library

---

## 📚 Resources

- [Figma Documentation](https://help.figma.com/)
- [Figma for VS Code](https://www.figma.com/community/plugin/1306866243193481047)
- [React + Figma Best Practices](https://www.figma.com/best-practices/)
- [Responsive Design in Figma](https://help.figma.com/hc/en-us/articles/360040451473)

---

## 🤝 Support

If you need help:
1. Check HTML prototype examples in `design-prototype/`
2. Review this guide
3. Test with sample data
4. Iterate and improve

Happy designing! 🎨✨
