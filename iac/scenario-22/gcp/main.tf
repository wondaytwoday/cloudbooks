# 시나리오 22 · 전용선 이중화와 장애 전환 (GCP)
# Cloud Router 하나에 엣지 도메인이 다른 VLAN 연결 2개 + HA VPN 터널, 피어마다 광고 우선순위와 BFD

variable "network_id" {}
variable "interconnects" { type = map(string) } # { a = "...interconnects/ic-zone1", b = "...interconnects/ic-zone2" }
variable "vpn_tunnels" { type = map(string) }   # HA VPN 터널 (생략한 리소스)

locals {
  region = "asia-northeast3"
}

resource "google_compute_router" "corp" {
  name    = "cr-corp"
  region  = local.region
  network = var.network_id
  bgp {
    asn = 16550 # Partner면 16550, Dedicated는 사설 ASN 사용 가능
  }
}

resource "google_compute_interconnect_attachment" "vlan" {
  for_each     = var.interconnects
  name         = "vlan-${each.key}"
  region       = local.region
  router       = google_compute_router.corp.id
  interconnect = each.value
  type         = "DEDICATED"
}

resource "google_compute_router_interface" "vlan" {
  for_each                = var.interconnects
  name                    = "if-${each.key}"
  router                  = google_compute_router.corp.name
  region                  = local.region
  interconnect_attachment = google_compute_interconnect_attachment.vlan[each.key].self_link
}

# GCP → 사내 광고의 MED. 사내 → GCP 우선순위는 사내가 보내는 MED로 정해진다
resource "google_compute_router_peer" "vlan" {
  for_each                  = var.interconnects
  name                      = "peer-${each.key}"
  router                    = google_compute_router.corp.name
  region                    = local.region
  interface                 = google_compute_router_interface.vlan[each.key].name
  peer_asn                  = 65010
  advertised_route_priority = each.key == "a" ? 100 : 200
  bfd {
    session_initialization_mode = "ACTIVE"
    min_receive_interval        = 1000
    min_transmit_interval       = 1000
    multiplier                  = 5
  }
}

resource "google_compute_router_peer" "vpn" {
  for_each                  = var.vpn_tunnels
  name                      = "peer-vpn-${each.key}"
  router                    = google_compute_router.corp.name
  region                    = local.region
  interface                 = "if-vpn-${each.key}" # VPN 터널 인터페이스 (생략)
  peer_asn                  = 65010
  advertised_route_priority = 1000 # 최종 백업
}
