# Backend configuration for Terraform state
# This file configures where Terraform stores its state

terraform {
  backend "gcs" {
    bucket = "astute-strategy-406601-tf-state"
    prefix = "preprod/state"
  }
}
