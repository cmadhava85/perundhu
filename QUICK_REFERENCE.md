# Quick Reference: Code Standards

## Logger Usage

Replace `console.log` with structured logging:

```typescript
import { logDebug, logInfo, logWarn, logError } from '@/utils/logger';

// Development only
logDebug('Message', { component: 'ComponentName', ...context });

// General info
logInfo('Operation successful', { component: 'ServiceName' });

// Warnings
logWarn('Warning message', { component: 'ComponentName' });

// Errors
logError('Error message', error, { component: 'ComponentName' });
```

## TypeScript Best Practices

### ✅ DO
```typescript
// Use generics
function process<T>(data: T): T { return data; }

// Use unknown for errors
catch (error: unknown) {
  if (error instanceof Error) { }
}

// Use Record for objects
type Config = Record<string, string>;
```

### ❌ DON'T
```typescript
// Don't use any (ESLint will error)
function process(data: any) { }

// Don't ignore errors
catch (error) { } // Use: catch (error: unknown)
```

## Pre-Commit Commands

```bash
# Frontend
cd frontend
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run test        # Unit tests

# Backend
cd backend
./gradlew hexagonalTest  # Architecture validation
./gradlew test           # All tests
```

## Common ESLint Fixes

```typescript
// Unused variable - prefix with _
const [_unused, setUsed] = useState();

// Console statement - use logger
// console.log('msg') ❌
logDebug('msg', { component: 'Name' }) // ✅

// Any type - add proper type
// data: any ❌
data: SomeType // ✅
```

## File Locations

- Logger: `frontend/src/utils/logger.ts`
- ESLint config: `frontend/eslint.config.js`
- TypeScript config: `frontend/tsconfig.app.json`
- Vite config: `frontend/vite.config.ts`
- Copilot instructions: `.copilot/instructions/`
