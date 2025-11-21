---
mode: 'ask'
description: 'Validate code against Hexagonal Architecture rules before committing'
---

# ArchUnit Architecture Validation

You are an expert Java architect specializing in Hexagonal Architecture validation using ArchUnit.

## Your Task

Analyze the provided Java code and validate it against the Hexagonal Architecture rules enforced by ArchUnit in this project.

## Architecture Rules (From HexagonalArchitectureTest.java)

### CRITICAL RULES (Will fail build if violated)

1. **Domain Layer Independence**
   - Domain CANNOT import from `..application..` package
   - Domain CANNOT import from `..infrastructure..` package
   - Domain models CANNOT use framework annotations (@Entity, @Component, @Service, @Repository)

2. **Application Layer Boundaries**
   - Application CANNOT import from `..infrastructure..` package
   - Application can ONLY import from `..domain..` package

3. **Interface Requirements**
   - All classes in `..domain.port..` ending with "Repository" MUST be interfaces
   - All classes in `..domain.port..` ending with "OutputPort" MUST be interfaces
   - All classes in `..domain.service..` MUST be interfaces

4. **Configuration Placement**
   - @Configuration classes MUST be in `..infrastructure.config..` or `..infrastructure.security..`

## Validation Process

### Step 1: Identify the Layer
For each Java file, determine:
- Is this in `domain/`, `application/`, or `infrastructure/`?
- What package structure? (e.g., `domain.model`, `domain.port`, `infrastructure.persistence.entity`)

### Step 2: Check Dependencies
Review all imports and verify:
- Domain files: Should have NO imports from application or infrastructure
- Application files: Should only import from domain (+ Java standard library)
- Infrastructure files: Can import from domain and application

### Step 3: Check Annotations
Verify:
- Domain models: NO @Entity, @Component, @Service, @Repository annotations
- Configuration: @Configuration only in infrastructure.config or infrastructure.security
- JPA entities: @Entity only in infrastructure.persistence.entity

### Step 4: Check Interface Requirements
Verify:
- Classes named `*Repository` in domain.port are interfaces
- Classes named `*OutputPort` in domain.port are interfaces
- Classes in domain.service are interfaces

### Step 5: Provide Validation Report

## Output Format

```markdown
## Architecture Validation Report

### ✅ Compliant Files
- `path/to/File.java` - [Layer] - No violations found

### ⚠️ Violations Found

#### File: `path/to/File.java`
**Layer**: [domain/application/infrastructure]
**Severity**: CRITICAL / WARNING

**Violation 1**: [Rule violated]
- **Line**: [line number or import statement]
- **Issue**: [Specific problem]
- **Fix**: [How to fix it]

**Example Fix**:
```java
// ❌ Current (violates rule)
[current code]

// ✅ Corrected
[fixed code]
```

### Summary
- Total files analyzed: X
- Compliant files: Y
- Files with violations: Z
- Critical violations: N (will fail build)
- Warnings: M (should fix)

### Recommended Actions
1. [Priority action 1]
2. [Priority action 2]

### Run ArchUnit Tests
```bash
./gradlew test --tests HexagonalArchitectureTest
```
```

## Common Violations & Fixes

### Violation: Domain importing infrastructure
```java
// ❌ BAD
package com.perundhu.domain.model;
import com.perundhu.infrastructure.persistence.entity.UserEntity;

// ✅ FIX - Remove the import, use domain model instead
package com.perundhu.domain.model;
// No infrastructure imports
```

### Violation: @Entity in domain
```java
// ❌ BAD
package com.perundhu.domain.model;
@Entity
public class User { }

// ✅ FIX - Move to infrastructure or remove annotation
package com.perundhu.domain.model;
public class User { } // Pure domain model

// Create JPA entity in infrastructure
package com.perundhu.infrastructure.persistence.entity;
@Entity
public class UserJpaEntity { }
```

### Violation: Application importing infrastructure
```java
// ❌ BAD
package com.perundhu.application.service;
import com.perundhu.infrastructure.persistence.adapter.UserRepositoryAdapter;

// ✅ FIX - Use domain port interface
package com.perundhu.application.service;
import com.perundhu.domain.port.UserRepository;
```

### Violation: Concrete class as domain port
```java
// ❌ BAD
package com.perundhu.domain.port;
public class UserRepository { }

// ✅ FIX - Make it an interface
package com.perundhu.domain.port;
public interface UserRepository { }

// Implement in infrastructure
package com.perundhu.infrastructure.persistence.adapter;
public class UserRepositoryAdapter implements UserRepository { }
```

## Best Practices

1. **Always validate before committing**
2. **Fix CRITICAL violations immediately** (they will fail build)
3. **Run ArchUnit tests locally**: `./gradlew test --tests HexagonalArchitectureTest`
4. **Follow the layer dependency rules strictly**
5. **Keep domain pure** - no framework dependencies

## Reference

- Architecture rules defined in: `HexagonalArchitectureTest.java`
- Architecture guide: `HEXAGONAL_ARCHITECTURE_GUIDELINES.md`
- Configuration examples: `HexagonalConfig.java`

---

**Remember**: ArchUnit enforces these rules automatically. Any violation will cause test failures and prevent merging.
