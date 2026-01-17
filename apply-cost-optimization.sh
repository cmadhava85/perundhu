#!/bin/bash

# GCP Cost Optimization Deployment Script
# This script applies the cost optimization changes to both preprod and production environments
# Target: PreProd < $10/month, Production < $20/month

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     GCP COST OPTIMIZATION DEPLOYMENT                           ║"
    echo "║     Target: PreProd < $10/month | Production < $20/month       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
}

print_cost_summary() {
    echo ""
    print_message "$BLUE" "📊 Expected Cost Savings:"
    echo ""
    echo "┌─────────────┬──────────┬──────────┬──────────┐"
    echo "│ Environment │  Before  │  After   │ Savings  │"
    echo "├─────────────┼──────────┼──────────┼──────────┤"
    echo "│  PreProd    │  \$20/mo  │  \$5/mo   │  \$15/mo  │"
    echo "│  Production │  \$66/mo  │ \$18/mo   │  \$48/mo  │"
    echo "└─────────────┴──────────┴──────────┴──────────┘"
    echo ""
    print_message "$GREEN" "💰 Total Monthly Savings: \$63/month (\$756/year)"
    echo ""
}

# Check if user wants to proceed
confirm_deployment() {
    local env=$1
    print_message "$YELLOW" "⚠️  You are about to apply cost optimization changes to: $env"
    echo ""
    echo "Changes include:"
    if [ "$env" == "preprod" ]; then
        echo "  - Cloud Run memory: 512Mi → 256Mi"
        echo "  - Cloud Run max instances: 3 → 2"
    else
        echo "  - Cloud SQL tier: db-n1-standard-1 → db-g1-small"
        echo "  - Cloud SQL disk: 50GB → 20GB"
        echo "  - Cloud Run min instances: 1 → 0"
        echo "  - Cloud Run max instances: 10 → 5"
        echo "  - Cloud Run CPU: 2000m → 1000m"
        echo "  - Cloud Run memory: 1Gi → 512Mi"
    fi
    echo ""
    read -p "Continue with $env deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "$RED" "❌ Deployment cancelled by user"
        exit 1
    fi
}

# Deploy to environment
deploy_environment() {
    local env=$1
    local env_path="infrastructure/terraform/environments/$env"
    
    print_message "$BLUE" "🚀 Deploying cost optimization to $env..."
    echo ""
    
    if [ ! -d "$env_path" ]; then
        print_message "$RED" "❌ Environment directory not found: $env_path"
        exit 1
    fi
    
    cd "$env_path"
    
    # Initialize Terraform
    print_message "$YELLOW" "📦 Initializing Terraform..."
    terraform init
    
    # Plan changes
    print_message "$YELLOW" "📋 Planning changes..."
    terraform plan -out=tfplan
    
    # Show plan summary
    echo ""
    print_message "$GREEN" "✅ Plan created successfully"
    echo ""
    
    # Confirm before apply
    read -p "Review the plan above. Apply changes? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "$RED" "❌ Apply cancelled by user"
        rm -f tfplan
        exit 1
    fi
    
    # Apply changes
    print_message "$YELLOW" "⚙️  Applying changes..."
    terraform apply tfplan
    
    # Clean up
    rm -f tfplan
    
    # Go back to root
    cd - > /dev/null
    
    print_message "$GREEN" "✅ Successfully deployed cost optimization to $env"
    echo ""
}

# Main execution
main() {
    print_header
    print_cost_summary
    
    # Parse arguments
    ENVIRONMENT=$1
    
    if [ -z "$ENVIRONMENT" ]; then
        print_message "$YELLOW" "Usage: $0 [preprod|production|all]"
        echo ""
        echo "Options:"
        echo "  preprod     - Deploy only to preprod environment"
        echo "  production  - Deploy only to production environment"
        echo "  all         - Deploy to both environments (sequentially)"
        echo ""
        read -p "Select environment (preprod/production/all): " ENVIRONMENT
    fi
    
    case "$ENVIRONMENT" in
        preprod)
            confirm_deployment "preprod"
            deploy_environment "preprod"
            ;;
        production)
            confirm_deployment "production"
            deploy_environment "production"
            ;;
        all)
            confirm_deployment "preprod"
            deploy_environment "preprod"
            echo ""
            echo "════════════════════════════════════════════════════════════════"
            echo ""
            confirm_deployment "production"
            deploy_environment "production"
            ;;
        *)
            print_message "$RED" "❌ Invalid environment: $ENVIRONMENT"
            print_message "$YELLOW" "Valid options: preprod, production, all"
            exit 1
            ;;
    esac
    
    # Final summary
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              DEPLOYMENT COMPLETE                               ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    print_message "$GREEN" "✅ Cost optimization changes have been applied!"
    echo ""
    print_message "$BLUE" "📊 Next Steps:"
    echo "  1. Monitor costs in GCP Console: https://console.cloud.google.com/billing"
    echo "  2. Check Cloud Monitoring dashboards for performance"
    echo "  3. Review logs for any errors or issues"
    echo "  4. Set up budget alerts (see GCP_COST_OPTIMIZATION_PLAN.md)"
    echo ""
    print_message "$YELLOW" "⚠️  Important Reminders:"
    echo "  - First request after scale-to-zero may have 2-5 second cold start"
    echo "  - Monitor query performance with Cloud SQL Insights"
    echo "  - Review costs in 24-48 hours to verify savings"
    echo ""
    print_message "$BLUE" "📚 Documentation: /GCP_COST_OPTIMIZATION_PLAN.md"
    echo ""
}

# Run main function
main "$@"
