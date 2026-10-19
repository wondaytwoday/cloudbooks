# 시나리오 24 · 클라우드 대역이 사내와 겹칠 때 (GCP)
# PRIVATE_NAT 서브넷 + Private NAT(하이브리드 대상), Cloud Router 맞춤 광고는 출입문 대역만

variable "network_id" {}
variable "work_subnet_id" {}

locals {
  region = "asia-northeast3"
}

resource "google_compute_subnetwork" "nat" {
  name          = "private-nat"
  region        = local.region
  network       = var.network_id
  ip_cidr_range = "100.64.20.0/24"
  purpose       = "PRIVATE_NAT"
}

resource "google_compute_router" "corp" {
  name    = "cr-corp"
  region  = local.region
  network = var.network_id
  bgp {
    asn            = 64514
    advertise_mode = "CUSTOM" # ALL_SUBNETS를 넣지 않는다 → 10.10.0.0/16 비광고
    advertised_ip_ranges {
      range = "100.64.20.0/23"
    }
  }
}

resource "google_compute_router_nat" "private" {
  name                                = "pnat-hybrid"
  router                              = google_compute_router.corp.name
  region                              = local.region
  type                                = "PRIVATE"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"
  enable_dynamic_port_allocation     = false
  subnetwork {
    name                    = var.work_subnet_id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }
  rules {
    rule_number = 100
    match       = "nexthop.is_hybrid" # Interconnect·VPN 너머 대상 (기능 범위는 문서 확인)
    action {
      source_nat_active_ranges = [google_compute_subnetwork.nat.self_link]
    }
  }
}
