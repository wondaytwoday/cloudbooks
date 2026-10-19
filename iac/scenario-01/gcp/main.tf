# 시나리오 01 · 3티어 웹서비스 (GCP)
# 구축 순서대로: VPC → 서브넷 1개 → (인터넷 경로는 자동) → 방화벽 규칙 → Cloud Router·NAT
#              → 비공개 서비스 액세스·Cloud SQL → 템플릿·리전 MIG → 전역 외부 Application LB
# 인터넷 게이트웨이와 라우팅 테이블 리소스가 없다는 점을 AWS와 비교해 보자.

variable "image" {}
variable "domain" {}

locals {
  region = "asia-northeast3"
}

# 1. VPC 네트워크: 전역, IP 대역 없음
resource "google_compute_network" "main" {
  name                    = "vpc-shop"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}
# 0.0.0.0/0 → default-internet-gateway 경로는 네트워크와 함께 자동 생성된다

# 2. 서브넷: 리전 하나에 하나, 모든 영역에서 쓴다
resource "google_compute_subnetwork" "app" {
  name                     = "subnet-app"
  region                   = local.region
  network                  = google_compute_network.main.id
  ip_cidr_range            = "10.0.10.0/24"
  private_ip_google_access = true # 외부 IP 없는 VM이 Google API에 닿도록
}

# 3. 방화벽 규칙: VPC에 만들고 대상은 서비스 계정으로 고른다
resource "google_service_account" "app" {
  account_id = "sa-app"
}

resource "google_compute_firewall" "allow_lb_health" {
  name                    = "allow-lb-health"
  network                 = google_compute_network.main.id
  direction               = "INGRESS"
  source_ranges           = ["35.191.0.0/16", "130.211.0.0/22"] # LB·헬스체크 대역
  target_service_accounts = [google_service_account.app.email]
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
}

resource "google_compute_firewall" "allow_iap_ssh" {
  name                    = "allow-iap-ssh"
  network                 = google_compute_network.main.id
  direction               = "INGRESS"
  source_ranges           = ["35.235.240.0/20"] # IAP TCP 전달
  target_service_accounts = [google_service_account.app.email]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}
# 묵시적 규칙: 인그레스 전부 거부, 이그레스 전부 허용 (우선순위 65535)

# 4. Cloud Router + Cloud NAT: 리전에 하나, 경로 설정 없음
resource "google_compute_router" "main" {
  name    = "router-seoul"
  region  = local.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "nat-seoul"
  router                             = google_compute_router.main.name
  region                             = local.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  min_ports_per_vm                   = 64
}

# 5. 비공개 서비스 액세스 + Cloud SQL HA
resource "google_compute_global_address" "psa" {
  name          = "psa-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  address       = "10.100.0.0"
  prefix_length = 20
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "psa" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.psa.name]
}

resource "google_sql_database_instance" "main" {
  name                = "shop-db"
  database_version    = "MYSQL_8_0"
  region              = local.region
  deletion_protection = true
  depends_on          = [google_service_networking_connection.psa]
  settings {
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL" # 다른 영역에 대기 인스턴스
    backup_configuration {
      enabled            = true
      binary_log_enabled = true
    }
    ip_configuration {
      ipv4_enabled    = false # 공인 IP 없음
      private_network = google_compute_network.main.id
    }
  }
}

# 6. 인스턴스 템플릿 + 리전 MIG + 오토스케일러
resource "google_compute_instance_template" "app" {
  name_prefix  = "it-app-"
  machine_type = "e2-standard-2"
  disk {
    source_image = var.image
  }
  network_interface {
    subnetwork = google_compute_subnetwork.app.id
    # access_config 블록이 없으므로 외부 IP 없음
  }
  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }
}

resource "google_compute_region_instance_group_manager" "app" {
  name                      = "mig-app"
  region                    = local.region
  base_instance_name        = "app"
  distribution_policy_zones = ["asia-northeast3-a", "asia-northeast3-b", "asia-northeast3-c"]
  version {
    instance_template = google_compute_instance_template.app.id
  }
  named_port {
    name = "http"
    port = 8080
  }
  auto_healing_policies {
    health_check      = google_compute_health_check.app.id
    initial_delay_sec = 300
  }
}

resource "google_compute_region_autoscaler" "app" {
  name   = "as-app"
  region = local.region
  target = google_compute_region_instance_group_manager.app.id
  autoscaling_policy {
    min_replicas = 3
    max_replicas = 20
    cpu_utilization {
      target = 0.6
    }
  }
}

# 7. 전역 외부 Application LB: 리소스 여러 개를 이어 붙인다 (VPC 밖)
resource "google_compute_health_check" "app" {
  name = "hc-app"
  http_health_check {
    port         = 8080
    request_path = "/healthz"
  }
}

resource "google_compute_backend_service" "app" {
  name                  = "be-app"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  port_name             = "http"
  health_checks         = [google_compute_health_check.app.id]
  backend {
    group = google_compute_region_instance_group_manager.app.instance_group
  }
}

resource "google_compute_url_map" "web" {
  name            = "um-web"
  default_service = google_compute_backend_service.app.id
}

resource "google_compute_managed_ssl_certificate" "web" {
  name = "cert-web"
  managed {
    domains = [var.domain]
  }
}

resource "google_compute_target_https_proxy" "web" {
  name             = "px-web"
  url_map          = google_compute_url_map.web.id
  ssl_certificates = [google_compute_managed_ssl_certificate.web.id]
}

resource "google_compute_global_address" "web" {
  name = "ip-web"
}

resource "google_compute_global_forwarding_rule" "web" {
  name                  = "fr-web"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_https_proxy.web.id
  ip_address            = google_compute_global_address.web.id
  port_range            = "443"
}
