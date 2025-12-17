---
description: 'React 18 + TypeScript + Vite best practices for Perundhu Bus Tracker'
applyTo: 'frontend/**/*.{ts,tsx,jsx}'
---

# React + TypeScript Development Guidelines

## Project Context
- React 18.3 with TypeScript 5.6
- Vite 5.4 as build tool
- React Router v6 for routing  
- React i18next for internationalization
- Leaflet for maps (OpenStreetMap)
- Material UI for components
- TailwindCSS for styling
- Vitest + React Testing Library for unit tests
- Playwright for E2E tests

## ⚠️ CRITICAL: Before Creating New Frontend Module

1. **Check existing patterns:**
   ```bash
   ls frontend/src/services/      # Service patterns
   ls frontend/src/contexts/      # Context patterns  
   ls frontend/src/components/    # Component patterns
   ```

2. **Create files in this ORDER for new features:**
   ```
   1. Types         → types/featureTypes.ts (interfaces)
   2. Service       → services/featureService.ts (API calls)
   3. Context       → contexts/FeatureContext.tsx (state management)
   4. Components    → components/Feature.tsx + Feature.css
   5. Tests         → __tests__/services/featureService.test.ts
   6. Integration   → Update App.tsx with provider if needed
   ```

## Actual Project Structure (Current Codebase)

```
frontend/src/
├── components/              # React components (organized by feature)
│   ├── admin/               # Admin dashboard components
│   ├── auth/                # Authentication components
│   ├── bus/                 # Bus-related components
│   ├── contribution/        # Contribution flow components
│   ├── common/              # Shared/reusable components
│   └── *.tsx                # Top-level components
├── contexts/                # React Context providers
│   ├── AdminAuthContext.tsx
│   └── FeatureFlagsContext.tsx
├── context/                 # Alternative context location
│   └── ThemeContext.tsx
├── services/                # API service modules
│   ├── adminService.ts      # Admin API calls
│   ├── authService.ts       # Auth handling
│   ├── busTimingService.ts  # Bus timing API
│   └── *.ts                 # Other services
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── styles/                  # Global styles
└── __tests__/               # Test files (mirrors src structure)
```

## Service Pattern (ACTUAL - Follow adminService.ts)

```typescript
// services/featureService.ts
import axios from 'axios';
import { logger } from '../utils/logger';
import AuthService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const FeatureService = {
  // Helper for auth header
  getAuthHeader: (): string => {
    const token = AuthService.getToken();
    return token ? `Bearer ${token}` : '';
  },

  // API methods as object properties
  getItems: async (): Promise<ItemType[]> => {
    const response = await axios.get(`${API_URL}/api/items`, {
      headers: { Authorization: FeatureService.getAuthHeader() }
    });
    return response.data;
  },

  createItem: async (data: CreateItemRequest): Promise<ItemType> => {
    try {
      const response = await axios.post(`${API_URL}/api/items`, data, {
        headers: { Authorization: FeatureService.getAuthHeader() }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to create item', error);
      throw error;
    }
  }
};

export default FeatureService;
```

## Context Pattern (ACTUAL - Follow FeatureFlagsContext.tsx)

```typescript
// contexts/FeatureContext.tsx
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import FeatureService from '../services/featureService';

// 1. Define interfaces
interface FeatureState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

interface FeatureContextType extends FeatureState {
  refreshItems: () => Promise<void>;
  addItem: (item: Item) => void;
}

// 2. Storage key for persistence (if needed)
const STORAGE_KEY = 'feature_data';

// 3. Default values
const defaultState: FeatureState = {
  items: [],
  isLoading: false,
  error: null
};

// 4. Create context
const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

// 5. Provider component
interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const [state, setState] = useState<FeatureState>(defaultState);

  const refreshItems = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const items = await FeatureService.getItems();
      setState(prev => ({ ...prev, items, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      }));
    }
  }, []);

  const addItem = useCallback((item: Item) => {
    setState(prev => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  return (
    <FeatureContext.Provider value={{ ...state, refreshItems, addItem }}>
      {children}
    </FeatureContext.Provider>
  );
};

// 6. Custom hook with error if used outside provider
export const useFeature = (): FeatureContextType => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }
  return context;
};

export default FeatureContext;
```

## Component Standards

### Functional Components
Always use functional components with hooks - class components are legacy

### Component Pattern (with CSS module)
```typescript
// components/Feature.tsx
import React, { useState, useEffect } from 'react';
import { useFeature } from '../contexts/FeatureContext';
import './Feature.css';

interface FeatureProps {
  initialValue?: string;
  onComplete?: (result: string) => void;
}

const Feature: React.FC<FeatureProps> = ({ initialValue = '', onComplete }) => {
  const { items, isLoading, refreshItems } = useFeature();
  const [localState, setLocalState] = useState(initialValue);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const handleAction = () => {
    onComplete?.(localState);
  };

  if (isLoading) {
    return <div className="feature-loading">Loading...</div>;
  }

  return (
    <div className="feature-container">
      {items.map(item => (
        <div key={item.id} className="feature-item">
          {item.name}
        </div>
      ))}
      <button onClick={handleAction}>Complete</button>
    </div>
  );
};

export default Feature;
```

### Custom Hooks
- Use custom hooks for reusable stateful logic
- Prefix with `use` (e.g., `useLocationData`, `useBusSearch`)
- Extract complex logic from components
- Return objects with named properties

## Performance Optimization

### Memoization
- Use `React.memo` for expensive components that receive stable props
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to child components
- Don't over-optimize - measure first

### Code Splitting
Use lazy loading for routes and heavy components

## Testing

### Service Tests (Follow adminService.test.ts pattern)
```typescript
// __tests__/services/featureService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import FeatureService from '../../services/featureService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('FeatureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItems', () => {
    it('should fetch items successfully', async () => {
      const mockItems = [{ id: 1, name: 'Test' }];
      mockedAxios.get.mockResolvedValueOnce({ data: mockItems });

      const result = await FeatureService.getItems();

      expect(result).toEqual(mockItems);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.any(Object)
      );
    });
  });
});
```

### Unit Tests with Vitest
- Test component behavior, not implementation details
- Use React Testing Library best practices
- Mock external dependencies

### E2E Tests with Playwright
- Test critical user journeys
- Use data-testid for stable selectors
- Test across different viewports

## Anti-Patterns to Avoid

❌ Don't mutate state directly
❌ Don't use inline object/array literals in dependency arrays
❌ Don't forget cleanup in useEffect
❌ Don't use index as key in lists
❌ Don't ignore TypeScript errors
❌ Don't use `any` type unless absolutely necessary
❌ Don't import from `contexts/` and `context/` inconsistently - pick one
❌ Don't bypass service layer - always use services for API calls
❌ Don't duplicate service methods - check existing services first

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | `PascalCase.tsx` | `AdminSettingsPanel.tsx` |
| Services | `camelCase.ts` | `adminService.ts` |
| Contexts | `PascalCase.tsx` | `FeatureFlagsContext.tsx` |
| Hooks | `usePascalCase.ts` | `useFeatureFlags.ts` |
| Types | `camelCaseTypes.ts` | `contributionTypes.ts` |
| Styles | `PascalCase.css` | `AdminSettingsPanel.css` |
| Tests | `*.test.ts(x)` | `adminService.test.ts` |
