---
description: 'Java Spring Boot backend coding standards with Hexagonal Architecture enforcement'
applyTo: 'backend/**/*.java'
---

# Java Spring Boot Backend Standards

## Project Context
- **Java Version**: 17 LTS
- **Spring Boot**: 3.4.5
- **Build Tool**: Gradle 8.14
- **Database**: MySQL with Flyway migrations
- **Security**: Spring Security with OAuth2 JWT
- **Testing**: JUnit 5, Mockito, ArchUnit 1.2.1
- **Architecture**: Hexagonal/Ports & Adapters Pattern

## Hexagonal Architecture Rules (ENFORCED BY ARCHUNIT)

### Layer Structure
```
com.perundhu/
├── domain/           # Core business logic (NO external dependencies)
│   ├── model/        # Business entities and value objects
│   ├── port/         # Interfaces for external dependencies
│   └── exception/    # Domain-specific exceptions
├── application/      # Use case orchestration (depends ONLY on domain)
│   ├── service/      # Use case implementations
│   └── dto/          # Data transfer objects
└── infrastructure/   # Technical implementations (depends on domain + application)
    ├── persistence/  # Database adapters
    │   ├── entity/   # JPA entities (NOT in domain)
    │   ├── jpa/      # JPA repositories
    │   └── adapter/  # Repository adapters implementing domain ports
    ├── adapter/      # External service adapters
    ├── config/       # Spring configuration
    └── security/     # Security configuration
```

### ❌ VIOLATIONS THAT WILL FAIL ARCHUNIT TESTS

#### 1. Domain Layer Dependencies
```java
// ❌ BAD - Domain importing from application
package com.perundhu.domain.model;
import com.perundhu.application.service.SomeService; // VIOLATION!

// ❌ BAD - Domain importing from infrastructure
package com.perundhu.domain.model;
import com.perundhu.infrastructure.persistence.entity.SomeEntity; // VIOLATION!

// ❌ BAD - Domain model with framework annotations
package com.perundhu.domain.model;
@Entity  // VIOLATION! JPA in domain layer
@Component  // VIOLATION! Spring in domain layer
public class User { }

// ✅ CORRECT - Clean domain model
package com.perundhu.domain.model;
public class User {
    private final String name;
    // Pure business logic only
}
```

#### 2. Application Layer Dependencies
```java
// ❌ BAD - Application importing from infrastructure
package com.perundhu.application.service;
import com.perundhu.infrastructure.persistence.adapter.SomeAdapter; // VIOLATION!

// ✅ CORRECT - Application using domain ports
package com.perundhu.application.service;
import com.perundhu.domain.port.SomeRepository; // CORRECT!
```

#### 3. Domain Ports Must Be Interfaces
```java
// ❌ BAD - Port as concrete class
package com.perundhu.domain.port;
public class UserRepository { } // VIOLATION!

// ✅ CORRECT - Port as interface
package com.perundhu.domain.port;
public interface UserRepository { }
```

#### 4. Framework Annotations Only in Infrastructure
```java
// ❌ BAD - @Configuration in domain
package com.perundhu.domain.config;
@Configuration  // VIOLATION!
public class DomainConfig { }

// ✅ CORRECT - @Configuration in infrastructure
package com.perundhu.infrastructure.config;
@Configuration
public class HexagonalConfig { }
```

### ✅ CORRECT PATTERNS

#### Domain Layer (NO framework dependencies)
```java
// Domain Model - Pure business entity
package com.perundhu.domain.model;

public class Bus {
    private final BusId id;
    private final String number;
    private final String name;
    
    public Bus(BusId id, String number, String name) {
        validateBusNumber(number); // Business validation
        this.id = id;
        this.number = number;
        this.name = name;
    }
    
    private void validateBusNumber(String number) {
        if (number == null || number.isBlank()) {
            throw new DomainValidationException("Bus number required");
        }
    }
}

// Domain Port - Interface defining contract
package com.perundhu.domain.port;

public interface BusRepository {
    Optional<Bus> findById(BusId id);
    Bus save(Bus bus);
    List<Bus> findByRoute(String routeNumber);
}
```

