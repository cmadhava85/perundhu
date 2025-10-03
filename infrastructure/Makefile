# Makefile for Perundhu Infrastructure

.PHONY: help init plan apply destroy clean validate fmt check

# Default values
PROJECT_ID ?= 
ENVIRONMENT ?= preprod
REGION ?= us-central1

help: ## Show this help message
	@echo "Perundhu Infrastructure Management"
	@echo "================================="
	@echo "Usage: make [target] [PROJECT_ID=your-project]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make plan PROJECT_ID=my-gcp-project"
	@echo "  make apply PROJECT_ID=my-gcp-project ENVIRONMENT=preprod"
	@echo "  make destroy PROJECT_ID=my-gcp-project"

check-project: ## Check if PROJECT_ID is set
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "Error: PROJECT_ID is required. Usage: make [target] PROJECT_ID=your-project-id"; \
		exit 1; \
	fi

init: check-project ## Initialize Terraform
	@echo "Initializing Terraform for $(ENVIRONMENT) environment..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform init \
			-backend-config="bucket=$(PROJECT_ID)-terraform-state-$(ENVIRONMENT)" \
			-backend-config="prefix=$(ENVIRONMENT)/state"

validate: ## Validate Terraform configuration
	@echo "Validating Terraform configuration..."
	@cd terraform/environments/$(ENVIRONMENT) && terraform validate

fmt: ## Format Terraform code
	@echo "Formatting Terraform code..."
	@terraform fmt -recursive terraform/

plan: check-project init ## Plan infrastructure changes
	@echo "Planning infrastructure changes for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform plan \
			-var="project_id=$(PROJECT_ID)" \
			-var="region=$(REGION)"

apply: check-project init ## Apply infrastructure changes
	@echo "Applying infrastructure changes for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform apply \
			-var="project_id=$(PROJECT_ID)" \
			-var="region=$(REGION)"

apply-auto: check-project init ## Apply infrastructure changes without confirmation
	@echo "Auto-applying infrastructure changes for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform apply \
			-var="project_id=$(PROJECT_ID)" \
			-var="region=$(REGION)" \
			-auto-approve

output: ## Show Terraform outputs
	@echo "Showing outputs for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && terraform output

destroy: check-project ## Destroy infrastructure
	@echo "Destroying infrastructure for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform destroy \
			-var="project_id=$(PROJECT_ID)" \
			-var="region=$(REGION)"

destroy-auto: check-project ## Destroy infrastructure without confirmation
	@echo "Auto-destroying infrastructure for $(ENVIRONMENT)..."
	@cd terraform/environments/$(ENVIRONMENT) && \
		terraform destroy \
			-var="project_id=$(PROJECT_ID)" \
			-var="region=$(REGION)" \
			-auto-approve

clean: ## Clean Terraform cache
	@echo "Cleaning Terraform cache..."
	@find terraform/ -name ".terraform" -type d -exec rm -rf {} + 2>/dev/null || true
	@find terraform/ -name "*.tfstate*" -type f -delete 2>/dev/null || true
	@find terraform/ -name ".terraform.lock.hcl" -type f -delete 2>/dev/null || true

setup-gcp: check-project ## Set up GCP project with required APIs
	@echo "Setting up GCP project $(PROJECT_ID)..."
	@gcloud config set project $(PROJECT_ID)
	@gcloud services enable \
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
	@echo "GCP project setup complete!"

state-bucket: check-project ## Create Terraform state bucket
	@echo "Creating Terraform state bucket..."
	@gsutil mb -p $(PROJECT_ID) -l $(REGION) gs://$(PROJECT_ID)-terraform-state-$(ENVIRONMENT) || true
	@gsutil versioning set on gs://$(PROJECT_ID)-terraform-state-$(ENVIRONMENT)
	@echo "State bucket created successfully!"

full-setup: check-project setup-gcp state-bucket ## Complete setup (GCP + state bucket)
	@echo "Full setup complete for project $(PROJECT_ID)!"

# Deploy using script
deploy: check-project ## Deploy using deploy script
	@./deploy.sh -p $(PROJECT_ID) -e $(ENVIRONMENT) -r $(REGION)

deploy-auto: check-project ## Deploy using script with auto-approve
	@./deploy.sh -p $(PROJECT_ID) -e $(ENVIRONMENT) -r $(REGION) -y

# Show resource costs (requires gcloud billing)
costs: check-project ## Show estimated costs
	@echo "Checking resource costs for $(PROJECT_ID)..."
	@gcloud billing budgets list --filter="displayName:$(PROJECT_ID)" || echo "No budgets found"
	@gcloud compute instances list --project=$(PROJECT_ID) || echo "No compute instances"
	@gcloud sql instances list --project=$(PROJECT_ID) || echo "No SQL instances"
	@gcloud redis instances list --region=$(REGION) --project=$(PROJECT_ID) || echo "No Redis instances"

# Security check
security-check: ## Run security checks on Terraform code
	@echo "Running security checks..."
	@command -v tfsec >/dev/null 2>&1 && tfsec terraform/ || echo "tfsec not installed. Install with: brew install tfsec"
	@command -v checkov >/dev/null 2>&1 && checkov -d terraform/ || echo "checkov not installed. Install with: pip install checkov"
