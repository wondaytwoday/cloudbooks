# 시나리오 15 · 개발 서버: 나가는 통신만 열기 (GCP)
# 인터넷 경로는 자동 → 서브넷(비공개 Google 액세스) → 방화벽(IAP만) → Cloud NAT → 외부 IP 없는 VM

variable "image" {}

locals {
  region = "asia-northeast3"
}

resource "google_compute_network" "dev" {
  name                    = "vpc-dev"
  auto_create_subnetworks = false
}
# 0.0.0.0/0 → default-internet-gateway 경로, 묵시적 인그레스 거부·이그레스 허용은 자동

resource "google_compute_subnetwork" "dev" {
  name                     = "subnet-dev"
  region                   = local.region
  network                  = google_compute_network.dev.id
  ip_cidr_range            = "10.10.10.0/24"
  private_ip_google_access = true # Cloud Storage 등은 NAT 없이
}

resource "google_service_account" "dev" {
  account_id = "sa-dev"
}

# 22번은 IAP 대역에서만
resource "google_compute_firewall" "allow_iap_ssh" {
  name                    = "allow-iap-ssh"
  network                 = google_compute_network.dev.id
  direction               = "INGRESS"
  source_ranges           = ["35.235.240.0/20"]
  target_service_accounts = [google_service_account.dev.email]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_router" "dev" {
  name    = "router-dev"
  region  = local.region
  network = google_compute_network.dev.id
}

# 라우팅 테이블 작업 없이 외부 IP 없는 VM의 인터넷 트래픽을 처리
resource "google_compute_router_nat" "dev" {
  name                               = "nat-dev"
  router                             = google_compute_router.dev.name
  region                             = local.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

resource "google_compute_instance" "dev" {
  count        = 2
  name         = "dev-0${count.index + 1}"
  zone         = "${local.region}-a"
  machine_type = "e2-standard-2"
  boot_disk {
    initialize_params {
      image = var.image
    }
  }
  network_interface {
    subnetwork = google_compute_subnetwork.dev.id
    # access_config 블록이 없으므로 외부 IP 없음
  }
  service_account {
    email  = google_service_account.dev.email
    scopes = ["cloud-platform"]
  }
  metadata = {
    enable-oslogin = "TRUE"
  }
}
