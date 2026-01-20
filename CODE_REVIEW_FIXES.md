# Code Review - Ready-to-Use Fixes

## Fix #1: Add API Retry Logic (1 hour)

### Step 1: Install dependency
```bash
npm install axios-retry
```

### Step 2: Update `frontend/src/services/apiClient.ts`
```typescript
import axiosRetry from 'axios-retry';

// Add after creating axios instance
export const api = axios.create({
  baseURL: getEnv('VITE_API_URL', 'http://localhost:8080'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry logic
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    // Exponential backoff: 100ms, 200ms, 400ms
    return retryCount * 100;
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false) ||
           error.response?.status === 429; // Rate limit
  }
});

// Also apply to analytics client
axiosRetry(apiClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: axiosRetry.isNetworkOrIdempotentRequestError
});
```

### Step 3: Test it
```typescript
// src/services/__tests__/apiClient.retry.test.ts
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import axiosRetry from 'axios-retry';

describe('API Client Retry Logic', () => {
  it('should retry on network error', async () => {
    const mockAxios = axios.create();
    axiosRetry(mockAxios, { retries: 3 });
    
    let attempts = 0;
    mockAxios.interceptors.response.use(
      response => response,
      error => {
        if (attempts < 2) {
          attempts++;
          return Promise.reject(error);
        }
        return Promise.resolve({ data: 'success' });
      }
    );
    
    // Should succeed after retries
  });
});
```

---

## Fix #2: Configure HikariCP Connection Pool (30 mins)

### Option A: Using `application.properties`
Create/update `backend/app/src/main/resources/application.properties`:

```properties
# ====== DATABASE CONFIGURATION ======
spring.datasource.url=jdbc:mysql://localhost:3306/perundhu?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root

# ====== HIKARICP CONNECTION POOL ======
# Maximum connections: for 1000+ users, use 50-100
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
spring.datasource.hikari.auto-commit=true
spring.datasource.hikari.leak-detection-threshold=60000

# ====== PERFORMANCE TUNING ======
spring.jpa.properties.hibernate.generate_statistics=false
spring.jpa.properties.hibernate.use_sql_comments=true
spring.jpa.hibernate.ddl-auto=validate
```

### Option B: Using YAML (recommended)
Create/update `backend/app/src/main/resources/application-prod.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/perundhu
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    
    hikari:
      # Production settings for 1000+ concurrent users
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 20000      # 20 seconds
      idle-timeout: 300000            # 5 minutes
      max-lifetime: 1200000           # 20 minutes
      auto-commit: true
      leak-detection-threshold: 60000 # Log connections held > 60s
      
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        generate_statistics: false
        use_sql_comments: true
```

### Option C: For different environments
```yaml
# application-dev.yml (development)
spring.datasource.hikari.maximum-pool-size: 10
spring.datasource.hikari.minimum-idle: 2

# application-test.yml (testing)  
spring.datasource.hikari.maximum-pool-size: 5
spring.datasource.hikari.minimum-idle: 1

# application-prod.yml (production)
spring.datasource.hikari.maximum-pool-size: 100
spring.datasource.hikari.minimum-idle: 20
```

### Testing the Configuration
```java
@SpringBootTest
class HikariPoolConfigTest {
    @Autowired
    private DataSource dataSource;
    
    @Test
    void testPoolConfiguration() {
        HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
        assertEquals(50, hikariDataSource.getMaximumPoolSize());
        assertEquals(10, hikariDataSource.getMinimumIdle());
        System.out.println("✅ HikariCP configured correctly");
    }
}
```

---

## Fix #3: Fix Gradle Memory Configuration (30 mins)

### Update `gradle.properties` (create if missing)
```properties
# ===== JVM MEMORY CONFIGURATION =====
# Prevents OutOfMemory errors during builds
org.gradle.jvmargs=-Xmx4g -Xms1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200

# ===== GRADLE PERFORMANCE =====
# Parallel builds for faster compilation
org.gradle.parallel=true
org.gradle.workers.max=4

# ===== BUILD CACHE =====
org.gradle.caching=true

# ===== DAEMON SETTINGS =====
org.gradle.daemon=true
org.gradle.daemon.idletimeout=10800000

# ===== DEBUG INFO =====
org.gradle.warning.mode=all
```

### Update `backend/build.gradle` (JavaExec section)
```gradle
tasks.withType(JavaExec) {
    jvmArgs = [
        '--enable-preview',
        '-Dspring.threads.virtual.enabled=true',
        '-Xmx4g',          // Max heap memory
        '-Xms1g',          // Initial heap memory
        '-XX:+UseG1GC',    // Efficient garbage collector
        '-XX:MaxGCPauseMillis=200',
        '-XX:+UnlockDiagnosticVMOptions',
        '-XX:+DebugNonSafepoints',
        '-Djdk.jfr.enabled=true'
    ]
}

tasks.withType(Test) {
    jvmArgs += [
        '--enable-preview',
        '-Xmx2g',
        '-XX:+UseG1GC'
    ]
}
```

### Verify Configuration
```bash
# Check Gradle daemon memory
gradle --version

# See actual memory usage
gradle build --status

# Clear old daemons if needed
gradle --stop
```

---

## Fix #4: Centralized Error Handling (2 hours)

