# Grouped Location Results - UI Design Layout

## 📱 Visual Overview

### **State 1: Search Results - Multiple Variants**

```
┌─────────────────────────────────────────────────────────────┐
│  Search Locations                                      [✕]  │
├─────────────────────────────────────────────────────────────┤
│  [salem                                              🔄]    │
│                                                              │
│  ╔═════════════════════════════════════════════════════╗   │
│  ║ SALEM                                               ║   │
│  ╠═════════════════════════════════════════════════════╣   │
│  ║ 📍 Salem (City)                                     ║   │
│  ║   All buses from/to Salem area                      ║   │
│  ║                                                      ║   │
│  ╠─────────────────────────────────────────────────────╣   │
│  ║ 🚌 Bus Stands                                       ║   │
│  ║ ─────────────────────────────────────────────────   ║   │
│  ║ 🚌 Salem - New Bus Stand                            ║   │
│  ║    Main intercity terminal (newer facility)         ║   │
│  ║                                                      ║   │
│  ║ 🚌 Salem - Old Bus Stand                            ║   │
│  ║    Original city center location                    ║   │
│  ║                                                      ║   │
│  ╠─────────────────────────────────────────────────────╣   │
│  ║ 🏘️ Nearby Areas                                     ║   │
│  ║ ─────────────────────────────────────────────────   ║   │
│  ║ 📍 Salem - Attur Road                               ║   │
│  ║ 📍 Salem - Industrial Area                          ║   │
│  ║                                                      ║   │
│  ╚═════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Structure

### **Main Components:**

```
┌─ Location Group Container
│  ├─ Group Header (City Name)
│  │  └─ "SALEM" (uppercase, light gray, divider line)
│  │
│  ├─ City Option (Primary Selection)
│  │  ├─ Badge: "📍 City"
│  │  ├─ Name: "Salem"
│  │  ├─ Description: "All buses from/to Salem"
│  │  └─ Highlight Background: Light green (#f0fdf4)
│  │
│  ├─ Bus Stands Section Header
│  │  └─ "🚌 Bus Stands" (subheader)
│  │
│  ├─ Bus Stand Item 1
│  │  ├─ Badge: "🚌 Stand"
│  │  ├─ Name: "Salem - New Bus Stand"
│  │  ├─ Description: "Main intercity terminal"
│  │  └─ Indent: 12px left margin
│  │
│  ├─ Bus Stand Item 2
│  │  └─ (similar structure)
│  │
│  └─ Nearby Areas Section Header
│     └─ "🏘️ Nearby Areas"
```

---

## 📐 Detailed Spacing & Typography

### **Group Header**
```
SALEM
─────────────────────────────────────────

Padding: 8px top, 8px bottom, 16px horizontal
Font: 13px, weight 600, #6b7280 (gray)
Text-transform: UPPERCASE
Letter-spacing: 0.5px
Border-bottom: 1px solid #e5e7eb
```

### **City Option Item**
```
┌──────────────────────────────────────┐
│ 📍  Salem                            │  Height: 56px min
│     All buses from/to Salem          │  Padding: 12px 16px
└──────────────────────────────────────┘

Background: #f0fdf4 (very light green)
Border: None
Font-weight: 500
Icon Gap: 12px
```

### **Bus Stand Section Header**
```
🚌 Bus Stands
──────────────

Padding: 6px 16px
Font: 12px, weight 500, #9ca3af (darker gray)
Margin-top: 4px
```

### **Bus Stand Item**
```
┌──────────────────────────────────────┐
│    🚌  Salem - New Bus Stand         │  Height: 56px min
│        Main intercity terminal       │  Padding: 12px 32px (left indent)
└──────────────────────────────────────┘

Font-size: 15px
Line-height: 1.4
Background: transparent
Hover: #f3f4f6 (light gray)
```

### **Description Text**
```
"Main intercity terminal"

Font-size: 12px
Color: #9ca3af (medium gray)
Margin-top: 2px
Line-height: 1.3
Optional: Show in lighter color
```

---

## 🎨 Color Scheme

```
Background:
├─ City Option: #f0fdf4 (Light Green - Recommended)
├─ Bus Stand: transparent (with hover #f3f4f6)
└─ Section Headers: none

Text:
├─ City Name: #1f2937 (dark gray)
├─ Bus Stand Name: #1f2937 (dark gray)
├─ Group Header: #6b7280 (medium gray)
├─ Description: #9ca3af (lighter gray)
└─ Badge: #6b7280 background

Icons:
├─ City: 📍 (pin)
├─ Bus Stand: 🚌 (bus)
├─ Area: 🏘️ (houses)
└─ Separator: (line or none)

Accent:
├─ City Option Background: #dcfce7 (light green)
├─ Hover State: #f3f4f6 (light gray)
└─ Focus State: #dbeafe (light blue)
```

---

## 🔄 Interaction States

### **1. Idle (Default)**
```
┌──────────────────────────────────────┐
│ 📍 Salem                             │
│    All buses from/to Salem           │
└──────────────────────────────────────┘
```

### **2. Hover State**
```
┌──────────────────────────────────────┐
│ 📍 Salem (✓ Background: #f0fdf4)    │  (City stays highlighted)
│    All buses from/to Salem           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    🚌 Salem - New Bus Stand          │  (Bus stand shows: #f3f4f6)
│       Main intercity terminal        │
└──────────────────────────────────────┘
```

### **3. Focus/Keyboard Navigation**
```
┌──────────────────────────────────────┐
│ ► 🚌 Salem - New Bus Stand           │  Ring: 2px solid #3b82f6
│    Main intercity terminal           │
└──────────────────────────────────────┘
```

### **4. Selected State**
```
┌──────────────────────────────────────┐
│ ✓ 📍 Salem                           │  Checkmark appears
│   All buses from/to Salem            │  Highlight: #dbeafe
└──────────────────────────────────────┘
```

---

## 📱 Mobile Responsive Layout

### **Mobile View (< 480px)**
```
┌─────────────────────────────────────┐
│  [salem                           🔄]  │  Smaller padding
│                                        │
│ ╔═════════════════════════════════╗  │
│ ║ SALEM                           ║  │
│ ╠═════════════════════════════════╣  │
│ ║ 📍 Salem (City)                 ║  │
│ ║   All buses from/to Salem       ║  │
│ ║                                 ║  │
│ ╠─────────────────────────────────╣  │
│ ║ 🚌 Bus Stands                   ║  │
│ ║ 🚌 Salem - New Bus Stand         ║  │  Full width
│ ║   Main intercity terminal       ║  │
│ ║ 🚌 Salem - Old Bus Stand         ║  │  Stack vertically
│ ║   Original city center          ║  │
│ ║                                 ║  │
│ ╚═════════════════════════════════╝  │
└─────────────────────────────────────┘
```

**Changes for Mobile:**
- Reduced horizontal padding: 12px instead of 16px
- Font sizes: slightly smaller (14px for names)
- Item height: maintain 48px minimum (touch-friendly)
- Single column layout
- Tap targets: 44x44px minimum

---

## 🖥️ Desktop View (> 768px)

```
┌──────────────────────────────────────────────────────────┐
│  [salem                                              🔄]  │
│                                                           │
│  ╔════════════════════════════════════════════════════╗  │
│  ║ SALEM                                              ║  │
│  ╠════════════════════════════════════════════════════╣  │
│  ║ 📍 Salem (City)                                    ║  │
│  ║    All buses from/to Salem                         ║  │
│  ║                                                     ║  │
│  ╠────────────────────────────────────────────────────╣  │
│  ║ 🚌 Bus Stands                                      ║  │
│  ║ ──────────────────────────────────────────────────  ║  │
│  ║    🚌 Salem - New Bus Stand                        ║  │
│  ║       Main intercity terminal (newer facility)     ║  │
│  ║                                                     ║  │
│  ║    🚌 Salem - Old Bus Stand                        ║  │
│  ║       Original city center location                ║  │
│  ║                                                     ║  │
│  ╠────────────────────────────────────────────────────╣  │
│  ║ 🏘️ Nearby Areas                                    ║  │
│  ║ ──────────────────────────────────────────────────  ║  │
│  ║    📍 Salem - Attur Road                           ║  │
│  ║    📍 Salem - Industrial Area                      ║  │
│  ║                                                     ║  │
│  ╚════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────┘
```

**Enhancements for Desktop:**
- Wider padding: 16px horizontal
- Larger font: 15px for names
- Full descriptions visible
- Box shadow on dropdown: `0 8px 24px rgba(0, 0, 0, 0.15)`

---

## 🌟 Different Search Scenarios

### **Scenario 1: User types "salem"**
Shows all variants organized by type ✓

### **Scenario 2: User types "salem new"**
```
SALEM

🚌 Bus Stands
──────────────
🚌 Salem - New Bus Stand
   Main intercity terminal (newer facility)
```
(Filtered to show only matching results)

### **Scenario 3: User types "bus"**
```
COIMBATORE

🚌 Bus Stands
──────────────
🚌 Coimbatore - Gandhipuram Bus Stand
🚌 Coimbatore - Central Bus Stand

MADURAI

🚌 Bus Stands
──────────────
🚌 Madurai - Central Bus Stand
🚌 Madurai - Periyar Bus Stand
```
(Multiple cities grouped, only bus stands shown)

### **Scenario 4: User types "new"**
```
Multiple results from different cities - similar structure

SALEM
🚌 Salem - New Bus Stand

MADURAI
🚌 Madurai - New Bus Stand
```

---

## 📦 Badge Design

### **City Badge**
```
┌─────────┐
│ 📍 City │  Background: #dcfce7 (light green)
└─────────┘  Color: #166534 (dark green)
             Padding: 2px 8px
             Border-radius: 4px
             Font-size: 12px
```

### **Bus Stand Badge**
```
┌──────────────┐
│ 🚌 Bus Stand │  Background: #dbeafe (light blue)
└──────────────┘  Color: #1e40af (dark blue)
                  Padding: 2px 8px
                  Border-radius: 4px
                  Font-size: 12px
```

### **Area Badge**
```
┌────────┐
│ 🏘️ Area │  Background: #fce7f3 (light pink)
└────────┘  Color: #9d174d (dark pink)
            Padding: 2px 8px
            Border-radius: 4px
            Font-size: 12px
```

---

## 💬 Additional Information Display

### **Option 1: Subtitle Text** (Recommended)
```
Salem - New Bus Stand
Main intercity terminal (newer facility)

Font-size: 12px, Color: #9ca3af
Shows context without cluttering
```

### **Option 2: Tooltip on Hover**
```
Salem - New Bus Stand
[Hover for 1 sec]
↓
Tooltip: "Main intercity terminal with AC waiting area"
```

### **Option 3: Icon-based Context**
```
Salem - New Bus Stand     [⭐] [📍] [🚌]
                          New  2km away  Direct buses

Icons indicate characteristics
```

---

## 🎬 Animation & Transitions

### **Dropdown Open**
```
Duration: 150ms
Easing: ease-out
Properties: opacity (0→1), scale (0.95→1)

Initial: opacity 0, transform scale(0.95)
Final: opacity 1, transform scale(1)
```

### **Hover Effects**
```
Duration: 150ms
Easing: ease-in-out

Background-color: transparent → #f3f4f6 (bus stands)
Smooth transition for better UX
```

### **Group Expansion** (Optional)
```
Duration: 200ms
Effect: Fade in group items sequentially

Group 1 (City): fade in at 0ms
Group 2 (Bus Stands): fade in at 50ms
Group 3 (Areas): fade in at 100ms
```

---

## 📋 CSS Classes Structure

```css
.location-group {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.location-group-header {
  padding: 8px 16px 4px;
  font-weight: 600;
  font-size: 13px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.location-group-items {
  /* Container for items in group */
}

.location-subheader {
  padding: 6px 16px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 56px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s;
}

.suggestion-item.city-option {
  background-color: #f0fdf4;
  font-weight: 500;
}

.suggestion-item.bus-stand {
  padding-left: 32px; /* Indent */
}

.suggestion-item.area {
  padding-left: 32px;
}

.suggestion-item:hover {
  background-color: #f3f4f6;
}

.suggestion-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.location-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.location-badge.city {
  background: #dcfce7;
  color: #166534;
}

.location-badge.bus-stand {
  background: #dbeafe;
  color: #1e40af;
}

.location-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-context {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  line-height: 1.3;
}
```

---

## 🔍 Search with No Results

```
┌─────────────────────────────────────┐
│  [xyz123                          🔄] │
│                                        │
│  ╔═════════════════════════════════╗  │
│  ║ 🔍                              ║  │
│  ║ No locations found              ║  │
│  ║                                 ║  │
│  ║ Try:                            ║  │
│  ║ • Check spelling                ║  │
│  ║ • Use location name only        ║  │
│  ║ • Example: "Salem", "Madurai"   ║  │
│  ║                                 ║  │
│  ╚═════════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

## 🚀 Loading State

```
┌─────────────────────────────────────┐
│  [salem                            🔄] │  (spinner)
│                                        │
│  ╔═════════════════════════════════╗  │
│  ║ ⏳ LOADING                      ║  │
│  ║                                 ║  │
│  ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║  │  (skeleton)
│  ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║  │
│  ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║  │
│  ║                                 ║  │
│  ╚═════════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

## 🎨 Color Palette Reference

```
Primary Colors:
├─ Green (City): #f0fdf4 (bg), #dcfce7 (badge), #166534 (text)
├─ Blue (Bus Stand): #dbeafe (badge), #1e40af (text)
├─ Pink (Area): #fce7f3 (bg), #9d174d (text)

Neutral Colors:
├─ Dark Gray: #1f2937 (text)
├─ Medium Gray: #6b7280 (headers)
├─ Light Gray: #9ca3af (subtitles)
├─ Very Light: #f3f4f6 (hover)
├─ Border: #e5e7eb

Backgrounds:
├─ White: #ffffff
├─ Group Separator: #e5e7eb (1px border)

Focus/Active:
├─ Primary Blue: #3b82f6 (focus ring)
├─ Hover: #f3f4f6
```

---

## 📐 Dimensions Reference

```
Input Height: 48px
Item Height: 56px (min)
Group Header Padding: 8px vertical, 16px horizontal
Item Padding: 12px vertical, 16px horizontal
Bus Stand Indent: 32px left padding
Icon Gap: 12px
Border Radius: 8px (input), 4px (badges)
Font Sizes: 13px (header), 15px (item), 12px (context)
```

---

## ✨ Final Visual Summary

```
┌─────────────────────────────────────────┐
│ Input Field                          [🔄]│
└─────────────────────────────────────────┘
                    ↓
    ╔═════════════════════════════╗
    ║ GROUP HEADER               ║
    ╠═════════════════════════════╣
    ║ [🎯] PRIMARY OPTION        ║  ← City (Recommended)
    ║      Subtitle             ║
    ╠─────────────────────────────╣
    ║ SUB HEADER                 ║
    ║ [🚌] Bus Stand 1           ║  ← Indented items
    ║      Subtitle             ║
    ║ [🚌] Bus Stand 2           ║
    ║      Subtitle             ║
    ╠─────────────────────────────╣
    ║ SUB HEADER 2               ║
    ║ [📍] Area 1                ║
    ║ [📍] Area 2                ║
    ║                            ║
    ╚═════════════════════════════╝
```

---

**This layout provides:**
- ✅ Clear visual hierarchy
- ✅ Logical grouping
- ✅ Easy scanning
- ✅ Mobile-friendly
- ✅ Accessible (keyboard navigation, focus states)
- ✅ Consistent with modern UX patterns
