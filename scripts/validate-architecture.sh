#!/bin/bash

# Hexagonal Architecture Validation Script
# Run this before committing or in CI/CD pipeline

echo "🏗️  Validating Hexagonal Architecture..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS=0

# Function to report violation
report_violation() {
    echo -e "${RED}❌ VIOLATION: $1${NC}"
    ((VIOLATIONS++))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to report warning
report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "1. Checking for infrastructure imports in application layer..."

# Check for infrastructure imports in application layer
INFRASTRUCTURE_IMPORTS=$(grep -r "import.*infrastructure" backend/app/src/main/java/com/perundhu/application/ 2>/dev/null || true)
if [ ! -z "$INFRASTRUCTURE_IMPORTS" ]; then
    report_violation "Application layer importing from infrastructure layer"
    echo "$INFRASTRUCTURE_IMPORTS"
else
    report_success "No infrastructure imports in application layer"
fi

echo ""
echo "2. Checking for application imports in domain layer..."

# Check for application imports in domain layer
APPLICATION_IMPORTS=$(grep -r "import.*application" backend/app/src/main/java/com/perundhu/domain/ 2>/dev/null || true)
if [ ! -z "$APPLICATION_IMPORTS" ]; then
    report_violation "Domain layer importing from application layer"
    echo "$APPLICATION_IMPORTS"
else
    report_success "No application imports in domain layer"
fi

echo ""
echo "3. Checking for framework imports in domain layer..."

# Check for Spring/JPA imports in domain layer (should be minimal)
FRAMEWORK_IMPORTS=$(grep -r "import org.springframework\|import javax.persistence\|import jakarta.persistence" backend/app/src/main/java/com/perundhu/domain/ 2>/dev/null || true)
if [ ! -z "$FRAMEWORK_IMPORTS" ]; then
    report_warning "Framework imports found in domain layer (review if necessary)"
    echo "$FRAMEWORK_IMPORTS"
else
    report_success "No framework imports in domain layer"
fi

echo ""
echo "4. Checking for duplicate interface names..."

# Find potential duplicate interfaces
DUPLICATE_REPOSITORIES=$(find backend/app/src/main/java -name "*Repository.java" -type f | sed 's/.*\///' | sort | uniq -d)
if [ ! -z "$DUPLICATE_REPOSITORIES" ]; then
    report_violation "Duplicate Repository interfaces found"
    find backend/app/src/main/java -name "*Repository.java" -type f | grep -E "$(echo $DUPLICATE_REPOSITORIES | tr ' ' '|')"
else
    report_success "No duplicate Repository interfaces"
fi

DUPLICATE_SERVICES=$(find backend/app/src/main/java -name "*Service.java" -type f | sed 's/.*\///' | sort | uniq -d)
if [ ! -z "$DUPLICATE_SERVICES" ]; then
    report_violation "Duplicate Service interfaces found"
    find backend/app/src/main/java -name "*Service.java" -type f | grep -E "$(echo $DUPLICATE_SERVICES | tr ' ' '|')"
else
    report_success "No duplicate Service interfaces"
fi

DUPLICATE_OUTPUT_PORTS=$(find backend/app/src/main/java -name "*OutputPort.java" -type f | sed 's/.*\///' | sort | uniq -d)
if [ ! -z "$DUPLICATE_OUTPUT_PORTS" ]; then
    report_violation "Duplicate OutputPort interfaces found"
    find backend/app/src/main/java -name "*OutputPort.java" -type f | grep -E "$(echo $DUPLICATE_OUTPUT_PORTS | tr ' ' '|')"
else
    report_success "No duplicate OutputPort interfaces"
fi

echo ""
echo "5. Checking for business logic in infrastructure layer..."

# Check for potential business logic in controllers (simplified check)
BUSINESS_LOGIC_IN_CONTROLLERS=$(grep -r "if\|for\|while" backend/app/src/main/java/com/perundhu/infrastructure/adapter/in/web/ 2>/dev/null | grep -v "for.*param\|if.*null\|if.*empty" || true)
if [ ! -z "$BUSINESS_LOGIC_IN_CONTROLLERS" ]; then
    report_warning "Potential business logic found in controllers (review manually)"
    echo "$BUSINESS_LOGIC_IN_CONTROLLERS" | head -5
else
    report_success "No obvious business logic in controllers"
fi

echo ""
echo "6. Checking dependency directions..."

# Check that adapters implement domain ports
ADAPTER_IMPLEMENTATIONS=$(find backend/app/src/main/java/com/perundhu/infrastructure/adapter -name "*.java" -type f -exec grep -l "implements.*Port\|implements.*Repository\|implements.*Service" {} \; 2>/dev/null || true)
if [ ! -z "$ADAPTER_IMPLEMENTATIONS" ]; then
    report_success "Found adapter implementations: $(echo $ADAPTER_IMPLEMENTATIONS | wc -w) adapters"
else
    report_warning "No adapter implementations found (might be using different naming)"
fi

echo ""
echo "7. Checking for multiple @Component annotations on same interface type..."

# This would require more complex parsing, so we'll do a simplified check
MULTIPLE_COMPONENTS=$(find backend/app/src/main/java -name "*.java" -exec grep -l "@Component\|@Service\|@Repository" {} \; | xargs grep -l "implements.*Repository\|implements.*Service\|implements.*Port" | head -10)
if [ ! -z "$MULTIPLE_COMPONENTS" ]; then
    report_success "Found component implementations (check for conflicts manually)"
else
    report_warning "No component implementations found"
fi

echo ""
echo "========================================="
if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}🎉 Architecture validation PASSED! No violations found.${NC}"
    exit 0
else
    echo -e "${RED}💥 Architecture validation FAILED! Found $VIOLATIONS violation(s).${NC}"
    echo ""
    echo "Please fix the violations above before proceeding."
    echo "See HEXAGONAL_ARCHITECTURE_GUIDELINES.md for guidance."
    exit 1
fi