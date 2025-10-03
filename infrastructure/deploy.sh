#!/bin/bash

# Perundhu Infrastructure Deployment Script
# This script deploys the infrastructure to Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="preprod"
PROJECT_ID=""
REGION="us-central1"
AUTO_APPROVE=false
DESTROY=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Perundhu infrastructure to Google Cloud Platform

Options:
    -e, --environment ENV    Environment to deploy (default: preprod)
    -p, --project PROJECT    GCP Project ID (required)
    -r, --region REGION      GCP Region (default: us-central1)
    -y, --auto-approve      Auto approve Terraform changes
    -d, --destroy           Destroy infrastructure instead of creating
    -h, --help              Show this help message

Examples:
    $0 -p my-gcp-project -e preprod
    $0 -p my-gcp-project -e preprod -y
    $0 -p my-gcp-project -e preprod -d  # Destroy infrastructure

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -y|--auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        -d|--destroy)
            DESTROY=true
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

# Validate required parameters
if [[ -z "$PROJECT_ID" ]]; then
    print_error "Project ID is required. Use -p or --project to specify."
    show_usage
    exit 1
fi

# Set working directory
TERRAFORM_DIR="./terraform/environments/$ENVIRONMENT"

if [[ ! -d "$TERRAFORM_DIR" ]]; then
    print_error "Environment directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

print_header "Perundhu Infrastructure Deployment"
print_status "Environment: $ENVIRONMENT"
print_status "Project ID: $PROJECT_ID"
print_status "Region: $REGION"
print_status "Working Directory: $(pwd)"

# Check if terraform.tfvars exists
if [[ ! -f "terraform.tfvars" ]]; then
    print_warning "terraform.tfvars not found. Creating from example..."
    if [[ -f "terraform.tfvars.example" ]]; then
        cp terraform.tfvars.example terraform.tfvars
        print_warning "Please edit terraform.tfvars with your values before proceeding."
        exit 1
    else
        print_error "terraform.tfvars.example not found!"
        exit 1
    fi
fi

# Check if user is authenticated with gcloud
print_status "Checking Google Cloud authentication..."
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q "."; then
    print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
print_status "Setting GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable \
    compute.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    pubsub.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    monitoring.googleapis.com \
    logging.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    servicenetworking.googleapis.com \
    redis.googleapis.com

print_status "APIs enabled successfully."

# Create GCS bucket for Terraform state if it doesn't exist
STATE_BUCKET="$PROJECT_ID-terraform-state-$ENVIRONMENT"
print_status "Checking Terraform state bucket: $STATE_BUCKET"

if ! gsutil ls -b "gs://$STATE_BUCKET" &>/dev/null; then
    print_status "Creating Terraform state bucket: $STATE_BUCKET"
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$STATE_BUCKET"
    gsutil versioning set on "gs://$STATE_BUCKET"
    print_status "State bucket created successfully."
else
    print_status "State bucket already exists."
fi

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init \
    -backend-config="bucket=$STATE_BUCKET" \
    -backend-config="prefix=$ENVIRONMENT/state"

# Plan or destroy
if [[ "$DESTROY" == "true" ]]; then
    print_header "Planning Infrastructure Destruction"
    terraform plan -destroy \
        -var="project_id=$PROJECT_ID" \
        -var="region=$REGION"
    
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        print_warning "Auto-destroying infrastructure..."
        terraform destroy \
            -var="project_id=$PROJECT_ID" \
            -var="region=$REGION" \
            -auto-approve
    else
        print_warning "Review the destruction plan above."
        read -p "Do you want to destroy the infrastructure? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            terraform destroy \
                -var="project_id=$PROJECT_ID" \
                -var="region=$REGION"
        else
            print_status "Destruction cancelled."
            exit 0
        fi
    fi
    
    print_header "Infrastructure Destroyed Successfully"
else
    print_header "Planning Infrastructure Deployment"
    terraform plan \
        -var="project_id=$PROJECT_ID" \
        -var="region=$REGION"
    
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        print_status "Auto-applying infrastructure changes..."
        terraform apply \
            -var="project_id=$PROJECT_ID" \
            -var="region=$REGION" \
            -auto-approve
    else
        print_status "Review the plan above."
        read -p "Do you want to apply these changes? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            terraform apply \
                -var="project_id=$PROJECT_ID" \
                -var="region=$REGION"
        else
            print_status "Deployment cancelled."
            exit 0
        fi
    fi
    
    print_header "Infrastructure Deployed Successfully"
    
    # Show outputs
    print_status "Infrastructure outputs:"
    terraform output
    
    print_header "Next Steps"
    print_status "1. Note down the backend_service_url from the outputs above"
    print_status "2. Build and deploy your application container"
    print_status "3. Update your application configuration with the database and Redis details"
    print_status "4. Monitor your application using the provided dashboard URL"
fi

print_status "Script completed successfully!"
