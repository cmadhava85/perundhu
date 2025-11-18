#!/bin/bash

# Frontend Cleanup Script - Remove Duplicate and Test Files
# Generated: November 18, 2025
# IMPORTANT: Review FRONTEND_CLEANUP_REPORT.md before running!

set -e  # Exit on error

echo "🧹 Frontend Cleanup Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to safely remove file
remove_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Removing:${NC} $file"
        rm "$file"
        echo -e "${GREEN}✓ Removed${NC}"
    else
        echo -e "${RED}✗ Not found:${NC} $file (skipping)"
    fi
}

# Confirm before proceeding
echo "This script will remove duplicate and test files from the frontend."
echo "Please review FRONTEND_CLEANUP_REPORT.md before continuing."
echo ""
read -p "Continue with cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# ============================================================================
# PHASE 1: HTML Test Files (Safe - No Dependencies)
# ============================================================================

echo "📄 Phase 1: Removing HTML test files..."
echo ""

remove_file "contribution-autocomplete-test.html"
remove_file "debug-autocomplete-arup.html"
remove_file "debug-location-autocomplete.html"
remove_file "debug-refresh-tool.html"
remove_file "focused-refresh-debugger.html"
remove_file "reload-debug.html"
remove_file "mobile-navigation-test.html"
remove_file "mobile-testing-tool.html"
remove_file "performance-test.html"
remove_file "test-transit-card.html"
remove_file "static-test.html"
remove_file "sattur-test.html"
remove_file "nominatim-api-test.html"
remove_file "public/test-coordinate-fallback.html"
remove_file "public/test-transit-card.html"

echo ""

# ============================================================================
# PHASE 1: JavaScript Test Scripts
# ============================================================================

echo "📜 Phase 1: Removing JavaScript test scripts..."
echo ""

remove_file "mobile-test.js"
remove_file "mobile-test-console.js"
remove_file "mobile-tester.js"
remove_file "debug-arup-test.js"
remove_file "debug-refresh-issue.js"
remove_file "mobile-test-guide.sh"
remove_file "debug-arup-test.js"

echo ""

# ============================================================================
# PHASE 2: Service Backups (Check for imports first)
# ============================================================================

echo "🔍 Phase 2: Checking for imports of backup service files..."
echo ""

# Check for imports
BACKUP_IMPORTS=$(grep -r "geocodingService.fixed\|geocodingService.backup" src/ 2>/dev/null || true)

if [ -z "$BACKUP_IMPORTS" ]; then
    echo -e "${GREEN}✓ No imports found for backup service files${NC}"
    echo ""
    
    remove_file "src/services/geocodingService.fixed.ts"
    remove_file "src/services/geocodingService.backup.ts"
else
    echo -e "${RED}✗ Warning: Found imports of backup files:${NC}"
    echo "$BACKUP_IMPORTS"
    echo ""
    echo "Skipping removal of service backups. Please update imports first."
fi

echo ""

# ============================================================================
# PHASE 3: Component Duplicates (Check for imports first)
# ============================================================================

echo "🧩 Phase 3: Checking for imports of duplicate components..."
echo ""

# Check ImageContributionUpload_broken
BROKEN_IMPORTS=$(grep -r "ImageContributionUpload_broken" src/ 2>/dev/null || true)

if [ -z "$BROKEN_IMPORTS" ]; then
    echo -e "${GREEN}✓ No imports found for ImageContributionUpload_broken${NC}"
    remove_file "src/components/ImageContributionUpload_broken.tsx"
else
    echo -e "${YELLOW}⚠ Found imports of ImageContributionUpload_broken:${NC}"
    echo "$BROKEN_IMPORTS"
    echo "Skipping removal. Please update imports first."
fi

echo ""

# Check TransitBusCardTest
TEST_IMPORTS=$(grep -r "TransitBusCardTest" src/ 2>/dev/null | grep -v "TransitBusCardTest.tsx:" || true)

if [ -z "$TEST_IMPORTS" ]; then
    echo -e "${GREEN}✓ No imports found for TransitBusCardTest${NC}"
    remove_file "src/components/TransitBusCardTest.tsx"
else
    echo -e "${YELLOW}⚠ Found imports of TransitBusCardTest:${NC}"
    echo "$TEST_IMPORTS"
    echo "Skipping removal. Please update imports first."
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "============================================"
echo "✅ Cleanup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to verify no build errors"
echo "2. Run 'npm test' to verify tests still pass"
echo "3. Review git diff to see what was removed"
echo "4. Commit changes: git add -A && git commit -m 'Clean up duplicate and test files'"
echo ""
echo "For Phase 4 (utility consolidation), see FRONTEND_CLEANUP_REPORT.md"
echo ""

# ============================================================================
# Optional: Show git status
# ============================================================================

if command -v git &> /dev/null; then
    echo "Git status:"
    git status --short
fi