#### Infrastructure Layer (Implements domain ports)
```java
// JPA Entity - Infrastructure concern
package com.perundhu.infrastructure.persistence.entity;

@Entity
@Table(name = "buses")
public class BusJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String number;
    
    private String name;
    // JPA-specific code
}

// Repository Adapter - Implements domain port
package com.perundhu.infrastructure.persistence.adapter;

public class BusJpaRepositoryAdapter implements BusRepository {
    private final BusJpaRepository jpaRepository;
    private final BusMapper mapper;
    
    // Managed by HexagonalConfig, NOT @Repository annotation
    public BusJpaRepositoryAdapter(BusJpaRepository jpaRepository, BusMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    
    @Override
    public Optional<Bus> findById(BusId id) {
        return jpaRepository.findById(id.getValue())
            .map(mapper::toDomain);
    }
}

// Configuration - Wire dependencies
package com.perundhu.infrastructure.config;

@Configuration
public class HexagonalConfig {
    
    @Bean
    public BusRepository busRepository(
            BusJpaRepository jpaRepository,
            BusMapper mapper) {
        return new BusJpaRepositoryAdapter(jpaRepository, mapper);
    }
}
```

## Core Principles

1. **Dependency Rule**: Dependencies flow inward (Infrastructure → Application → Domain)
2. **Interface Segregation**: Domain defines ports, infrastructure implements them
3. **Pure Domain**: No framework annotations in domain layer
4. **Testability**: Business logic testable without infrastructure

## Naming Conventions

### Domain Layer
- **Models**: `Bus`, `Stop`, `Location`, `RouteContribution`
- **Value Objects**: `BusId`, `StopId`, `LocationId` (immutable)
- **Ports**: `*Repository`, `*Service`, `*OutputPort` (interfaces)
- **Exceptions**: `*Exception` in `domain.exception`

### Infrastructure Layer
- **JPA Entities**: `*JpaEntity` in `infrastructure.persistence.entity`
- **JPA Repos**: `*JpaRepository` in `infrastructure.persistence.jpa`
- **Adapters**: `*Adapter`, `*RepositoryAdapter` in `infrastructure.persistence.adapter`
- **Configs**: `*Config` in `infrastructure.config`

### Application Layer
- **Services**: `*Service` in `application.service`
- **DTOs**: `*DTO`, `*Request`, `*Response` in `application.dto`

## Dependency Injection Pattern

### ❌ AVOID - Spring annotations on adapters
```java
package com.perundhu.infrastructure.persistence.adapter;

@Repository  // ❌ AVOID - Managed by HexagonalConfig instead
public class BusRepositoryAdapter implements BusRepository { }
```

### ✅ PREFER - Configuration-based bean registration
```java
// HexagonalConfig.java
@Configuration
public class HexagonalConfig {
    
    @Bean
    public BusRepository busRepository(
            BusJpaRepository jpaRepo,
            BusMapper mapper) {
        return new BusRepositoryAdapter(jpaRepo, mapper);
    }
    
    // Use @Primary when multiple implementations exist
    @Bean
    @Primary
    public TranslationService cachingTranslationService(
            TranslationRepository repo) {
        return new CachingTranslationServiceImpl(repo);
    }
    
    // Use @Qualifier for alternative implementations
    @Bean
    @Qualifier("stub")
    public TranslationService stubTranslationService() {
        return new StubTranslationServiceImpl();
    }
}
```

## Mapper Pattern

```java
// Infrastructure mapper - Domain ↔ JPA Entity
@Component
public class BusMapper {
    
    public Bus toDomain(BusJpaEntity entity) {
        return new Bus(
            new BusId(entity.getId()),
            entity.getNumber(),
            entity.getName()
        );
    }
    
    public BusJpaEntity toEntity(Bus domain) {
        BusJpaEntity entity = new BusJpaEntity();
        entity.setId(domain.getId().getValue());
        entity.setNumber(domain.getNumber());
        entity.setName(domain.getName());
        return entity;
    }
}
```
### Constructor Injection
- **ALWAYS** use constructor injection for required dependencies
- Declare dependencies as `private final`
- Avoid `@Autowired` field injection

```java
// ✅ GOOD: Constructor injection
@Service
public class BusService {
    private final BusRepository busRepository;
    private final LocationService locationService;
    
    public BusService(BusRepository busRepository, LocationService locationService) {
        this.busRepository = busRepository;
        this.locationService = locationService;
    }
}
```

## Configuration

- Use `application.yml` for configuration (better readability)
- Use `@ConfigurationProperties` for type-safe configuration
- Use Spring Profiles for environment-specific config
- Never hardcode secrets - use environment variables

## Service Layer

- Place business logic in `@Service` classes
- Services should be stateless
- Use `@Transactional` on service methods
- Return DTOs, not entities

