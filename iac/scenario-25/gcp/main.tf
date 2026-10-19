# 시나리오 25 · 전용선 하나로 여러 리전·여러 VPC 연결 (GCP)
# 전역 동적 라우팅 VPC + 서울 Cloud Router 하나. 도쿄 서브넷은 추가만 하면 광고·경로가 따라온다

resource "google_compute_network" "global" {
  name                    = "vpc-global"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL" # 서울에서 배운 사내 경로를 모든 리전에
}

resource "google_compute_subnetwork" "seoul" {
  name          = "subnet-seoul"
  region        = "asia-northeast3"
  network       = google_compute_network.global.id
  ip_cidr_range = "10.20.10.0/24"
}

resource "google_compute_subnetwork" "tokyo" {
  name          = "subnet-tokyo"
  region        = "asia-northeast1"
  network       = google_compute_network.global.id
  ip_cidr_range = "10.40.10.0/24"
}

resource "google_compute_router" "seoul" {
  name    = "cr-seoul"
  region  = "asia-northeast3"
  network = google_compute_network.global.id
  bgp {
    asn = 64514
    # 기본 광고(ALL_SUBNETS)는 전역 모드에서 모든 리전 서브넷을 포함
  }
}
# 서울 VLAN 연결·BGP 피어는 시나리오 22 참고
