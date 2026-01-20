# Component Refactoring Guide

## Overview
This guide documents recommended refactoring for large components (>300 lines) to improve maintainability, testability, and code organization.

## Components Requiring Refactoring

### Priority 1: Critical Refactoring (>1000 lines)

#### 1. ImageContributionAdminPanel.tsx (1,864 lines)
**Current Issues:**
- Single component handling multiple responsibilities
- Complex state management with 20+ useState hooks
- Large interfaces and type definitions mixed with component logic
- Multiple UI sections (filters, list, detail view, approval dialog)

**Recommended Structure:**
```
components/admin/image-contributions/
├── ImageContributionAdminPanel.tsx (main orchestrator, ~200 lines)
├── hooks/
│   ├── useImageContributions.ts (data fetching & state)
│   ├── useContributionFilters.ts (filter logic)
│   └── useOCRProcessing.ts (OCR data handling)
├── components/
│   ├── ContributionFilters.tsx (filter UI, ~150 lines)
│   ├── ContributionList.tsx (list view, ~200 lines)
│   ├── ContributionDetail.tsx (detail view, ~300 lines)
│   ├── ApprovalDialog.tsx (approval flow, ~200 lines)
│   ├── TerminalValidation.tsx (terminal validation, ~150 lines)
│   └── RouteEditor.tsx (route editing, ~200 lines)
├── types/
│   ├── ImageContribution.ts (interfaces)
│   └── OCRData.ts (OCR-related types)
└── utils/
    ├── ocrParser.ts (OCR text parsing)
    └── routeValidator.ts (route validation logic)
```

**Benefits:**
- ✅ Each component <300 lines
- ✅ Clear separation of concerns
- ✅ Easier to test individually
- ✅ Reusable custom hooks
- ✅ Type safety with separate type files

#### 2. TransitSearchForm.tsx (1,329 lines)
**Current Issues:**
- Handles search UI, location selection, and date/time logic
- Complex autocomplete with multiple data sources
- Mixed responsibilities (UI + business logic)

**Recommended Structure:**
```
components/search/
├── TransitSearchForm.tsx (main form, ~200 lines)
├── hooks/
│   ├── useLocationSearch.ts (location autocomplete)
│   ├── useSearchHistory.ts (recent searches)
│   └── useDateTimeSelection.ts (date/time logic)
├── components/
│   ├── LocationAutocomplete.tsx (~250 lines)
│   ├── DateTimePicker.tsx (~200 lines)
│   ├── SearchButton.tsx (~100 lines)
│   └── RecentSearches.tsx (~150 lines)
└── types/
    └── SearchFormTypes.ts
```

#### 3. AddStopsToRoute.tsx (1,286 lines)
**Current Issues:**
- Route contribution form with complex validation
- Map integration and stop management
- Multiple submission flows

**Recommended Structure:**
```
components/contribution/add-stops/
├── AddStopsToRoute.tsx (main coordinator, ~200 lines)
├── hooks/
│   ├── useStopManagement.ts (stop CRUD operations)
│   ├── useRouteValidation.ts (validation logic)
│   └── useMapInteraction.ts (map state)
├── components/
│   ├── StopList.tsx (~200 lines)
│   ├── StopEditor.tsx (~250 lines)
│   ├── RouteMap.tsx (~200 lines)
│   └── SubmissionDialog.tsx (~150 lines)
└── types/
    └── StopTypes.ts
```

#### 4. ImageContributionUpload.tsx (1,102 lines)
**Current Issues:**
- Image upload, preview, and analysis
- OCR processing and result display
- Form submission logic

**Recommended Structure:**
```
components/contribution/image-upload/
├── ImageContributionUpload.tsx (main, ~150 lines)
├── hooks/
│   ├── useImageUpload.ts (upload logic)
│   ├── useOCRAnalysis.ts (OCR processing)
│   └── useSubmission.ts (form submission)
├── components/
│   ├── ImageDropzone.tsx (~200 lines)
│   ├── ImagePreview.tsx (~150 lines)
│   ├── OCRResults.tsx (~250 lines)
│   └── SubmissionForm.tsx (~200 lines)
└── types/
    └── ImageUploadTypes.ts
```

### Priority 2: Moderate Refactoring (800-1100 lines)

#### 5. RouteIssuesAdminPanel.tsx (1,065 lines)
**Refactoring:**
- Extract issue list component
- Separate issue detail view
- Create issue filters component
- Custom hooks for data fetching

#### 6. RouteAdminPanel.tsx (1,019 lines)
**Refactoring:**
- Extract route list component
- Separate route editor
- Create validation hooks
- Move API calls to service layer

### Priority 3: Minor Refactoring (600-849 lines)

#### 7. SimpleRouteForm.tsx (849 lines)
#### 8. AnnouncementAdminPanel.tsx (780 lines)
#### 9. TransitBusList.tsx (773 lines)
#### 10. VoiceContributionRecorder.tsx (674 lines)
#### 11. SearchResults.tsx (650 lines)
#### 12. TransitBusCard.tsx (630 lines)
#### 13. TextPasteContribution.tsx (627 lines)
#### 14. ReportIssue.tsx (614 lines)

## Refactoring Principles

### 1. Single Responsibility Principle
Each component should have one clear purpose:
- ✅ LocationPicker: Handle location selection
- ❌ SearchForm: Handle search + location + date + history + validation

### 2. Component Size Guidelines
- **Small components**: 50-150 lines (pure UI)
- **Medium components**: 150-300 lines (UI + logic)
- **Large components**: 300-500 lines (complex orchestration)
- **Too large**: >500 lines (needs refactoring)

### 3. Custom Hooks Pattern
Extract logic into custom hooks:
```typescript
// Before (in component)
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  fetchData().then(setData).finally(() => setLoading(false));
}, []);

// After (custom hook)
const { data, loading, error } = useDataFetch(fetchData);
```

### 4. Type Organization
Separate types from components:
```typescript
// types/ContributionTypes.ts
export interface Contribution { ... }
export interface OCRResult { ... }

// components/ContributionPanel.tsx
import { Contribution, OCRResult } from '../types/ContributionTypes';
```

### 5. Service Layer
Move API calls to services:
```typescript
// Before (in component)
const response = await fetch('/api/contributions');
const data = await response.json();

// After (in service)
import contributionService from '../services/contributionService';
const data = await contributionService.getAll();
```

## Step-by-Step Refactoring Process

### Phase 1: Preparation (No Breaking Changes)
1. **Create Directory Structure**
   ```bash
   mkdir -p components/admin/image-contributions/{hooks,components,types,utils}
   ```

2. **Extract Types**
   - Move interfaces to separate type files
   - Export from index.ts for easy imports

3. **Extract Utilities**
   - Pure functions (no React dependencies)
   - Validation logic
   - Data transformations

### Phase 2: Extract Custom Hooks
1. **Identify State Logic**
   - useState + useEffect patterns
   - Data fetching logic
   - Complex calculations

2. **Create Custom Hooks**
   ```typescript
   // hooks/useImageContributions.ts
   export function useImageContributions(filters: Filters) {
     const [data, setData] = useState<ImageContribution[]>([]);
     const [loading, setLoading] = useState(false);
     // ... logic
     return { data, loading, refresh };
   }
   ```

3. **Test Hooks**
   - Write unit tests for custom hooks
   - Ensure no regression

### Phase 3: Extract Child Components
1. **Identify UI Sections**
   - Self-contained UI blocks
   - Repeating patterns
   - Complex forms

2. **Create Child Components**
   ```typescript
   // components/ContributionFilters.tsx
   interface Props {
     filters: Filters;
     onFilterChange: (filters: Filters) => void;
   }
   
   export function ContributionFilters({ filters, onFilterChange }: Props) {
     // Filter UI logic
   }
   ```

3. **Update Parent Component**
   - Replace inline JSX with child components
   - Pass props and callbacks
   - Verify functionality

### Phase 4: Refactor Parent Component
1. **Use Extracted Hooks**
   ```typescript
   const { contributions, loading } = useImageContributions(filters);
   const { validate } = useRouteValidation();
   ```

2. **Compose Child Components**
   ```typescript
   return (
     <div>
       <ContributionFilters filters={filters} onFilterChange={setFilters} />
       <ContributionList items={contributions} loading={loading} />
       <ContributionDetail selected={selected} />
     </div>
   );
   ```

3. **Reduce Component Size**
   - Target: <300 lines for parent component
   - Most logic should be in hooks and child components

