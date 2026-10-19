# 시나리오 18 · 파트너가 고정 IP를 요구할 때 (GCP)
# 예약한 고정 IP를 Cloud NAT에 수동 지정, Cloud Armor로 웹훅 출처 제한

variable "router_name" {}
variable "backend_service_name" {}

locals {
  region       = "asia-northeast3"
  partner_cidr = "203.0.113.0/28"
}

resource "google_compute_address" "nat" {
  count  = 2
  name   = "nat-partner-${count.index + 1}"
  region = local.region
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_router_nat" "partner" {
  name                               = "nat-prod"
  router                             = var.router_name
  region                             = local.region
  nat_ip_allocate_option             = "MANUAL_ONLY" # 등록한 IP만 사용
  nat_ips                            = google_compute_address.nat[*].self_link
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  min_ports_per_vm                   = 256 # 포트 × VM 수 ≤ IP 수 × 약 64,000
  # 외부 IP가 있는 VM 인터페이스는 이 NAT를 쓰지 않는다
}

# LB 앞단에서 출처를 거른다 (백엔드 방화벽은 LB 대역만 봄)
resource "google_compute_security_policy" "webhook" {
  name = "webhook-partner-only"
  rule {
    action   = "allow"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [local.partner_cidr]
      }
    }
  }
  rule {
    action   = "deny(403)"
    priority = 2147483647 # 기본 규칙
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
# 백엔드 서비스(google_compute_backend_service)의 security_policy에 위 정책을 지정
