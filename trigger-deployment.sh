#!/bin/bash

# Trigger Preprod Backend Redeployment via GitHub Actions
# This script uses the GitHub API to manually trigger the CD workflow

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Configuration
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO_OWNER="cmadhava85"
REPO_NAME="perundhu"
WORKFLOW_FILE="cd-preprod-auto.yml"
BRANCH="master"

print_header "GitHub Actions Deployment Trigger"

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GitHub token not found."
    print_warning "Set GITHUB_TOKEN environment variable:"
    echo ""
    echo "  export GITHUB_TOKEN='your-github-pat'"
    echo "  ./trigger-deployment.sh"
    echo ""
    print_warning "To create a token: https://github.com/settings/tokens"
    print_warning "Required scopes: repo, workflow"
    exit 1
fi

print_status "GitHub Token: ${GITHUB_TOKEN:0:20}..."

# Trigger workflow dispatch
print_status "Triggering deployment workflow..."
print_status "  Owner: $REPO_OWNER"
print_status "  Repository: $REPO_NAME"
print_status "  Workflow: $WORKFLOW_FILE"
print_status "  Branch: $BRANCH"

RESPONSE=$(curl -s -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE/dispatches" \
  -d "{\"ref\":\"$BRANCH\",\"inputs\":{\"deploy_frontend\":false,\"deploy_backend\":true,\"deploy_all\":false}}")

# Check if the request was successful
if echo "$RESPONSE" | grep -q "\"errors\"" || [ -z "$RESPONSE" ]; then
    print_error "Failed to trigger workflow"
    echo ""
    echo "Response: $RESPONSE"
    echo ""
    exit 1
fi

print_status "Workflow triggered successfully!"

# Display next steps
print_header "Deployment Status"
echo ""
echo "The GitHub Actions workflow has been triggered."
echo ""
echo "To monitor the deployment:"
echo "  1. Visit: https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
echo "  2. Click on the latest workflow run"
echo "  3. Monitor the progress in real-time"
echo ""
echo "Expected timeline:"
echo "  - Build Backend:    ~3-5 minutes"
echo "  - Run Migrations:   ~1-2 minutes"
echo "  - Deploy Backend:   ~2-3 minutes"
echo "  - Smoke Tests:      ~1 minute"
echo "  - Total:            ~10-15 minutes"
echo ""

print_status "Deployment triggered successfully!"
