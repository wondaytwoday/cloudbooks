resource "google_compute_router" "corp" {
  name    = "corp-router"
  region  = "asia-northeast3"
  network = google_compute_network.main.id

  bgp {
    asn               = 64514 # Dedicated는 사설 ASN (Partner Interconnect라면 16550)
    advertise_mode    = "CUSTOM"
    advertised_groups = []
    advertised_ip_ranges {
      range = "10.32.0.0/12" # 사내로 광고할 클라우드 대역만
    }
  }
}

# 전용선: Dedicated Interconnect의 VLAN 연결 (연결마다 하나, 99.99% 구성은 2개 도시권 × 2)
resource "google_compute_interconnect_attachment" "seoul_a" {
  name                     = "corp-vlan-a"
  region                   = "asia-northeast3"
  type                     = "DEDICATED"
  router                   = google_compute_router.corp.id
  interconnect             = "https://www.googleapis.com/compute/v1/projects/corp-net/global/interconnects/seoul-zone1"
  edge_availability_domain = "AVAILABILITY_DOMAIN_1"
  bandwidth                = "BPS_10G"
}

# 백업: HA VPN (인터페이스 2개 모두에 터널을 연결해야 99.99% 구성)
resource "google_compute_ha_vpn_gateway" "corp" {
  name    = "corp-ha-vpn"
  region  = "asia-northeast3"
  network = google_compute_network.main.id
}

resource "google_compute_vpn_tunnel" "corp_0" {
  name                            = "corp-tunnel-0"
  region                          = "asia-northeast3"
  vpn_gateway                     = google_compute_ha_vpn_gateway.corp.id
  vpn_gateway_interface           = 0
  peer_external_gateway           = google_compute_external_vpn_gateway.corp.id
  peer_external_gateway_interface = 0
  router                          = google_compute_router.corp.id
  shared_secret                   = var.vpn_psk
}

variable "vpn_psk" {
  type      = string
  sensitive = true
}

# 백업 경로는 경로 우선순위(MED)를 높여 평소에는 쓰지 않음
resource "google_compute_router_peer" "vpn_0" {
  name                      = "corp-vpn-0"
  region                    = "asia-northeast3"
  router                    = google_compute_router.corp.name
  interface                 = "corp-vpn-if-0"
  peer_asn                  = 65010
  advertised_route_priority = 200
}

# DNS: 사내 도메인을 사내 DNS로 전달
resource "google_dns_managed_zone" "corp" {
  name       = "corp-forward"
  dns_name   = "corp.example.local."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.0.0.53"
      forwarding_path = "private"
    }
  }
}

# 두 번째 터널·인터페이스, 외부 VPN 게이트웨이, 인바운드 DNS 서버 정책은 생략
