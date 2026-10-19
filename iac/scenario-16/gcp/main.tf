# 시나리오 16 · 개발·운영 분리와 공용 서비스 (GCP)
# vpc-dev ↔ vpc-shared, vpc-prod ↔ vpc-shared 피어링. dev ↔ prod는 만들지 않음 (피어링은 전이되지 않음)

variable "network_ids" { type = map(string) } # { shared = "projects/.../global/networks/vpc-shared", ... }
variable "sa_artifact" {}
variable "sa_prod_app" {}

# 피어링은 양쪽에서 각각 만들어야 활성화된다
resource "google_compute_network_peering" "dev_to_shared" {
  name         = "dev-to-shared"
  network      = var.network_ids["dev"]
  peer_network = var.network_ids["shared"]
}

resource "google_compute_network_peering" "shared_to_dev" {
  name         = "shared-to-dev"
  network      = var.network_ids["shared"]
  peer_network = var.network_ids["dev"]
}

resource "google_compute_network_peering" "prod_to_shared" {
  name         = "prod-to-shared"
  network      = var.network_ids["prod"]
  peer_network = var.network_ids["shared"]
}

resource "google_compute_network_peering" "shared_to_prod" {
  name         = "shared-to-prod"
  network      = var.network_ids["shared"]
  peer_network = var.network_ids["prod"]
}

# 받는 쪽 VPC의 방화벽을 열어야 한다
resource "google_compute_firewall" "artifact_from_envs" {
  name                    = "allow-artifact-from-envs"
  network                 = var.network_ids["shared"]
  direction               = "INGRESS"
  source_ranges           = ["10.10.0.0/16", "10.20.0.0/16"]
  target_service_accounts = [var.sa_artifact]
  allow {
    protocol = "tcp"
    ports    = ["443"]
  }
}

resource "google_compute_firewall" "prod_from_ci" {
  name                    = "allow-deploy-from-ci"
  network                 = var.network_ids["prod"]
  direction               = "INGRESS"
  source_ranges           = ["10.0.1.0/24"]
  target_service_accounts = [var.sa_prod_app]
  allow {
    protocol = "tcp"
    ports    = ["22", "443"]
  }
}
