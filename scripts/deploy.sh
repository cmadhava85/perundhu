#!/bin/bash

# Perundhu Cloud Build Deployment Script
# This script triggers Cloud Build for different environments and scenarios

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=""
ENVIRONMENT="preprod"
BRANCH="master"
TRIGGER_ID=""
REGION="us-central1"
ASYNC=false
SUBSTITUTIONS=""

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Perundhu application using Cloud Build

OPTIONS:
    -p, --project PROJECT_ID    GCP Project ID (required)
    -e, --environment ENV       Environment (preprod, staging, prod) [default: preprod]
    -b, --branch BRANCH         Git branch to build [default: master]
    -t, --trigger TRIGGER_ID    Use specific build trigger ID
    -r, --region REGION         GCP region [default: us-central1]
    -a, --async                 Run build asynchronously (don't wait)
    -s, --substitutions SUBS    Additional substitutions (key=value,key2=value2)
    -h, --help                  Show this help message

EXAMPLES:
    # Deploy to preprod from master branch
    $0 -p my-project-id

    # Deploy to staging from develop branch
    $0 -p my-project-id -e staging -b develop

    # Deploy with custom substitutions
    $0 -p my-project-id -s "_BACKEND_MIN_INSTANCES=2,_FRONTEND_MIN_INSTANCES=1"

    # Run async deployment
    $0 -p my-project-id -a

ENVIRONMENT VARIABLES:
    GOOGLE_CLOUD_PROJECT    Default project ID if -p not specified
    CLOUDBUILD_TRIGGER_ID   Default trigger ID if -t not specified

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project)
                PROJECT_ID="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            -t|--trigger)
                TRIGGER_ID="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -a|--async)
                ASYNC=true
                shift
                ;;
            -s|--substitutions)
                SUBSTITUTIONS="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate inputs
validate_inputs() {
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi

    # Set project ID from environment if not provided
    if [[ -z "$PROJECT_ID" ]]; then
        PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-}"
        if [[ -z "$PROJECT_ID" ]]; then
            print_error "Project ID must be specified with -p or set GOOGLE_CLOUD_PROJECT environment variable"
            exit 1
        fi
    fi

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(preprod|staging|prod)$ ]]; then
        print_error "Environment must be one of: preprod, staging, prod"
        exit 1
    fi

    # Set trigger ID from environment if not provided
    if [[ -z "$TRIGGER_ID" ]]; then
        TRIGGER_ID="${CLOUDBUILD_TRIGGER_ID:-}"
    fi

    print_status "Project ID: $PROJECT_ID"
    print_status "Environment: $ENVIRONMENT"
    print_status "Branch: $BRANCH"
    print_status "Region: $REGION"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        print_error "Not authenticated with gcloud. Run: gcloud auth login"
        exit 1
    fi

    # Set project
    gcloud config set project "$PROJECT_ID" --quiet

    # Check if Cloud Build API is enabled
    if ! gcloud services list --enabled --filter="name:cloudbuild.googleapis.com" --format="value(name)" | grep -q "cloudbuild"; then
        print_warning "Cloud Build API is not enabled. Enabling..."
        gcloud services enable cloudbuild.googleapis.com
    fi

    # Check if Container Registry API is enabled
    if ! gcloud services list --enabled --filter="name:containerregistry.googleapis.com" --format="value(name)" | grep -q "containerregistry"; then
        print_warning "Container Registry API is not enabled. Enabling..."
        gcloud services enable containerregistry.googleapis.com
    fi

    print_success "Prerequisites check completed"
}

# Build substitutions map
build_substitutions() {
    local subs_map="_ENVIRONMENT=$ENVIRONMENT,_REGION=$REGION"
    
    # Add custom substitutions if provided
    if [[ -n "$SUBSTITUTIONS" ]]; then
        subs_map="$subs_map,$SUBSTITUTIONS"
    fi
    
    echo "$subs_map"
}

# Submit build using trigger
submit_with_trigger() {
    local substitutions=$(build_substitutions)
    
    print_status "Submitting build using trigger: $TRIGGER_ID"
    
    local build_cmd="gcloud builds triggers run $TRIGGER_ID"
    build_cmd="$build_cmd --branch=$BRANCH"
    build_cmd="$build_cmd --substitutions=$substitutions"
    
    if [[ "$ASYNC" == "true" ]]; then
        build_cmd="$build_cmd --async"
    fi
    
    print_status "Running: $build_cmd"
    eval "$build_cmd"
}

# Submit build using config file
submit_with_config() {
    local substitutions=$(build_substitutions)
    
    print_status "Submitting build using cloudbuild.yaml"
    
    # Check if cloudbuild.yaml exists
    if [[ ! -f "cloudbuild.yaml" ]]; then
        print_error "cloudbuild.yaml not found in current directory"
        exit 1
    fi
    
    local build_cmd="gcloud builds submit"
    build_cmd="$build_cmd --config=cloudbuild.yaml"
    build_cmd="$build_cmd --substitutions=$substitutions"
    build_cmd="$build_cmd --region=$REGION"
    
    if [[ "$ASYNC" == "true" ]]; then
        build_cmd="$build_cmd --async"
    fi
    
    print_status "Running: $build_cmd"
    eval "$build_cmd"
}

# Monitor build progress
monitor_build() {
    if [[ "$ASYNC" == "false" ]]; then
        print_status "Build submitted. Monitoring progress..."
        print_status "You can also view the build in the console:"
        print_status "https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
    else
        print_success "Build submitted asynchronously"
        print_status "Monitor progress at: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
    fi
}

# Main function
main() {
    print_status "Starting Perundhu deployment..."
    
    parse_args "$@"
    validate_inputs
    check_prerequisites
    
    if [[ -n "$TRIGGER_ID" ]]; then
        submit_with_trigger
    else
        submit_with_config
    fi
    
    monitor_build
    
    print_success "Deployment process completed!"
    
    if [[ "$ASYNC" == "false" ]]; then
        print_status "Check deployment status with:"
        print_status "  Backend:  gcloud run services describe perundhu-$ENVIRONMENT-backend --region=$REGION"
        print_status "  Frontend: gcloud run services describe perundhu-$ENVIRONMENT-frontend --region=$REGION"
    fi
}

# Run main function with all arguments
main "$@"