### Phase 5: Testing & Validation
1. **Unit Tests**
   - Test custom hooks
   - Test child components
   - Test utilities

2. **Integration Tests**
   - Test parent component with mocked dependencies
   - Verify data flow between components

3. **E2E Tests**
   - Test complete user flows
   - Ensure no regression

## Example Refactoring: ImageContributionAdminPanel

### Before (1,864 lines, one file)
```typescript
// ImageContributionAdminPanel.tsx
const ImageContributionAdminPanel: React.FC = () => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [filters, setFilters] = useState({ ... });
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  // ... 15+ more state variables
  
  // ... 500+ lines of logic
  
  return (
    <div>
      {/* 1300+ lines of JSX */}
    </div>
  );
};
```

### After (Multiple files, each <300 lines)
```typescript
// ImageContributionAdminPanel.tsx (~200 lines)
import { useImageContributions } from './hooks/useImageContributions';
import { ContributionFilters } from './components/ContributionFilters';
import { ContributionList } from './components/ContributionList';
import { ContributionDetail } from './components/ContributionDetail';

const ImageContributionAdminPanel: React.FC = () => {
  const { contributions, loading, refresh } = useImageContributions();
  const [selected, setSelected] = useState<ImageContribution | null>(null);

  return (
    <div className="admin-panel">
      <ContributionFilters onFilterChange={handleFilterChange} />
      <ContributionList 
        items={contributions} 
        loading={loading}
        onSelect={setSelected}
      />
      {selected && (
        <ContributionDetail 
          contribution={selected}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
```

## Benefits of Refactoring

### Maintainability
- ✅ Easier to understand small components
- ✅ Faster to locate bugs
- ✅ Simpler to modify individual features

### Testability
- ✅ Unit test hooks independently
- ✅ Test components with mock props
- ✅ Faster test execution

### Reusability
- ✅ Reuse hooks across components
- ✅ Share child components
- ✅ Extract common utilities

### Performance
- ✅ Smaller components re-render faster
- ✅ Better memoization opportunities
- ✅ Lazy load child components

### Team Collaboration
- ✅ Multiple developers can work on different components
- ✅ Clearer code ownership
- ✅ Reduced merge conflicts

## Implementation Timeline

### Immediate (This Sprint)
- ✅ Create this refactoring guide
- ⏳ Identify top 3 components for refactoring
- ⏳ Create directory structures

### Short-term (Next 2 Sprints)
- ⏳ Refactor ImageContributionAdminPanel (Priority 1)
- ⏳ Refactor TransitSearchForm (Priority 1)
- ⏳ Write tests for refactored components

### Mid-term (Next 4-6 Sprints)
- ⏳ Refactor remaining Priority 1 components
- ⏳ Refactor Priority 2 components
- ⏳ Update documentation

### Long-term (Ongoing)
- ⏳ Refactor Priority 3 components
- ⏳ Establish component size guidelines in PR reviews
- ⏳ Prevent large components from forming

## Tools & Automation

### ESLint Rules
Add rules to enforce component size:
```javascript
// .eslintrc.js
rules: {
  'max-lines': ['warn', { max: 300, skipBlankLines: true }],
  'max-lines-per-function': ['warn', { max: 50 }],
}
```

### VS Code Extensions
- **Component Complexity**: Highlight overly complex components
- **Line Count**: Show warnings for files >300 lines

### Pre-commit Hooks
```bash
# Check for large files before commit
if [ $(wc -l < $FILE) -gt 500 ]; then
  echo "Warning: $FILE is very large (>500 lines). Consider refactoring."
fi
```

## Best Practices Going Forward

### 1. Start Small
New components should be <200 lines initially

### 2. Extract Early
When a component reaches 250 lines, start planning extraction

### 3. Review Regularly
Monthly review of component sizes in code review metrics

### 4. Document Decisions
Document why components are organized in certain ways

### 5. Pair Programming
Refactor large components with another developer

## Conclusion

Component refactoring is an ongoing process. This guide provides:
- ✅ Clear identification of components needing work
- ✅ Structured approach to refactoring
- ✅ Best practices for future development
- ✅ Implementation timeline

**Goal**: No component >300 lines except for exceptional cases with clear justification.

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026  
**Next Review**: February 20, 2026  
**Owner**: Frontend Team
