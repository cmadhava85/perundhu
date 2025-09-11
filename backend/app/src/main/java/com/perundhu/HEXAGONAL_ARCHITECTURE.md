# Strict Hexagonal Architecture Implementation

This document outlines the strict hexagonal architecture implementation for the Perundhu backend application.

## Architecture Overview

The codebase now follows strict hexagonal architecture principles with clear separation of concerns:

```
Domain Layer (Core)
├── domain/model/          # Domain entities (no framework dependencies)
├── domain/port/           # Interfaces for external communication
│   ├── *InputPort         # Use case interfaces (implemented by application services)
│   └── *OutputPort        # External dependency interfaces (implemented by adapters)
└── domain/service/        # Pure domain services

Application Layer
└── application/service/   # Use case implementations (depend only on domain ports)

Infrastructure Layer
├── adapter/
│   ├── in/rest/          # Inbound adapters (REST controllers)
│   └── out/persistence/  # Outbound adapters (database implementations)
├── persistence/          # JPA entities and repositories
└── config/              # Dependency injection configuration
```

## Key Principles Enforced

### 1. Dependency Direction Rule
- **Domain Layer**: No external dependencies
- **Application Layer**: Depends only on domain ports
- **Infrastructure Layer**: Implements domain ports, depends on domain and application

### 2. Port Naming Convention
- **Input Ports**: `*InputPort` (e.g., `ContributionInputPort`)
- **Output Ports**: `*OutputPort` (e.g., `RouteContributionOutputPort`)
- **Domain Services**: Descriptive names (e.g., `LocationValidationService`)

### 3. Package Structure
```
com.perundhu/
├── adapter/
│   └── in/
│       └── rest/                    # REST controllers (inbound adapters)
├── application/
│   └── service/                     # Use case implementations
├── domain/
│   ├── model/                       # Domain entities
│   ├── port/                        # Domain interfaces
│   └── service/                     # Domain services
└── infrastructure/
    ├── adapter/
    │   └── out/
    │       └── persistence/         # Database adapters (outbound)
    ├── config/                      # Configuration
    └── persistence/                 # JPA infrastructure
```

## Implementation Details

### Input Ports (Use Cases)
```java
// Example: ContributionInputPort
public interface ContributionInputPort {
    RouteContribution submitRouteContribution(Map<String, Object> data, String userId);
    List<Map<String, Object>> getUserContributions(String userId);
    void approveRouteContribution(String id, String adminId);
    // ... other use cases
}
```

### Output Ports (External Dependencies)
```java
// Example: RouteContributionOutputPort
public interface RouteContributionOutputPort {
    RouteContribution save(RouteContribution contribution);
    Optional<RouteContribution> findById(String id);
    List<RouteContribution> findByStatus(String status);
    // ... other persistence operations
}
```

### Application Services (Input Port Implementations)
```java
@Service
public class ContributionApplicationService implements ContributionInputPort {
    private final RouteContributionOutputPort routeContributionOutputPort;
    private final ImageContributionOutputPort imageContributionOutputPort;
    
    // Implements all use cases by orchestrating domain objects
    // and calling output ports
}
```

### Outbound Adapters (Output Port Implementations)
```java
@Component
public class RouteContributionPersistenceAdapter implements RouteContributionOutputPort {
    private final RouteContributionJpaRepository repository;
    
    // Implements persistence operations using JPA
    // Maps between domain models and JPA entities
}
```

### Inbound Adapters (Controllers)
```java
@RestController
public class ContributionController {
    private final ContributionInputPort contributionInputPort;
    
    // Handles HTTP requests and delegates to input port
    // No direct dependencies on persistence or business logic
}
```

## Benefits Achieved

### 1. Testability
- Domain and application layers can be tested independently
- Easy to mock external dependencies through ports
- Clear boundaries for unit vs integration tests

### 2. Maintainability
- Clear separation of concerns
- Changes to external systems (database, APIs) don't affect business logic
- Easy to understand data flow

### 3. Flexibility
- External components can be replaced without changing business logic
- Easy to add new adapters (e.g., different databases, message queues)
- Framework-independent domain logic

### 4. Enforced Architecture
- Dependency injection configuration enforces architectural boundaries
- No accidental violations of dependency direction
- Clear contracts through interfaces

## Migration from Previous Architecture

### What Was Fixed
1. **Multiple competing implementations** removed
2. **Inconsistent naming** standardized to `*InputPort`/`*OutputPort`
3. **Package structure** reorganized for clarity
4. **Dependency direction** violations eliminated
5. **Spring bean conflicts** resolved

### Files Removed
- Duplicate repository adapters
- Competing JPA entity classes
- Mixed responsibility adapters

### Files Added
- Proper input/output port interfaces
- Clean application services
- Structured outbound adapters
- Comprehensive configuration

## Development Guidelines

### Adding New Features
1. **Define the use case** in an input port interface
2. **Define external dependencies** in output port interfaces
3. **Implement the use case** in an application service
4. **Create adapters** for external systems
5. **Wire dependencies** in configuration

### Testing Strategy
1. **Unit tests** for domain models and services (no Spring context)
2. **Integration tests** for adapters (with real external systems)
3. **Contract tests** for port implementations
4. **End-to-end tests** through REST controllers

### Code Review Checklist
- [ ] Domain layer has no external dependencies
- [ ] Application services depend only on domain ports
- [ ] Adapters implement domain ports correctly
- [ ] Package structure follows conventions
- [ ] Proper error handling and logging
- [ ] Tests cover all architectural layers

This implementation ensures long-term maintainability and adherence to clean architecture principles.