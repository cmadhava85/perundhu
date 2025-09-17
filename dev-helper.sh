#!/bin/bash

# Hexagonal Architecture Development Helper Script

show_help() {
    echo "🏗️  Hexagonal Architecture Helper"
    echo ""
    echo "Usage: ./dev-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  validate           - Run architecture validation"
    echo "  new-domain         - Create new domain model template"
    echo "  new-repository     - Create new repository interface template"
    echo "  new-service        - Create new application service template"
    echo "  new-adapter        - Create new infrastructure adapter template"
    echo "  check-violations   - Quick check for common violations"
    echo "  fix-imports        - Auto-organize imports"
    echo "  help              - Show this help"
    echo ""
}

validate_architecture() {
    echo "🔍 Running architecture validation..."
    if [ -f "scripts/validate-architecture.sh" ]; then
        bash scripts/validate-architecture.sh
    else
        echo "❌ Validation script not found"
        exit 1
    fi
}

create_domain_template() {
    read -p "Enter domain model name (e.g., User, Order): " name
    if [ -z "$name" ]; then
        echo "❌ Name is required"
        exit 1
    fi
    
    package_path="backend/app/src/main/java/com/perundhu/domain/model"
    file_path="$package_path/${name}.java"
    
    if [ -f "$file_path" ]; then
        echo "❌ File already exists: $file_path"
        exit 1
    fi
    
    mkdir -p "$package_path"
    
    cat > "$file_path" << EOF
package com.perundhu.domain.model;

import java.time.LocalDateTime;

/**
 * ${name} domain model
 * 
 * TODO: Add business rules and validation
 */
public class ${name} {
    
    private final String id;
    private final LocalDateTime createdAt;
    
    private ${name}(String id, LocalDateTime createdAt) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID cannot be null or empty");
        }
        
        this.id = id;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }
    
    public static ${name} create(String id) {
        return new ${name}(id, LocalDateTime.now());
    }
    
    public static ${name} restore(String id, LocalDateTime createdAt) {
        return new ${name}(id, createdAt);
    }
    
    // TODO: Add business methods here
    
    public String getId() {
        return id;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        ${name} that = (${name}) obj;
        return id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id.hashCode();
    }
    
    @Override
    public String toString() {
        return "${name}{" +
                "id='" + id + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
EOF
    
    echo "✅ Created domain model: $file_path"
    echo "📝 Next steps:"
    echo "   1. Add business properties and methods"
    echo "   2. Create repository interface in domain.port"
    echo "   3. Create application service"
    echo "   4. Create infrastructure adapter"
}

create_repository_template() {
    read -p "Enter entity name (e.g., User, Order): " name
    if [ -z "$name" ]; then
        echo "❌ Name is required"
        exit 1
    fi
    
    package_path="backend/app/src/main/java/com/perundhu/domain/port"
    file_path="$package_path/${name}Repository.java"
    
    if [ -f "$file_path" ]; then
        echo "❌ File already exists: $file_path"
        exit 1
    fi
    
    mkdir -p "$package_path"
    
    cat > "$file_path" << EOF
package com.perundhu.domain.port;

import com.perundhu.domain.model.${name};
import java.util.List;
import java.util.Optional;

/**
 * Repository port for ${name} aggregate
 */
public interface ${name}Repository {
    
    ${name} save(${name} ${name,,});
    
    Optional<${name}> findById(String id);
    
    List<${name}> findAll();
    
    void deleteById(String id);
    
    boolean existsById(String id);
    
    long count();
    
    // TODO: Add domain-specific query methods
}
EOF
    
    echo "✅ Created repository interface: $file_path"
}

check_quick_violations() {
    echo "🔍 Quick violation check..."
    
    violations=0
    
    # Check application layer imports
    app_violations=$(grep -r "import.*infrastructure" backend/app/src/main/java/com/perundhu/application/ 2>/dev/null || true)
    if [ ! -z "$app_violations" ]; then
        echo "❌ Application layer importing infrastructure:"
        echo "$app_violations"
        ((violations++))
    fi
    
    # Check domain layer imports
    domain_violations=$(grep -r "import.*application\|import.*infrastructure" backend/app/src/main/java/com/perundhu/domain/ 2>/dev/null || true)
    if [ ! -z "$domain_violations" ]; then
        echo "❌ Domain layer importing other layers:"
        echo "$domain_violations"
        ((violations++))
    fi
    
    if [ $violations -eq 0 ]; then
        echo "✅ No obvious violations found"
    else
        echo "❌ Found $violations violation(s)"
    fi
}

case "$1" in
    "validate")
        validate_architecture
        ;;
    "new-domain")
        create_domain_template
        ;;
    "new-repository")
        create_repository_template
        ;;
    "check-violations")
        check_quick_violations
        ;;
    "help"|""|"--help"|"-h")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac