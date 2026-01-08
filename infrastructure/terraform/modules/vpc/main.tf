# VPC Network Module for Perundhu
# ============================================
# Manages network infrastructure with configurable firewall rules

resource "google_compute_network" "vpc_network" {
  name                    = "${var.app_name}-${var.environment}-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_subnetwork" "public_subnet" {
  name          = "${var.app_name}-${var.environment}-public-subnet"
  ip_cidr_range = var.public_subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc_network.id

  # Enable Private Google Access for instances without external IPs
  private_ip_google_access = true
}

resource "google_compute_subnetwork" "private_subnet" {
  name          = "${var.app_name}-${var.environment}-private-subnet"
  ip_cidr_range = var.private_subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc_network.id

  # Enable Private Google Access
  private_ip_google_access = true
}

# NAT Gateway for outbound internet access from private subnet
resource "google_compute_router" "router" {
  name    = "${var.app_name}-${var.environment}-router"
  region  = var.region
  network = google_compute_network.vpc_network.id
}

resource "google_compute_router_nat" "nat" {
  name   = "${var.app_name}-${var.environment}-nat"
  router = google_compute_router.router.name
  region = var.region

  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# VPC Connector for Cloud Run to access VPC resources
resource "google_vpc_access_connector" "connector" {
  provider = google-beta

  name          = "${var.app_name}-${var.environment}-vpc-conn"
  region        = var.region
  ip_cidr_range = var.vpc_connector_cidr
  network       = google_compute_network.vpc_network.name

  min_instances = var.vpc_connector_min_instances
  max_instances = var.vpc_connector_max_instances
  machine_type  = var.vpc_connector_machine_type
}

# ============================================
# Firewall Rules (Configurable via variables)
# ============================================

resource "google_compute_firewall" "rules" {
  for_each = {
    for name, rule in var.firewall_rules :
    name => rule if rule.enable
  }

  name    = "${var.app_name}-${var.environment}-${each.key}"
  network = google_compute_network.vpc_network.name

  direction = each.value.direction
  priority  = each.value.priority

  dynamic "allow" {
    for_each = each.value.allow_rules
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  source_ranges = each.value.source_ranges
  target_tags   = each.value.target_tags
}

# Private Service Connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.app_name}-${var.environment}-private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_network.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}