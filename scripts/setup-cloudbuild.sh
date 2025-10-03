#!/bin/bash

# Perundhu Cloud Build Setup Script
# Creates Cloud Build triggers and IAM permissions

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=""
REPO_NAME="perundhu"
REPO_OWNER="cmadhava85"
GITHUB_APP_ID=""
REGION="us-central1"
CREATE_TRIGGERS=true
SETUP_IAM=true

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

Setup Cloud Build for Perundhu application

OPTIONS:
    -p, --project PROJECT_ID    GCP Project ID (required)
    -r, --repo REPO_NAME        GitHub repository name [default: perundhu]
    -o, --owner REPO_OWNER      GitHub repository owner [default: cmadhava85]
    -g, --github-app GITHUB_APP GitHub App installation ID
    -R, --region REGION         GCP region [default: us-central1]
    --skip-triggers             Skip creating build triggers
    --skip-iam                  Skip IAM setup
    -h, --help                  Show this help message

EXAMPLES:
    # Basic setup
    $0 -p my-project-id

    # Setup with custom GitHub repository
    $0 -p my-project-id -r my-repo -o my-github-user

    # Setup with GitHub App
    $0 -p my-project-id -g 12345678

PREREQUISITES:
    1. GitHub repository connected to Cloud Build
    2. Cloud Build API enabled
    3. Appropriate IAM permissions

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
            -r|--repo)
                REPO_NAME="$2"
                shift 2
                ;;
            -o|--owner)
                REPO_OWNER="$2"
                shift 2
                ;;
            -g|--github-app)
                GITHUB_APP_ID="$2"
                shift 2
                ;;
            -R|--region)
                REGION="$2"
                shift 2
                ;;
            --skip-triggers)
                CREATE_TRIGGERS=false
                shift
                ;;
            --skip-iam)
                SETUP_IAM=false
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
    if [[ -z "$PROJECT_ID" ]]; then
        PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-}"
        if [[ -z "$PROJECT_ID" ]]; then
            print_error "Project ID must be specified with -p or set GOOGLE_CLOUD_PROJECT environment variable"
            exit 1
        fi
    fi

    # Set project
    gcloud config set project "$PROJECT_ID" --quiet
    
    print_status "Project ID: $PROJECT_ID"
    print_status "Repository: $REPO_OWNER/$REPO_NAME"
    print_status "Region: $REGION"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required APIs..."
    
    local apis=(
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "run.googleapis.com"
        "secretmanager.googleapis.com"
        "sqladmin.googleapis.com"
        "compute.googleapis.com"
        "vpcaccess.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --quiet
    done
    
    print_success "APIs enabled successfully"
}

# Setup IAM permissions for Cloud Build
setup_iam() {
    if [[ "$SETUP_IAM" == "false" ]]; then
        print_status "Skipping IAM setup"
        return
    fi
    
    print_status "Setting up IAM permissions for Cloud Build..."
    
    # Get Cloud Build service account
    local build_sa="${PROJECT_ID}@cloudbuild.gserviceaccount.com"
    
    # Required roles for Cloud Build
    local roles=(
        "roles/run.admin"
        "roles/iam.serviceAccountUser"
        "roles/storage.admin"
        "roles/secretmanager.secretAccessor"
        "roles/cloudsql.client"
        "roles/compute.networkUser"
    )
    
    for role in "${roles[@]}"; do
        print_status "Granting $role to Cloud Build service account..."
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$build_sa" \
            --role="$role" \
            --quiet > /dev/null
    done
    
    print_success "IAM permissions configured"
}

# Create build triggers
create_triggers() {
    if [[ "$CREATE_TRIGGERS" == "false" ]]; then
        print_status "Skipping trigger creation"
        return
    fi
    
    print_status "Creating Cloud Build triggers..."
    
    # Create preprod trigger for master branch
    create_trigger_config "preprod" "master" "Push to master"
    
    # Create staging trigger for develop branch (if you use this pattern)
    # create_trigger_config "staging" "develop" "Push to develop"
    
    print_success "Build triggers created"
}

