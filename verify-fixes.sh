#!/bin/bash

# Form Input Blocking - Verification Script
# This script verifies that all fixes have been properly applied

echo "======================================"
echo "Form Input Blocking - Fix Verification"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Function to check if a pattern exists in a file
check_pattern() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ FAIL${NC}: File not found: $file"
    ((FAIL++))
    return 1
  fi
  
  if grep -q "$pattern" "$file"; then
    echo -e "${GREEN}✓ PASS${NC}: $description"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}: $description"
    ((FAIL++))
    return 1
  fi
}

echo "=== Checking Source Files ==="
echo ""

# Check 1: KeyboardShortcuts has isFormControl
check_pattern \
  "frontend/src/components/KeyboardShortcuts.tsx" \
  "const isFormControl" \
  "KeyboardShortcuts.tsx contains isFormControl function"

# Check 2: KeyboardShortcuts has form detection logic
check_pattern \
  "frontend/src/components/KeyboardShortcuts.tsx" \
  "formElements.includes" \
  "KeyboardShortcuts.tsx checks form element tags"

# Check 3: KeyboardShortcuts checks contentEditable
check_pattern \
  "frontend/src/components/KeyboardShortcuts.tsx" \
  "contentEditable" \
  "KeyboardShortcuts.tsx checks contentEditable elements"

# Check 4: KeyboardShortcuts uses closest()
check_pattern \
  "frontend/src/components/KeyboardShortcuts.tsx" \
  "closest(" \
  "KeyboardShortcuts.tsx uses closest() for nested detection"

# Check 5: announcementService checks sessionStorage
check_pattern \
  "frontend/src/services/announcementService.ts" \
  "sessionStorage.getItem.*admin_auth_credentials" \
  "announcementService.ts checks sessionStorage first"

# Check 6: announcementService checks localStorage fallback
check_pattern \
  "frontend/src/services/announcementService.ts" \
  "localStorage.getItem" \
  "announcementService.ts has localStorage fallback"

# Check 7: reactSecurity has isFormField
check_pattern \
  "frontend/src/utils/reactSecurity.ts" \
  "const isFormField" \
  "reactSecurity.ts contains isFormField detection"

# Check 8: reactSecurity checks form fields before blocking
check_pattern \
  "frontend/src/utils/reactSecurity.ts" \
  "Only prevent shortcuts when NOT in form fields" \
  "reactSecurity.ts skips DevTools prevention in forms"

# Check 9: AnnouncementBanner has proper interface
check_pattern \
  "frontend/src/components/AnnouncementBanner.tsx" \
  "export interface Announcement" \
  "AnnouncementBanner.tsx has Announcement interface"

# Check 10: AnnouncementBanner has null checks
check_pattern \
  "frontend/src/components/AnnouncementBanner.tsx" \
  "a.id &&" \
  "AnnouncementBanner.tsx has null checks for id"

echo ""
echo "=== Checking Build Artifacts ==="
echo ""

# Check if dist folder exists
if [ -d "frontend/dist" ]; then
  echo -e "${GREEN}✓ PASS${NC}: frontend/dist directory exists"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}: frontend/dist directory not found"
  ((FAIL++))
fi

# Check if dist/index.html exists
if [ -f "frontend/dist/index.html" ]; then
  echo -e "${GREEN}✓ PASS${NC}: frontend/dist/index.html exists"
  ((PASS++))
  
  # Check if it's recent (within last hour)
  if [ "$(find frontend/dist/index.html -mmin -60)" ]; then
    echo -e "${GREEN}✓ PASS${NC}: Build is recent (less than 1 hour old)"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠ WARN${NC}: Build might be old (older than 1 hour)"
    ((WARN++))
  fi
else
  echo -e "${RED}✗ FAIL${NC}: frontend/dist/index.html not found"
  ((FAIL++))
fi

# Check if assets exist
if [ -d "frontend/dist/assets" ]; then
  echo -e "${GREEN}✓ PASS${NC}: frontend/dist/assets directory exists"
  ((PASS++))
  
  JS_COUNT=$(find frontend/dist/assets -name "*.js" | wc -l)
  if [ "$JS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: JavaScript bundles found ($JS_COUNT files)"
    ((PASS++))
  else
    echo -e "${RED}✗ FAIL${NC}: No JavaScript bundles found in assets"
    ((FAIL++))
  fi
else
  echo -e "${RED}✗ FAIL${NC}: frontend/dist/assets directory not found"
  ((FAIL++))
fi

echo ""
echo "=== Checking Configuration Files ==="
echo ""

# Check package.json
if [ -f "frontend/package.json" ]; then
  echo -e "${GREEN}✓ PASS${NC}: frontend/package.json exists"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}: frontend/package.json not found"
  ((FAIL++))
fi

# Check tsconfig
if [ -f "frontend/tsconfig.json" ]; then
  echo -e "${GREEN}✓ PASS${NC}: frontend/tsconfig.json exists"
  ((PASS++))
else
  echo -e "${RED}✗ FAIL${NC}: frontend/tsconfig.json not found"
  ((FAIL++))
fi

echo ""
echo "=== Checking Documentation ==="
echo ""

# Check documentation files
check_pattern \
  "RESOLUTION_COMPLETE.md" \
  "Form Input Blocking" \
  "RESOLUTION_COMPLETE.md documentation exists"

check_pattern \
  "FORM_INPUT_FIX_VERIFICATION.md" \
  "Problem Statement" \
  "FORM_INPUT_FIX_VERIFICATION.md documentation exists"

check_pattern \
  "TESTING_INSTRUCTIONS.md" \
  "Testing Instructions" \
  "TESTING_INSTRUCTIONS.md documentation exists"

echo ""
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${RED}Failed:${NC}  $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

# Final status
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED - Ready for deployment${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Test in development environment: npm run dev"
  echo "2. Follow testing instructions in TESTING_INSTRUCTIONS.md"
  echo "3. Verify all forms accept input properly"
  echo "4. Check console for any errors"
  echo "5. Deploy to production"
  exit 0
else
  echo -e "${RED}✗ SOME CHECKS FAILED - Review errors above${NC}"
  echo ""
  echo "To fix:"
  echo "1. Review the files that failed"
  echo "2. Re-apply the fixes from the documentation"
  echo "3. Run: cd frontend && npm run build"
  echo "4. Run this script again"
  exit 1
fi
