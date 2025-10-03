# Backend configuration for Terraform state
# This file configures where Terraform stores its state

terraform {
  backend "gcs" {
    # bucket  = "your-project-terraform-state-preprod"  # Configured via deploy script
    # prefix  = "preprod/state"                         # Configured via deploy script
  }
}
