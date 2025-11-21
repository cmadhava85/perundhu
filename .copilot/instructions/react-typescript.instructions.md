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

## Component Standards

### Functional Components
Always use functional components with hooks - class components are legacy

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
