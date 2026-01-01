# Hexagonal Architecture Guidelines

This document outlines the architectural principles and structure for the Perundhu backend application, which follows hexagonal architecture (also known as ports and adapters pattern).

## Architecture Overview

Hexagonal architecture organizes the codebase into layers with the domain model at the core and clearly separates external dependencies from internal business logic.

### Key Components

1. **Domain Layer**
   - Contains business entities, logic, and interfaces (ports)
   - Located in: `com.perundhu.domain`
   - Completely independent of frameworks, databases, or external services

2. **Application Layer**
   - Contains use case implementations (services)
   - Located in: `com.perundhu.application`
   - Orchestrates domain objects and business rules

3. **Adapter Layer**
   - Contains implementations of interfaces defined in domain layer
   - Two types:
     - Inbound adapters (REST controllers): `com.perundhu.adapter.in`
     - Outbound adapters (repositories, services): `com.perundhu.infrastructure`

## Package Structure

```
com.perundhu
├── adapter
│   └── in
│       └── rest       # Inbound adapters (REST controllers)
├── application
│   ├── dto            # Data transfer objects
│   └── service        # Application services (use cases)
├── domain
│   ├── model          # Domain entities
│   └── port           # Interfaces for external communication
├── infrastructure
│   ├── config         # Application configuration
│   ├── persistence    # Database and JPA related code
│   │   ├── adapter    # Repository implementations
│   │   ├── entity     # JPA entities
│   │   └── repository # Spring Data JPA interfaces
│   └── service        # External service implementations
└── util               # Utility classes
```

## Architectural Rules

1. **Dependencies Rule**: Dependencies should only point inward
   - Domain layer has no external dependencies
   - Application layer depends only on domain layer
   - Adapter layers can depend on domain and application layers

2. **Domain Model Independence**: Domain models should be free from infrastructure concerns
   - No JPA annotations in domain entities
   - No framework imports in domain classes

3. **Interface Segregation**: Interfaces are defined in the domain layer as ports
   - Input ports represent application services
   - Output ports represent external dependencies like repositories

4. **Adapter Implementation**: Adapters implement ports defined in the domain
   - Controllers implement input ports
   - Repository adapters implement output ports

## Examples

### Domain Port (Interface)
```java
package com.perundhu.domain.port;

public interface RouteContributionRepository {
    // Methods to be implemented by adapter
}
```

### Application Service
```java
package com.perundhu.application.service;

import com.perundhu.domain.port.RouteContributionRepository;
// ...

public class ContributionService {
    private final RouteContributionRepository repository;
    // Implementation
}
```

### Adapter Implementation
```java
package com.perundhu.infrastructure.persistence.adapter;

import com.perundhu.domain.port.RouteContributionRepository;
// ...

public class RouteContributionRepositoryAdapter implements RouteContributionRepository {
    // Implementation that connects to actual database
}
```

## Migration Guidelines

When working with the existing codebase:

1. Move all controllers to `adapter.in.rest` package
2. Ensure repository interfaces are defined in `domain.port`
3. Create clean domain models without infrastructure dependencies 
4. Implement repositories in `infrastructure.persistence.adapter`
5. Keep business logic in application services

## Benefits

- **Testability**: Domain and application layers can be tested independently
- **Maintainability**: Clear separation makes code easier to understand and maintain
- **Flexibility**: External components can be replaced with minimal impact
