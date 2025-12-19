#!/bin/bash

# ============================================
# PRODUCTION READINESS VERIFICATION SCRIPT
# ============================================
# This script verifies all configurations are ready for production deployment.
# Run this before deploying to production!
#
# Usage: ./scripts/verify-production-readiness.sh
# ============================================

# Don't use set -e as arithmetic expressions can return non-zero

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# GCP Project
PROJECT_ID="${GCP_PROJECT_ID:-astute-strategy-406601}"
REGION="${GCP_REGION:-asia-south1}"

echo ""
echo "============================================"
echo "🚀 PRODUCTION READINESS VERIFICATION"
echo "============================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Date: $(date)"
echo "============================================"
echo ""

# Function to check and report
check() {
    local name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" == "pass" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name"
        PASSED=$((PASSED + 1))
    elif [ "$status" == "warn" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $name - $message"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $name - $message"
        FAILED=$((FAILED + 1))
    fi
}

# ============================================
# 1. GCP SECRETS CHECK
# ============================================
echo -e "${BLUE}📦 Checking GCP Secrets...${NC}"
echo "-------------------------------------------"

REQUIRED_SECRETS=(
    "production-db-url"
    "production-db-username"
    "production-db-password"
    "production-jwt-secret"
    "production-data-encryption-key"
    "admin-username"
    "admin-password"
    "gemini-api-key"
    "google-maps-api-key"
    "recaptcha-site-key"
    "recaptcha-secret-key"
    "PUBLIC_API_KEY"
)

EXISTING_SECRETS=$(gcloud secrets list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null || echo "")

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$EXISTING_SECRETS" | grep -q "^${secret}$"; then
        # Check if secret has a version
        VERSION=$(gcloud secrets versions list "$secret" --project="$PROJECT_ID" --format="value(name)" --limit=1 2>/dev/null || echo "")
        if [ -n "$VERSION" ]; then
            check "Secret: $secret" "pass"
        else
            check "Secret: $secret" "fail" "Secret exists but has no versions"
        fi
    else
        check "Secret: $secret" "fail" "Secret not found"
    fi
done

# Check production-db-url has real value (not placeholder)
DB_URL=$(gcloud secrets versions access latest --secret="production-db-url" --project="$PROJECT_ID" 2>/dev/null || echo "")
if echo "$DB_URL" | grep -q "CLOUD_SQL_IP"; then
    check "Production DB URL" "warn" "Still contains placeholder CLOUD_SQL_IP - update with real IP"
else
    check "Production DB URL" "pass"
fi

echo ""

# ============================================
# 2. BACKEND CONFIGURATION CHECK
# ============================================
echo -e "${BLUE}🔧 Checking Backend Configuration...${NC}"
echo "-------------------------------------------"

# Check application-production.properties exists
if [ -f "backend/app/src/main/resources/application-production.properties" ]; then
    check "application-production.properties" "pass"
    
    # Check for debug mode disabled
    if grep -q "spring.jpa.show-sql=false" backend/app/src/main/resources/application-production.properties; then
        check "SQL logging disabled" "pass"
    else
        check "SQL logging disabled" "warn" "Consider setting spring.jpa.show-sql=false"
    fi
    
    # Check for SSL requirement
    if grep -q "security.require-ssl=true\|security.require-ssl=\${REQUIRE_SSL:true}" backend/app/src/main/resources/application-production.properties; then
        check "SSL required" "pass"
    else
        check "SSL required" "warn" "Consider enabling security.require-ssl=true"
    fi
else
    check "application-production.properties" "fail" "File not found"
fi

# Check Dockerfile exists
if [ -f "backend/Dockerfile" ]; then
    check "Backend Dockerfile" "pass"
    
    # Check for non-root user
    if grep -q "USER" backend/Dockerfile; then
        check "Non-root user in Dockerfile" "pass"
    else
        check "Non-root user in Dockerfile" "warn" "Consider running as non-root"
    fi
else
    check "Backend Dockerfile" "fail" "File not found"
fi

# Check health check script
if [ -f "backend/health-check.sh" ]; then
    check "Backend health-check.sh" "pass"
else
    check "Backend health-check.sh" "warn" "Health check script not found"
fi

echo ""

# ============================================
# 3. FRONTEND CONFIGURATION CHECK
# ============================================
echo -e "${BLUE}🎨 Checking Frontend Configuration...${NC}"
echo "-------------------------------------------"

# Check .env.production exists
if [ -f "frontend/.env.production" ]; then
    check "frontend/.env.production" "pass"
    
    # Check mock data is disabled
    if grep -q "VITE_MOCK_API=false" frontend/.env.production; then
        check "Mock API disabled" "pass"
    else
        check "Mock API disabled" "fail" "VITE_MOCK_API should be false"
    fi
    
    # Check production API URL is set
    if grep -q "VITE_API_URL=https://" frontend/.env.production; then
        check "Production API URL" "pass"
    else
        check "Production API URL" "warn" "Verify VITE_API_URL points to production backend"
    fi
    
    # Check reCAPTCHA enabled
    if grep -q "VITE_RECAPTCHA_ENABLED=true" frontend/.env.production; then
        check "reCAPTCHA enabled" "pass"
    else
        check "reCAPTCHA enabled" "warn" "Consider enabling reCAPTCHA for production"
    fi
else
    check "frontend/.env.production" "fail" "File not found"
fi

# Check nginx.conf exists
if [ -f "frontend/nginx.conf" ]; then
    check "Nginx configuration" "pass"
    
    # Check security headers
    if grep -q "X-Frame-Options" frontend/nginx.conf; then
        check "Security headers in nginx" "pass"
    else
        check "Security headers in nginx" "warn" "Consider adding security headers"
    fi
else
    check "Nginx configuration" "fail" "File not found"
fi

# Check frontend Dockerfile
if [ -f "frontend/Dockerfile" ]; then
    check "Frontend Dockerfile" "pass"
else
    check "Frontend Dockerfile" "fail" "File not found"
fi

echo ""

# ============================================
# 4. CI/CD CONFIGURATION CHECK
# ============================================
echo -e "${BLUE}🔄 Checking CI/CD Configuration...${NC}"
echo "-------------------------------------------"

# Check production workflow exists
if [ -f ".github/workflows/cd-production.yml" ]; then
    check "Production deployment workflow" "pass"
    
    # Check for secrets usage
    if grep -q "secrets.GCPSECRET" .github/workflows/cd-production.yml; then
        check "GCP credentials secret reference" "pass"
    else
        check "GCP credentials secret reference" "warn" "Verify GCPSECRET is configured"
    fi
else
    check "Production deployment workflow" "fail" "File not found"
fi

# Check CI workflow exists
if [ -f ".github/workflows/ci.yml" ]; then
    check "CI workflow" "pass"
else
    check "CI workflow" "warn" "No CI workflow found"
fi

echo ""

# ============================================
# 5. DATABASE MIGRATIONS CHECK
# ============================================
echo -e "${BLUE}🗄️  Checking Database Migrations...${NC}"
echo "-------------------------------------------"

MIGRATION_DIR="backend/app/src/main/resources/db/migration/mysql"
if [ -d "$MIGRATION_DIR" ]; then
    MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
    check "Flyway migrations" "pass"
    echo "   Found $MIGRATION_COUNT migration files"
    
    # Check for reviews table migration (latest feature)
    if ls "$MIGRATION_DIR"/*reviews*.sql 1>/dev/null 2>&1; then
        check "Reviews table migration" "pass"
    else
        check "Reviews table migration" "warn" "Reviews table migration not found"
    fi
else
    check "Flyway migrations directory" "fail" "Directory not found"
fi

echo ""

# ============================================
# 6. BUILD VERIFICATION
# ============================================
echo -e "${BLUE}🔨 Checking Build Status...${NC}"
echo "-------------------------------------------"

# Check if frontend can build
if [ -f "frontend/package.json" ]; then
    check "Frontend package.json" "pass"
    
    # Check node_modules exists
    if [ -d "frontend/node_modules" ]; then
        check "Frontend dependencies installed" "pass"
    else
        check "Frontend dependencies installed" "warn" "Run 'npm install' in frontend/"
    fi
fi

# Check if backend can build
if [ -f "backend/build.gradle" ]; then
    check "Backend build.gradle" "pass"
    
    # Check if JAR exists in build directory
    if ls backend/build/libs/*.jar 1>/dev/null 2>&1; then
        check "Backend JAR built" "pass"
    else
        check "Backend JAR built" "warn" "Run './gradlew build' in backend/"
    fi
fi

echo ""

# ============================================
# 7. CLOUD RUN SERVICES CHECK
# ============================================
echo -e "${BLUE}☁️  Checking Cloud Run Services...${NC}"
echo "-------------------------------------------"

# Check if backend service exists
BACKEND_SERVICE=$(gcloud run services describe perundhu-backend-production --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)" 2>/dev/null || echo "")
if [ -n "$BACKEND_SERVICE" ]; then
    check "Backend Cloud Run service" "pass"
    echo "   URL: $BACKEND_SERVICE"
else
    check "Backend Cloud Run service" "warn" "Service not yet deployed (will be created on first deploy)"
fi

# Check if frontend service exists
FRONTEND_SERVICE=$(gcloud run services describe perundhu-frontend-production --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)" 2>/dev/null || echo "")
if [ -n "$FRONTEND_SERVICE" ]; then
    check "Frontend Cloud Run service" "pass"
    echo "   URL: $FRONTEND_SERVICE"
else
    check "Frontend Cloud Run service" "warn" "Service not yet deployed (will be created on first deploy)"
fi

echo ""

# ============================================
# 8. IAM PERMISSIONS CHECK
# ============================================
echo -e "${BLUE}🔐 Checking IAM Permissions...${NC}"
echo "-------------------------------------------"

# Check if service account exists
SA_EMAIL="perundhu-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
SA_EXISTS=$(gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" 2>/dev/null && echo "yes" || echo "no")
if [ "$SA_EXISTS" == "yes" ]; then
    check "Backend service account" "pass"
else
    check "Backend service account" "warn" "Service account not found - may be using default"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "============================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo "============================================"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ PRODUCTION READINESS: NOT READY${NC}"
    echo "Please fix the failed checks before deploying."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  PRODUCTION READINESS: READY WITH WARNINGS${NC}"
    echo "Review warnings before deploying."
    exit 0
else
    echo ""
    echo -e "${GREEN}✅ PRODUCTION READINESS: READY${NC}"
    echo "All checks passed! You can proceed with deployment."
    exit 0
fi
