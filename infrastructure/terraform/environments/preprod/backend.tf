# Backend configuration for Terraform state
# This file configures where Terraform stores its state

terraform {
  backend "gcs" {
    bucket = "perundhu-prod-001-tf-state-1767644488"
    prefix = "preprod/state"
  }
}
