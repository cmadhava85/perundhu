# Frontend Cleanup Plan - Duplicate Files & CSS Conflicts

## CURRENT ISSUES:
- Multiple versions of the same components (Bus, Map, Search)
- Duplicate CSS files with conflicting styles
- Missing SearchResults.tsx (deleted accidentally)
- Import conflicts between old and new components

## CLEANUP STRATEGY:

### 1. KEEP (Modern, Final Versions):
**Components:**
- ModernBusItem.tsx + ModernBusItem.css
- ModernBusList.tsx + ModernBusList.css
- FallbackMapComponent.tsx + FallbackMapComponent.css
- EnhancedRouteForm.tsx + EnhancedRouteForm.css
- SearchForm.tsx (original, working)

**CSS:**
- EnhancedSearchForm-compact.css (final compact version)
- design-system.css (unified design tokens)
- variables.css (CSS custom properties)

### 2. REMOVE (Duplicates & Old Versions):
**Components to Delete:**
- BusItem.tsx (replaced by ModernBusItem.tsx)
- BusList.tsx (replaced by ModernBusList.tsx)
- EnhancedBusList.tsx (duplicate)
- EnhancedMapView.tsx (duplicate)
- EnhancedRouteMap.tsx (duplicate)
- MapComponent.tsx (problematic, replaced by FallbackMapComponent.tsx)
- ImprovedMapComponent.tsx (incomplete)

**CSS to Delete:**
- BusItem.css (replaced by ModernBusItem.css)
- BusList.css (replaced by ModernBusList.css)
- EnhancedSearchForm.css (replaced by compact version)
- EnhancedMapView.css (not needed)
- modern-design.css (merged into design-system.css)

### 3. UPDATE IMPORTS:
- App.tsx: Use ModernBusList instead of BusList
- All files importing old components: Update to new ones
- CSS imports: Use only the final versions

### 4. RECREATE:
- SearchResults.tsx (clean version using modern components)

## EXECUTION ORDER:
1. Create clean SearchResults.tsx
2. Remove duplicate components
3. Remove duplicate CSS files
4. Update all import statements
5. Test and verify everything works

---
This cleanup will reduce file count by ~40% and eliminate all conflicts!