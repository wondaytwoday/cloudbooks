# 시나리오 17 · 사내 전용 관리자 페이지 (GCP)
# HA VPN + Cloud Router → 리전 내부 Application LB(프록시 전용 서브넷) → admin MIG
# Cloud DNS 비공개 영역 + 인바운드 서버 정책

variable "network_id" {}
variable "admin_mig" {}
variable "sa_admin" {}

locals {
  region = "asia-northeast3"
}

# 리전 내부 Application LB의 Envoy가 쓰는 서브넷 (리전·VPC마다 하나)
resource "google_compute_subnetwork" "proxy_only" {
  name          = "proxy-only"
  region        = local.region
  network       = var.network_id
  ip_cidr_range = "10.20.250.0/23"
  purpose       = "REGIONAL_MANAGED_PROXY"
  role          = "ACTIVE"
}

# 백엔드가 보는 출발지는 사내 대역이 아니라 프록시 대역
resource "google_compute_firewall" "from_proxies" {
  name                    = "allow-proxies-to-admin"
  network                 = var.network_id
  direction               = "INGRESS"
  source_ranges           = ["10.20.250.0/23"]
  target_service_accounts = [var.sa_admin]
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
}

resource "google_compute_firewall" "health_checks" {
  name                    = "allow-hc-to-admin"
  network                 = var.network_id
  direction               = "INGRESS"
  source_ranges           = ["35.191.0.0/16", "130.211.0.0/22"]
  target_service_accounts = [var.sa_admin]
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
}

resource "google_compute_region_health_check" "admin" {
  name   = "hc-admin"
  region = local.region
  http_health_check {
    port         = 8080
    request_path = "/healthz"
  }
}

resource "google_compute_region_backend_service" "admin" {
  name                  = "be-admin"
  region                = local.region
  load_balancing_scheme = "INTERNAL_MANAGED"
  protocol              = "HTTP"
  health_checks         = [google_compute_region_health_check.admin.id]
  backend {
    group           = var.admin_mig
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

resource "google_compute_region_url_map" "admin" {
  name            = "um-admin"
  region          = local.region
  default_service = google_compute_region_backend_service.admin.id
}

resource "google_compute_region_target_http_proxy" "admin" {
  name    = "px-admin" # 실제로는 HTTPS 프록시 + 인증서
  region  = local.region
  url_map = google_compute_region_url_map.admin.id
}

resource "google_compute_forwarding_rule" "admin" {
  name                  = "fr-admin"
  region                = local.region
  load_balancing_scheme = "INTERNAL_MANAGED"
  network               = var.network_id
  subnetwork            = "subnet-app"
  ip_address            = "10.20.10.100"
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.admin.id
  depends_on            = [google_compute_subnetwork.proxy_only]
}

resource "google_dns_managed_zone" "corp" {
  name       = "corp"
  dns_name   = "corp.example.com."
  visibility = "private"
  private_visibility_config {
    networks {
      network_url = var.network_id
    }
  }
}

resource "google_dns_record_set" "admin" {
  managed_zone = google_dns_managed_zone.corp.name
  name         = "admin.corp.example.com."
  type         = "A"
  ttl          = 300
  rrdatas      = ["10.20.10.100"]
}

# 사내 DNS가 전달할 진입 IP를 만든다
resource "google_dns_policy" "inbound" {
  name                      = "inbound-from-corp"
  enable_inbound_forwarding = true
  networks {
    network_url = var.network_id
  }
}
# HA VPN·Cloud Router는 시나리오 06 참고. 기본 광고 모드는 서브넷만 → Cloud SQL 대역은 사내에 광고되지 않음
