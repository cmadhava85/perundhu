# ============================================
# IAM Service Accounts and Role Assignments
# ============================================

# Service account for backend application
resource "google_service_account" "backend_service_account" {
  account_id   = "${var.app_name}-${var.environment}-backend"
  display_name = "${var.app_name} ${var.environment} Backend Service Account"
  description  = "Service account for ${var.app_name} backend application in ${var.environment}"
  project      = var.project_id
}

# Service account for Cloud Build
resource "google_service_account" "cloudbuild_service_account" {
  account_id   = "${var.app_name}-${var.environment}-build"
  display_name = "${var.app_name} ${var.environment} Cloud Build Service Account"
  description  = "Service account for ${var.app_name} Cloud Build in ${var.environment}"
  project      = var.project_id
}

# ============================================
# Backend Service Account IAM Roles
# ============================================

# Assign required roles to backend service account using for_each
resource "google_project_iam_member" "backend_roles" {
  for_each = toset(var.backend_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

# Assign optional roles to backend service account (based on feature flags)
resource "google_project_iam_member" "backend_optional_roles" {
  for_each = {
    for key, role_config in var.backend_optional_roles :
    key => role_config if role_config.enabled
  }

  project = var.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

# ============================================
# Cloud Build Service Account IAM Roles
# ============================================

# Assign roles to Cloud Build service account using for_each
resource "google_project_iam_member" "cloudbuild_roles" {
  for_each = toset(var.cloudbuild_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

# ============================================
# Custom Application Role
# ============================================

resource "google_project_iam_custom_role" "app_role" {
  count       = var.enable_custom_role ? 1 : 0
  project     = var.project_id
  role_id     = "${var.app_name}_${var.environment}_app_role"
  title       = "${var.app_name} ${var.environment} Application Role"
  description = "Custom role for ${var.app_name} application in ${var.environment}"

  permissions = var.custom_role_permissions
}

resource "google_project_iam_member" "backend_custom_role" {
  count   = var.enable_custom_role ? 1 : 0
  project = var.project_id
  role    = google_project_iam_custom_role.app_role[0].name
  member  = "serviceAccount:${google_service_account.backend_service_account.email}"
}

# ============================================
# Deployer actAs grant
# The SA that runs terraform apply (GitHub Actions) must have
# iam.serviceaccounts.actAs on the backend SA to set it as Cloud Run's identity.
# Scoped to the SA resource only — not a project-wide grant.
# ============================================

resource "google_service_account_iam_member" "deployer_actas_backend" {
  count              = var.deployer_sa_email != "" ? 1 : 0
  service_account_id = google_service_account.backend_service_account.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.deployer_sa_email}"
}
