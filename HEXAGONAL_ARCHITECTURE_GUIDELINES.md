# Hexagonal Architecture Guidelines

## Overview
This project follows Hexagonal Architecture (also known as Ports and Adapters) to maintain clean separation of concerns and enable testability and flexibility.

## Architecture Layers

### 1. Domain Layer (`com.perundhu.domain`)
**Purpose**: Core business logic and rules
**Dependencies**: None (cannot import from other layers)
**Contains**:
- `domain.model.*` - Business entities and value objects
- `domain.port.*` - Interfaces for external dependencies (repositories, services)
- `domain.service.*` - Domain service interfaces for complex business logic

**Rules**:
- ✅ Domain models can only depend on other domain models
- ✅ Domain ports define contracts for external dependencies
- ❌ NO imports from `application`, `infrastructure`, or `adapter` packages
- ❌ NO framework-specific annotations (except basic Java/JDK)

### 2. Application Layer (`com.perundhu.application`)
**Purpose**: Orchestrates business use cases
**Dependencies**: Can only import from `domain` layer
**Contains**:
- `application.service.*` - Use case implementations
- `application.port.input.*` - Input port interfaces (use case boundaries)
- `application.dto.*` - Data transfer objects

**Rules**:
- ✅ Can import from `com.perundhu.domain.*`
- ✅ Use domain ports to interact with external dependencies
- ❌ NO direct imports from `infrastructure` or `adapter` packages
- ❌ NO database, web, or framework-specific code

### 3. Infrastructure Layer (`com.perundhu.infrastructure`)
**Purpose**: Technical implementation details
**Dependencies**: Can import from `domain` and `application` layers
**Contains**:
- `infrastructure.adapter.out.persistence.*` - Database adapters
- `infrastructure.adapter.in.web.*` - Web controllers/REST adapters
- `infrastructure.adapter.service.*` - External service adapters
- `infrastructure.config.*` - Configuration and dependency injection

**Rules**:
- ✅ Implements domain ports
- ✅ Can use frameworks (Spring, JPA, etc.)
- ✅ Maps between domain models and external formats
- ❌ Should not contain business logic

## Common Violation Patterns to Avoid

### ❌ **Violation**: Application importing infrastructure
```java
// BAD - Application service importing infrastructure
package com.perundhu.application.service;
import com.perundhu.infrastructure.adapter.output.SomeOutputPort; // WRONG!
```

### ✅ **Correct**: Application using domain ports
```java
// GOOD - Application service using domain port
package com.perundhu.application.service;
import com.perundhu.domain.port.SomeOutputPort; // CORRECT!
```

### ❌ **Violation**: Duplicate interfaces across layers
```java
// BAD - Same interface in multiple packages
com.perundhu.domain.port.UserRepository
com.perundhu.infrastructure.adapter.output.UserRepository // DUPLICATE!
```

### ✅ **Correct**: Single interface in domain, implementation in infrastructure
```java
// GOOD - Interface in domain
com.perundhu.domain.port.UserRepository

// Implementation in infrastructure
com.perundhu.infrastructure.adapter.out.persistence.UserRepositoryImpl implements UserRepository
```

## Naming Conventions

### Ports (Interfaces)
- **Input Ports**: `*UseCase` or `*InputPort` (in application.port.input)
- **Output Ports**: `*Repository`, `*OutputPort`, `*Service` (in domain.port)

### Adapters (Implementations)
- **Web Adapters**: `*Controller` (in infrastructure.adapter.in.web)
- **Persistence Adapters**: `*RepositoryAdapter`, `*PersistenceAdapter` (in infrastructure.adapter.out.persistence)
- **Service Adapters**: `*ServiceImpl`, `*Adapter` (in infrastructure.adapter.service)

## File Creation Checklist

Before creating any new file, ask:

1. **What layer does this belong to?**
   - Business logic → Domain
   - Use case orchestration → Application  
   - Technical implementation → Infrastructure

2. **What can this file import?**
   - Domain → Nothing external
   - Application → Only Domain
   - Infrastructure → Domain + Application + Frameworks

3. **Does this create a duplicate interface?**
   - Check if similar interface exists
   - Consolidate if duplicate found

4. **Does this follow naming conventions?**
   - Ports end with Repository/Service/OutputPort
   - Adapters end with Impl/Adapter/Controller

## Development Workflow

### For New Features:
1. **Define Domain Model** (if needed)
2. **Create Domain Ports** (interfaces)
3. **Implement Application Services** (use cases)
4. **Create Infrastructure Adapters** (implementations)
5. **Wire Dependencies** in configuration

### Before Committing:
1. Run architecture validation (see tools below)
2. Check for import violations
3. Verify no duplicate interfaces
4. Test that business logic is in domain layer

## Validation Tools

### Manual Checks:
```bash
# Check for architecture violations
grep -r "import.*infrastructure" src/main/java/com/perundhu/application/
grep -r "import.*application" src/main/java/com/perundhu/domain/

# Find duplicate interfaces
find . -name "*.java" -type f | xargs grep -l "interface.*Repository"
find . -name "*.java" -type f | xargs grep -l "interface.*Service"
```

### Automated Tools (Recommended):
- **ArchUnit**: Add architectural tests
- **Dependency Rule Checker**: CI/CD integration
- **IDE Plugins**: Architecture validation plugins

## Configuration Management

### Dependency Injection Rules:
- Use `@Primary` for preferred implementations
- Use `@Qualifier` when multiple implementations needed
- Keep configuration in infrastructure layer
- Avoid `@Component` on domain models

### Bean Naming:
- Repository implementations: `*RepositoryAdapter`
- Service implementations: `*ServiceImpl`
- Output port implementations: `*OutputPortImpl`

## Code Review Guidelines

### Reviewer Checklist:
- [ ] No infrastructure imports in application layer
- [ ] No duplicate interfaces
- [ ] Business logic in domain layer only
- [ ] Proper use of dependency injection
- [ ] Follows naming conventions
- [ ] Tests validate business rules

### Red Flags:
- `@Entity` annotations in domain models
- Database queries in application services
- Business logic in controllers
- Multiple implementations without clear distinction

## Migration Strategy

When fixing violations:
1. **Identify the violation type**
2. **Choose the correct layer** for the concept
3. **Create proper interface** in domain if needed
4. **Update imports** systematically
5. **Remove duplicates** after migration
6. **Test thoroughly**

## Example Structure

```
src/main/java/com/perundhu/
├── domain/
│   ├── model/
│   │   ├── User.java
│   │   └── Order.java
│   ├── port/
│   │   ├── UserRepository.java (interface)
│   │   └── EmailService.java (interface)
│   └── service/
│       └── OrderValidationService.java (interface)
├── application/
│   ├── service/
│   │   └── UserManagementService.java
│   ├── port/
│   │   └── input/
│   │       └── CreateUserUseCase.java
│   └── dto/
│       └── UserDTO.java
└── infrastructure/
    ├── adapter/
    │   ├── in/
    │   │   └── web/
    │   │       └── UserController.java
    │   └── out/
    │       └── persistence/
    │           └── UserRepositoryAdapter.java
    ├── config/
    │   └── HexagonalConfig.java
    └── service/
        └── EmailServiceImpl.java
```

Remember: **The goal is to keep business logic independent of technical implementation details!**