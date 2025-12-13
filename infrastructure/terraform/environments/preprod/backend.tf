# Backend configuration for Terraform state
# This file configures where Terraform stores its state

terraform {
  backend "gcs" {
    bucket = "perundhu-terraform-state-preprod"
    prefix = "preprod/state"
  }
}