# Create individual trigger configuration
create_trigger_config() {
    local environment=$1
    local branch=$2
    local description=$3
    
    local trigger_name="perundhu-${environment}-deploy"
    
    print_status "Creating trigger: $trigger_name"
    
    # Check if trigger already exists
    if gcloud builds triggers describe "$trigger_name" --region="$REGION" &>/dev/null; then
        print_warning "Trigger $trigger_name already exists, skipping..."
        return
    fi
    
    # Create trigger configuration
    cat > "/tmp/${trigger_name}.yaml" << EOF
name: ${trigger_name}
description: "${description} - Deploy to ${environment}"
github:
  owner: ${REPO_OWNER}
  name: ${REPO_NAME}
  push:
    branch: ^${branch}$
filename: cloudbuild.yaml
substitutions:
  _ENVIRONMENT: ${environment}
  _REGION: ${REGION}
includedFiles:
  - "**"
ignoredFiles:
  - "README.md"
  - "docs/**"
  - "*.md"
EOF

    # Create the trigger
    gcloud builds triggers create github \
        --repo-name="$REPO_NAME" \
        --repo-owner="$REPO_OWNER" \
        --branch-pattern="^${branch}$" \
        --build-config="cloudbuild.yaml" \
        --name="$trigger_name" \
        --description="$description - Deploy to $environment" \
        --region="$REGION" \
        --substitutions="_ENVIRONMENT=$environment,_REGION=$REGION" \
        --quiet
    
    print_success "Created trigger: $trigger_name"
    
    # Clean up temp file
    rm -f "/tmp/${trigger_name}.yaml"
}

# Create service accounts for applications
create_service_accounts() {
    print_status "Creating service accounts for applications..."
    
    # Backend service account
    local backend_sa="perundhu-preprod-backend"
    if ! gcloud iam service-accounts describe "${backend_sa}@${PROJECT_ID}.iam.gserviceaccount.com" &>/dev/null; then
        print_status "Creating backend service account: $backend_sa"
        gcloud iam service-accounts create "$backend_sa" \
            --display-name="Perundhu Backend Service Account" \
            --description="Service account for Perundhu backend application" \
            --quiet
    fi
    
    # Frontend service account
    local frontend_sa="perundhu-preprod-frontend"
    if ! gcloud iam service-accounts describe "${frontend_sa}@${PROJECT_ID}.iam.gserviceaccount.com" &>/dev/null; then
        print_status "Creating frontend service account: $frontend_sa"
        gcloud iam service-accounts create "$frontend_sa" \
            --display-name="Perundhu Frontend Service Account" \
            --description="Service account for Perundhu frontend application" \
            --quiet
    fi
    
    print_success "Service accounts created"
}

# Create build artifacts bucket
create_artifacts_bucket() {
    print_status "Creating build artifacts bucket..."
    
    local bucket_name="perundhu-preprod-build-artifacts-${PROJECT_ID}"
    
    if ! gsutil ls "gs://$bucket_name" &>/dev/null; then
        print_status "Creating bucket: $bucket_name"
        gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$bucket_name"
        
        # Enable versioning
        gsutil versioning set on "gs://$bucket_name"
        
        # Set lifecycle policy
        cat > "/tmp/lifecycle.json" << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
        gsutil lifecycle set "/tmp/lifecycle.json" "gs://$bucket_name"
        rm -f "/tmp/lifecycle.json"
        
        print_success "Created artifacts bucket: $bucket_name"
    else
        print_status "Artifacts bucket already exists: $bucket_name"
    fi
}

# Show summary
show_summary() {
    print_success "Cloud Build setup completed!"
    echo
    print_status "Summary:"
    print_status "- Project: $PROJECT_ID"
    print_status "- Repository: $REPO_OWNER/$REPO_NAME"
    print_status "- Region: $REGION"
    echo
    
    if [[ "$CREATE_TRIGGERS" == "true" ]]; then
        print_status "Build triggers created:"
        gcloud builds triggers list --region="$REGION" --format="table(name,github.owner,github.name,github.push.branch)"
        echo
    fi
    
    print_status "Next steps:"
    print_status "1. Push code to trigger a build:"
    print_status "   git push origin master"
    echo
    print_status "2. Monitor builds:"
    print_status "   ./scripts/build-status.sh -p $PROJECT_ID"
    echo
    print_status "3. Deploy manually:"
    print_status "   ./scripts/deploy.sh -p $PROJECT_ID"
    echo
    print_status "4. View in console:"
    print_status "   https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
}

# Main function
main() {
    print_status "Starting Cloud Build setup for Perundhu..."
    
    parse_args "$@"
    validate_inputs
    enable_apis
    setup_iam
    create_service_accounts
    create_artifacts_bucket
    create_triggers
    show_summary
}

# Run main function with all arguments
main "$@"