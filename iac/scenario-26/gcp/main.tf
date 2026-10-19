# 시나리오 26 · 전용선 구간 암호화 (GCP)
# ① Interconnect MACsec  ② IPSEC 암호화 VLAN 연결 + HA VPN over Interconnect

variable "router_id" {}
variable "interconnect" {}
variable "network_id" {}

locals {
  region = "asia-northeast3"
}

resource "google_compute_interconnect_attachment" "encrypted" {
  name                     = "vlan-ipsec-a"
  region                   = local.region
  router                   = var.router_id
  interconnect             = var.interconnect
  type                     = "DEDICATED"
  encryption               = "IPSEC" # 이 연결에는 HA VPN 트래픽만
  ipsec_internal_addresses = [google_compute_address.vpn_range.self_link]
}

resource "google_compute_address" "vpn_range" {
  name          = "ha-vpn-over-ic"
  region        = local.region
  address_type  = "INTERNAL"
  purpose       = "IPSEC_INTERCONNECT"
  address       = "192.168.254.0"
  prefix_length = 29
  network       = var.network_id
}

resource "google_compute_ha_vpn_gateway" "over_ic" {
  name    = "havpn-over-ic"
  region  = local.region
  network = var.network_id
  vpn_interfaces {
    id                      = 0
    interconnect_attachment = google_compute_interconnect_attachment.encrypted.self_link
  }
  # 두 번째 인터페이스는 다른 엣지 도메인의 암호화 VLAN 연결로 (생략)
}
# MACsec은 google_compute_interconnect의 macsec 블록과 사내 라우터 키 설정으로 켠다