## Repository Layer

- Extend `JpaRepository` or `CrudRepository`
- Use method naming conventions for query derivation
- Use `@Query` for complex queries
- Keep repositories thin - logic belongs in services

## Logging

```java
// ✅ GOOD: SLF4J logging
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BusService {
    private static final Logger logger = LoggerFactory.getLogger(BusService.class);
    
    public Bus findBus(Long id) {
        logger.debug("Finding bus with id: {}", id);
        return busRepository.findById(id)
            .orElseThrow(() -> {
                logger.error("Bus not found: {}", id);
                return new BusNotFoundException(id);
            });
    }
}
```

## Error Handling

- Use `@ControllerAdvice` for global exception handling
- Create custom exception classes
- Return consistent error responses

## Security

- Use Spring Security for authentication/authorization
- Implement OAuth2 JWT resource server
- Apply method-level security where needed
- Validate all inputs

## Testing

### ArchUnit Tests (Architecture Validation)

**CRITICAL**: All architecture rules are validated by `HexagonalArchitectureTest.java` using ArchUnit 1.2.1.

#### Active ArchUnit Rules
```java
// These tests WILL FAIL if violated:

@Test
void domainLayerShouldNotDependOnApplicationLayer()
// Domain cannot import from ..application.. package

@Test
void domainLayerShouldNotDependOnInfrastructureLayer()
// Domain cannot import from ..infrastructure.. package

@Test
void applicationLayerShouldNotDependOnInfrastructureLayer()
// Application cannot import from ..infrastructure.. package

@Test
void configurationShouldOnlyBeInInfrastructureLayer()
// @Configuration only in ..infrastructure.config.. or ..infrastructure.security..

@Test
void domainModelsShouldNotUseFrameworkAnnotations()
// Domain models cannot have @Component, @Service, @Repository, @Entity

@Test
void repositoriesShouldBeInterfaces()
// Classes ending with "Repository" in ..domain.port.. must be interfaces

@Test
void outputPortsShouldBeInterfaces()
// Classes ending with "OutputPort" in ..domain.port.. must be interfaces

@Test
void domainServicesShouldBeInterfaces()
// All classes in ..domain.service.. must be interfaces
```

#### Before Committing Code
```bash
# Run ArchUnit tests to validate architecture
./gradlew test --tests HexagonalArchitectureTest

# All tests must pass - violations will fail the build
```

#### Common ArchUnit Violations to Avoid
1. **Importing infrastructure in application layer**
   - Fix: Use domain ports instead
2. **Using @Entity in domain models**
   - Fix: Create JPA entities in infrastructure.persistence.entity
3. **Creating concrete class as repository in domain**
   - Fix: Make it an interface in domain.port
4. **Using @Service on domain service**
   - Fix: Make it an interface, implement in infrastructure

### Unit Tests (JUnit 5 + Mockito)
```java
// Domain model test - Pure unit test
@Test
void shouldValidateBusNumber() {
    assertThrows(DomainValidationException.class, () -> {
        new Bus(new BusId(1L), "", "Bus Name");
    });
}

// Service test - Mock dependencies
@ExtendWith(MockitoExtension.class)
class BusServiceTest {
    
    @Mock
    private BusRepository busRepository;
    
    @InjectMocks
    private BusService busService;
    
    @Test
    void shouldFindBusByRoute() {
        // Arrange
        List<Bus> expectedBuses = List.of(
            new Bus(new BusId(1L), "101", "City Express")
        );
        when(busRepository.findByRoute("101"))
            .thenReturn(expectedBuses);
        
        // Act
        List<Bus> result = busService.findByRoute("101");
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("City Express", result.get(0).getName());
    }
}
```

### Integration Tests
```java
// Repository test
@DataJpaTest
class BusJpaRepositoryTest {
    
    @Autowired
    private BusJpaRepository repository;
    
    @Test
    void shouldSaveAndFindBus() {
        BusJpaEntity bus = new BusJpaEntity();
        bus.setNumber("101");
        bus.setName("Express");
        
        BusJpaEntity saved = repository.save(bus);
        
        assertNotNull(saved.getId());
        assertEquals("101", saved.getNumber());
    }
}

// Controller test
@WebMvcTest(BusController.class)
class BusControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private BusService busService;
    
    @Test
    void shouldGetBusById() throws Exception {
        Bus bus = new Bus(new BusId(1L), "101", "Express");
        when(busService.findById(1L)).thenReturn(Optional.of(bus));
        
        mockMvc.perform(get("/api/buses/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.number").value("101"));
    }
}

// Full integration test
@SpringBootTest
@AutoConfigureMockMvc
class BusIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private BusRepository busRepository;
    
    @Test
    @Transactional
    void shouldCreateAndRetrieveBus() throws Exception {
        // Test full flow with real database
    }
}
```