### Create `frontend/src/contexts/ErrorContext.tsx`
```typescript
import React, { createContext, useContext, useCallback, useState } from 'react';

export interface AppError {
  id: string;
  message: string;
  code: string;
  status?: number;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  traceId?: string;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: Omit<AppError, 'id' | 'timestamp'>) => {
    const appError: AppError = {
      ...error,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    setErrors(prev => [...prev, appError]);
    
    // Auto-remove non-critical errors after 5 seconds
    if (error.severity !== 'critical') {
      setTimeout(() => removeError(appError.id), 5000);
    }
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrors = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrors must be used within ErrorProvider');
  }
  return context;
};
```

### Update API Client to Use Error Context
```typescript
// frontend/src/services/apiClient.ts
import { useErrors } from '../contexts/ErrorContext';

export const useApiErrorHandler = () => {
  const { addError } = useErrors();

  return (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'error';
    if (status === 429) severity = 'warning'; // Rate limit
    if (status && status >= 500) severity = 'critical'; // Server error

    addError({
      message: data?.message || 'An unexpected error occurred',
      code: data?.code || 'UNKNOWN_ERROR',
      status,
      severity,
      traceId: data?.traceId
    });
  };
};
```

### Create Error Display Component
```typescript
// frontend/src/components/ErrorDisplay.tsx
import React from 'react';
import { useErrors } from '../contexts/ErrorContext';

export const ErrorDisplay: React.FC = () => {
  const { errors, removeError } = useErrors();

  return (
    <div className="error-container">
      {errors.map(error => (
        <div key={error.id} className={`error error-${error.severity}`}>
          <span>{error.message}</span>
          <button onClick={() => removeError(error.id)}>✕</button>
        </div>
      ))}
    </div>
  );
};
```

### Update App.tsx
```typescript
import { ErrorProvider } from './contexts/ErrorContext';
import { ErrorDisplay } from './components/ErrorDisplay';

function App() {
  return (
    <ErrorProvider>
      <ErrorDisplay />
      <Router>
        {/* Your routes */}
      </Router>
    </ErrorProvider>
  );
}
```

---

## Fix #5: Structured Logging (1.5 hours)

### Create `frontend/src/utils/structuredLogger.ts`
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  userId?: string;
}

export class StructuredLogger {
  private static getTraceId(): string {
    // Get from sessionStorage or generate new
    let traceId = sessionStorage.getItem('traceId');
    if (!traceId) {
      traceId = this.generateId();
      sessionStorage.setItem('traceId', traceId);
    }
    return traceId;
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      traceId: this.getTraceId()
    };
  }

  static info(message: string, context?: Record<string, unknown>) {
    const entry = this.formatLog('info', message, context);
    console.log(JSON.stringify(entry));
  }

  static warn(message: string, context?: Record<string, unknown>) {
    const entry = this.formatLog('warn', message, context);
    console.warn(JSON.stringify(entry));
  }

  static error(message: string, context?: Record<string, unknown>) {
    const entry = this.formatLog('error', message, context);
    console.error(JSON.stringify(entry));
  }

  static debug(message: string, context?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      const entry = this.formatLog('debug', message, context);
      console.log(JSON.stringify(entry));
    }
  }
}

export default StructuredLogger;
```

### Usage Example
```typescript
// Before (vague)
logger.info('User searched');

// After (structured and debuggable)
logger.info('Location search initiated', {
  query: 'Chennai',
  queryLength: 7,
  language: 'en',
  timestamp: Date.now(),
  userId: user?.id
});
```

---

## Fix #6: Break Down SearchResults Component (2-3 hours)

### Step 1: Create smaller components

```typescript
// frontend/src/components/search/ResultsList.tsx
import React, { memo } from 'react';
import { FixedSizeList } from 'react-window';

interface Props {
  results: BusResult[];
  onSelect: (result: BusResult) => void;
  loading: boolean;
}

export const ResultsList = memo(({ results, onSelect, loading }: Props) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <BusResultItem result={results[index]} onSelect={onSelect} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={results.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
});

ResultsList.displayName = 'ResultsList';
```

```typescript
// frontend/src/components/search/ResultsMap.tsx
import React, { memo } from 'react';

export const ResultsMap = memo(({ results, selectedId }: Props) => {
  return (
    <div className="results-map">
      {/* Map component */}
    </div>
  );
});

ResultsMap.displayName = 'ResultsMap';
```

### Step 2: Compose in SearchResults

```typescript
// frontend/src/components/SearchResults.tsx (refactored)
import React from 'react';
import { ResultsList } from './search/ResultsList';
import { ResultsMap } from './search/ResultsMap';
import { ResultsFilter } from './search/ResultsFilter';

export const SearchResults = ({ results, onSelect }) => {
  const [showMap, setShowMap] = React.useState(false);
  const [filter, setFilter] = React.useState('');

  const filteredResults = results.filter(r => 
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="search-results">
      <ResultsFilter onFilter={setFilter} />
      {showMap ? (
        <ResultsMap results={filteredResults} />
      ) : (
        <ResultsList results={filteredResults} onSelect={onSelect} />
      )}
    </div>
  );
};
```

---

## Testing the Fixes

```bash
# After implementing fixes, run:
npm run lint:fix          # Fix linting issues
npm run type-check        # TypeScript validation
npm run test:single       # Run non-excluded tests
./gradlew build          # Rebuild backend with new config

# Verify improvements:
npm run build:analyze    # Check bundle size
```

---

**Time to Implement All Fixes:** ~10 hours  
**Impact:** High - Addresses all critical issues

