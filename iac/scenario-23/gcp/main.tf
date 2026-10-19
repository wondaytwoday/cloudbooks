# 시나리오 23 · 사내 서버가 전용선으로 관리형 서비스 쓰기 (GCP)
# Cloud Router 맞춤 광고(서브넷 + private.googleapis.com + Cloud SQL 대역), PSA 피어링 커스텀 경로 교환

variable "network_name" {}
variable "network_id" {}

resource "google_compute_router" "corp" {
  name    = "cr-corp"
  region  = "asia-northeast3"
  network = var.network_id
  bgp {
    asn               = 64514
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]
    advertised_ip_ranges {
      range       = "199.36.153.8/30" # private.googleapis.com
      description = "Google APIs for on-prem"
    }
    advertised_ip_ranges {
      range       = "10.100.0.0/20" # 비공개 서비스 액세스(Cloud SQL) 할당 대역
      description = "Cloud SQL"
    }
  }
}

# Cloud SQL이 있는 Google 관리 VPC와 경로 교환: 사내 경로를 내보내야 응답이 돌아온다
resource "google_compute_network_peering_routes_config" "psa" {
  peering              = "servicenetworking-googleapis-com"
  network              = var.network_name
  export_custom_routes = true
  import_custom_routes = true
}
# 사내 DNS: *.googleapis.com CNAME private.googleapis.com, private.googleapis.com A 199.36.153.8~11
