# Preprod idempotent import blocks (Terraform 1.5+)
#
# WHY THIS FILE EXISTS:
# The preprod infrastructure was partially or fully provisioned before the GCS
# remote state was fully in sync (due to earlier 403/409 pipeline failures).
# These import blocks tell Terraform: "if this GCP resource exists but is not yet
# in remote state, import it instead of trying to create it (which would 409)."
#
# BEHAVIOUR:
#   - Resource already in remote state  → import block is a no-op (safe to leave permanently)
#   - Resource exists in GCP, not in state → imported and reconciled on next apply
#   - Resource does not exist in GCP     → apply fails with a clear error (expected)

# ── Project APIs ─────────────────────────────────────────────────────────────

import {
  id = "astute-strategy-406601/compute.googleapis.com"
  to = google_project_service.required_apis["compute.googleapis.com"]
}

import {
  id = "astute-strategy-406601/sqladmin.googleapis.com"
  to = google_project_service.required_apis["sqladmin.googleapis.com"]
}

import {
  id = "astute-strategy-406601/cloudbuild.googleapis.com"
  to = google_project_service.required_apis["cloudbuild.googleapis.com"]
}

import {
  id = "astute-strategy-406601/run.googleapis.com"
  to = google_project_service.required_apis["run.googleapis.com"]
}

import {
  id = "astute-strategy-406601/storage.googleapis.com"
  to = google_project_service.required_apis["storage.googleapis.com"]
}

import {
  id = "astute-strategy-406601/secretmanager.googleapis.com"
  to = google_project_service.required_apis["secretmanager.googleapis.com"]
}

import {
  id = "astute-strategy-406601/cloudresourcemanager.googleapis.com"
  to = google_project_service.required_apis["cloudresourcemanager.googleapis.com"]
}

import {
  id = "astute-strategy-406601/iam.googleapis.com"
  to = google_project_service.required_apis["iam.googleapis.com"]
}

import {
  id = "astute-strategy-406601/servicenetworking.googleapis.com"
  to = google_project_service.required_apis["servicenetworking.googleapis.com"]
}

# ── Service Accounts ─────────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/serviceAccounts/perundhu-preprod-backend@astute-strategy-406601.iam.gserviceaccount.com"
  to = module.iam.google_service_account.backend_service_account
}

import {
  id = "projects/astute-strategy-406601/serviceAccounts/perundhu-preprod-build@astute-strategy-406601.iam.gserviceaccount.com"
  to = module.iam.google_service_account.cloudbuild_service_account
}

# ── VPC ───────────────────────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/global/networks/perundhu-preprod-vpc"
  to = module.vpc.google_compute_network.vpc_network
}

import {
  id = "projects/astute-strategy-406601/regions/us-central1/subnetworks/perundhu-preprod-private-subnet"
  to = module.vpc.google_compute_subnetwork.private_subnet
}

import {
  id = "projects/astute-strategy-406601/regions/us-central1/subnetworks/perundhu-preprod-public-subnet"
  to = module.vpc.google_compute_subnetwork.public_subnet
}

import {
  id = "projects/astute-strategy-406601/global/addresses/perundhu-preprod-private-ip-address"
  to = module.vpc.google_compute_global_address.private_ip_address
}

import {
  id = "projects/astute-strategy-406601/regions/us-central1/routers/perundhu-preprod-router"
  to = module.vpc.google_compute_router.router
}

# ── Firewall ──────────────────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/global/firewalls/perundhu-preprod-allow-http-https"
  to = module.vpc.google_compute_firewall.rules["allow-http-https"]
}

import {
  id = "projects/astute-strategy-406601/global/firewalls/perundhu-preprod-allow-internal"
  to = module.vpc.google_compute_firewall.rules["allow-internal"]
}

# ── Service Networking ───────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/global/networks/perundhu-preprod-vpc:servicenetworking.googleapis.com"
  to = module.vpc.google_service_networking_connection.private_vpc_connection
}

# ── Cloud SQL ─────────────────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/instances/perundhu-preprod-mysql-us"
  to = module.database.google_sql_database_instance.mysql_instance
}

import {
  id = "projects/astute-strategy-406601/instances/perundhu-preprod-mysql-us/databases/perundhu"
  to = module.database.google_sql_database.database
}

import {
  id = "projects/astute-strategy-406601/instances/perundhu-preprod-mysql-us/databases/perundhu_test"
  to = module.database.google_sql_database.test_database[0]
}

import {
  id = "astute-strategy-406601/perundhu-preprod-mysql-us/%/perundhu_user"
  to = module.database.google_sql_user.users
}

import {
  id = "astute-strategy-406601/perundhu-preprod-mysql-us/%/perundhu_user_readonly"
  to = module.database.google_sql_user.readonly_user
}

# ── Cloud Storage ─────────────────────────────────────────────────────────────

import {
  id = "perundhu-preprod-images-cltmu9c3"
  to = module.storage.google_storage_bucket.images_bucket
}

# ── Secret Manager ────────────────────────────────────────────────────────────

import {
  id = "projects/astute-strategy-406601/secrets/db-username"
  to = module.secrets.google_secret_manager_secret.db_username
}

import {
  id = "projects/astute-strategy-406601/secrets/db-password"
  to = module.secrets.google_secret_manager_secret.db_password
}

import {
  id = "projects/astute-strategy-406601/secrets/preprod-db-url"
  to = module.secrets.google_secret_manager_secret.db_url
}

import {
  id = "projects/astute-strategy-406601/secrets/preprod-data-encryption-key"
  to = module.secrets.google_secret_manager_secret.data_encryption_key
}

import {
  id = "projects/astute-strategy-406601/secrets/preprod-jwt-secret"
  to = module.secrets.google_secret_manager_secret.jwt_secret
}

# ── Cloud Run ─────────────────────────────────────────────────────────────────

import {
  id = "locations/us-central1/namespaces/astute-strategy-406601/services/perundhu-backend-preprod"
  to = module.cloud_run.google_cloud_run_service.backend
}