### Test Naming Convention
- Test classes: `*Test` (unit), `*IntegrationTest` (integration)
- Test methods: `should*` or `givenX_whenY_thenZ`
- Use `@DisplayName` for complex scenarios

### Test Coverage Guidelines
- Domain models: 100% coverage (pure business logic)
- Application services: 80%+ coverage
- Infrastructure: Focus on adapter integration
- ArchUnit: 100% (all architecture rules must pass)

## Hexagonal Architecture

- Keep domain logic in `domain/` package
- Define ports as interfaces
- Implement adapters in `infrastructure/`
- Keep application services in `app/`

## Anti-Patterns to Avoid

❌ Don't use field injection
❌ Don't expose entities directly from controllers
❌ Don't put business logic in controllers
❌ Don't ignore transactions
❌ Don't use `null` - use `Optional` where appropriate
❌ Don't catch generic `Exception` - catch specific exceptions
❌ Don't import infrastructure in application layer (ArchUnit will fail)
❌ Don't use framework annotations in domain models (ArchUnit will fail)
❌ Don't create duplicate interfaces across layers
❌ Don't put JPA entities in domain layer (ArchUnit will fail)

## Quick Reference Checklist

### Before Creating a New Class
- [ ] Which layer does this belong to? (domain/application/infrastructure)
- [ ] What can this layer import? (Check dependency rules)
- [ ] Does this need to be an interface? (Ports must be interfaces)
- [ ] Am I creating a duplicate? (Check for existing interfaces)
- [ ] Does the naming follow conventions?

### Before Adding an Import
- [ ] Domain layer: NO application or infrastructure imports
- [ ] Application layer: ONLY domain imports (+ standard Java)
- [ ] Infrastructure layer: Can import domain + application + frameworks

### Before Adding an Annotation
- [ ] `@Entity`: Only in infrastructure.persistence.entity
- [ ] `@Repository`: Use in infrastructure.persistence.jpa (JPA interfaces)
- [ ] `@Service`: Use in infrastructure or application services
- [ ] `@Configuration`: Only in infrastructure.config or infrastructure.security
- [ ] `@Component`: NOT in domain layer

### Before Committing
```bash
# 1. Run ArchUnit tests
./gradlew test --tests HexagonalArchitectureTest

# 2. Run all tests
./gradlew test

# 3. Check build
./gradlew build
```

## Architecture Validation Commands

```bash
# Quick architecture validation
./gradlew test --tests HexagonalArchitectureTest

# Find potential violations manually
grep -r "import.*infrastructure" backend/app/src/main/java/com/perundhu/application/
grep -r "import.*infrastructure" backend/app/src/main/java/com/perundhu/domain/
grep -r "@Entity" backend/app/src/main/java/com/perundhu/domain/

# List all domain ports (should be interfaces)
find backend/app/src/main/java/com/perundhu/domain/port -name "*.java" -exec grep -l "interface" {} \;
```

## Common Architecture Questions

**Q: Where should I put a new business entity?**
A: `domain.model.*` as a pure Java class (no annotations)

**Q: Where should I put database queries?**
A: Define interface in `domain.port.*`, implement in `infrastructure.persistence.adapter.*`

**Q: Where should I put validation logic?**
A: Business validation in domain model, technical validation in infrastructure

**Q: Can application layer use Spring annotations?**
A: Yes, but prefer configuration-based DI. Application can use `@Service` but avoid framework-specific code

**Q: How do I handle multiple implementations?**
A: Use `@Primary` and `@Qualifier` in `HexagonalConfig`

**Q: Why did my ArchUnit test fail?**
A: Check the error message - it will tell you exactly which rule was violated and which class caused it

## Reference Documents

- `HEXAGONAL_ARCHITECTURE_GUIDELINES.md` - Complete architecture guide
- `HexagonalArchitectureTest.java` - Automated architecture validation
- `HexagonalConfig.java` - Dependency injection examples

---

**Remember**: ArchUnit tests enforce these rules automatically. If a test fails, your code violates the architecture and must be fixed before merging.
