#!/bin/bash

# Perundhu Build Status and Management Script
# Monitor, cancel, and manage Cloud Build jobs

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=""
ACTION="list"
BUILD_ID=""
REGION="us-central1"
LIMIT=10
WATCH=false

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

Manage Perundhu Cloud Build jobs

OPTIONS:
    -p, --project PROJECT_ID    GCP Project ID (required)
    -a, --action ACTION         Action to perform [default: list]
    -b, --build BUILD_ID        Build ID for specific operations
    -r, --region REGION         GCP region [default: us-central1]
    -l, --limit LIMIT           Number of builds to show [default: 10]
    -w, --watch                 Watch build progress in real-time
    -h, --help                  Show this help message

ACTIONS:
    list        List recent builds (default)
    status      Show status of specific build
    logs        Show logs of specific build
    cancel      Cancel a running build
    watch       Watch a build in real-time
    artifacts   Download build artifacts
    clean       Clean old builds (keeps last 50)

EXAMPLES:
    # List recent builds
    $0 -p my-project-id

    # Show status of specific build
    $0 -p my-project-id -a status -b 12345678-1234-1234-1234-123456789012

    # Watch build logs in real-time
    $0 -p my-project-id -a watch -b 12345678-1234-1234-1234-123456789012

    # Cancel a running build
    $0 -p my-project-id -a cancel -b 12345678-1234-1234-1234-123456789012

    # Download artifacts from a build
    $0 -p my-project-id -a artifacts -b 12345678-1234-1234-1234-123456789012

ENVIRONMENT VARIABLES:
    GOOGLE_CLOUD_PROJECT    Default project ID if -p not specified

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
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -b|--build)
                BUILD_ID="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -l|--limit)
                LIMIT="$2"
                shift 2
                ;;
            -w|--watch)
                WATCH=true
                shift
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

    # Validate action
    if [[ ! "$ACTION" =~ ^(list|status|logs|cancel|watch|artifacts|clean)$ ]]; then
        print_error "Action must be one of: list, status, logs, cancel, watch, artifacts, clean"
        exit 1
    fi

    # Some actions require build ID
    if [[ "$ACTION" =~ ^(status|logs|cancel|watch|artifacts)$ && -z "$BUILD_ID" ]]; then
        print_error "Build ID (-b) is required for action: $ACTION"
        exit 1
    fi

    # Set project
    gcloud config set project "$PROJECT_ID" --quiet
}

# List recent builds
list_builds() {
    print_status "Listing recent builds for project: $PROJECT_ID"
    
    gcloud builds list \
        --limit="$LIMIT" \
        --format="table(
            id:label=BUILD_ID,
            status:label=STATUS,
            source.repoSource.branchName:label=BRANCH,
            createTime.date(format='%Y-%m-%d %H:%M:%S'):label=CREATED,
            duration(seconds):label=DURATION,
            substitutions._ENVIRONMENT:label=ENV
        )"
}

# Show build status
show_status() {
    print_status "Showing status for build: $BUILD_ID"
    
    gcloud builds describe "$BUILD_ID" \
        --format="table(
            id:label=BUILD_ID,
            status:label=STATUS,
            source.repoSource.branchName:label=BRANCH,
            createTime:label=CREATED,
            startTime:label=STARTED,
            finishTime:label=FINISHED,
            substitutions._ENVIRONMENT:label=ENVIRONMENT,
            logUrl:label=LOG_URL
        )"
}

# Show build logs
show_logs() {
    if [[ "$WATCH" == "true" ]]; then
        print_status "Watching logs for build: $BUILD_ID"
        gcloud builds log "$BUILD_ID" --stream
    else
        print_status "Showing logs for build: $BUILD_ID"
        gcloud builds log "$BUILD_ID"
    fi
}

# Cancel a build
cancel_build() {
    print_warning "Cancelling build: $BUILD_ID"
    read -p "Are you sure you want to cancel this build? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud builds cancel "$BUILD_ID"
        print_success "Build cancelled"
    else
        print_status "Cancelled operation"
    fi
}

# Watch build progress
watch_build() {
    print_status "Watching build progress: $BUILD_ID"
    
    while true; do
        local status=$(gcloud builds describe "$BUILD_ID" --format="value(status)")
        local duration=$(gcloud builds describe "$BUILD_ID" --format="value(timing.BUILD.startTime,timing.BUILD.endTime)")
        
        clear
        print_status "Build ID: $BUILD_ID"
        print_status "Status: $status"
        print_status "Duration: $duration"
        echo
        
        # Show recent log entries
        gcloud builds log "$BUILD_ID" --limit=20 2>/dev/null || true
        
        if [[ "$status" =~ ^(SUCCESS|FAILURE|CANCELLED|TIMEOUT)$ ]]; then
            print_success "Build completed with status: $status"
            break
        fi
        
        sleep 5
    done
}

# Download build artifacts
download_artifacts() {
    print_status "Downloading artifacts for build: $BUILD_ID"
    
    # Get build details
    local bucket=$(gcloud builds describe "$BUILD_ID" --format="value(artifacts.objects.location)" | head -1)
    
    if [[ -z "$bucket" ]]; then
        print_warning "No artifacts found for this build"
        return
    fi
    
    # Create local artifacts directory
    local artifacts_dir="./artifacts/$BUILD_ID"
    mkdir -p "$artifacts_dir"
    
    print_status "Downloading from: $bucket"
    print_status "Saving to: $artifacts_dir"
    
    # Download artifacts
    gsutil -m cp -r "$bucket/*" "$artifacts_dir/" 2>/dev/null || {
        print_warning "Failed to download some artifacts (might not exist)"
    }
    
    print_success "Artifacts downloaded to: $artifacts_dir"
}

# Clean old builds
clean_builds() {
    print_warning "This will clean old builds, keeping only the last 50"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cancelled operation"
        return
    fi
    
    print_status "Getting list of builds to clean..."
    
    # Get builds older than the last 50
    local builds_to_delete=$(gcloud builds list \
        --filter="status=SUCCESS OR status=FAILURE OR status=CANCELLED OR status=TIMEOUT" \
        --sort-by="~createTime" \
        --format="value(id)" \
        --limit=1000 | tail -n +51)
    
    if [[ -z "$builds_to_delete" ]]; then
        print_status "No builds to clean"
        return
    fi
    
    local count=$(echo "$builds_to_delete" | wc -l)
    print_status "Found $count builds to clean"
    
    # Note: Cloud Build doesn't support bulk delete, so we inform the user
    print_warning "Note: Cloud Build doesn't support automatic deletion of builds"
    print_status "Builds are automatically cleaned up by Google Cloud after 120 days"
    print_status "For immediate cleanup, you would need to delete them manually from the console"
    print_status "Console URL: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
}

# Main function
main() {
    parse_args "$@"
    validate_inputs
    
    case "$ACTION" in
        list)
            list_builds
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        cancel)
            cancel_build
            ;;
        watch)
            watch_build
            ;;
        artifacts)
            download_artifacts
            ;;
        clean)
            clean_builds
            ;;
        *)
            print_error "Unknown action: $ACTION"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"